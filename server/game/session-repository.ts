import type {
  CharacterProjection,
  CreateGameSessionRequest,
  GameMessage,
  GameSessionSnapshot,
  GameSessionSummary,
  GameTurnCommand,
  GameTurnResponse,
  InventoryItemProjection,
  JournalEntryProjection,
  LocationProjection,
  PlayerPersona,
  SuggestedAction,
} from '../../shared/game'
import { STORY_PACKS } from '../../shared/storypacks'
import type { StoryPackId } from '../../shared/storypacks'
import type { SafeModelRun } from '../ai/http'
import { AiExecutionError, FabulaApiError } from '../ai/http'
import type { ExpectedInventoryState, TurnOperation, TurnOutput } from '../ai/contracts'
import { ALLOWED_TURN_OPERATION_TYPES, getStoryPackContext } from './storypack-context'

export interface SessionTurnResult {
  output: TurnOutput
  model: string
  fallbackUsed: boolean
  advisoryUsed: boolean
  modelRuns?: SafeModelRun[]
}

export type TurnOutputValidator = (output: TurnOutput) => void

export interface JournalProjectionDraft {
  id: string
  entry_type: JournalEntryProjection['entry_type']
  title: string
  summary: string
  uncertainty: JournalEntryProjection['uncertainty']
  source_event_ids: string[]
  involved_entity_ids: string[]
  story_time: string
}

export interface CharacterProjectionUpdateDraft {
  character_id: string
  source_event_ids: string[]
  relation: string | null
  description: string | null
  knowledge_summary: string | null
}

export interface JournalProjectionContext {
  snapshot: EngineSessionSnapshot
  output: TurnOutput
  sourceEventIds: string[]
  reservedJournalIds: string[]
}

export interface JournalProjectionResult {
  entries: JournalProjectionDraft[]
  characterUpdates: CharacterProjectionUpdateDraft[]
  fallbackUsed: boolean
  modelRuns: SafeModelRun[]
}

export type JournalProjector = (
  context: JournalProjectionContext,
) => Promise<JournalProjectionResult>

export interface EngineSessionSnapshot {
  sessionId: string
  storyPackId: StoryPackId
  storyPackVersion: '0.2'
  version: number
  persona: PlayerPersona
  scene: GameSessionSnapshot['scene']
  inventory: InventoryItemProjection[]
  journal: JournalEntryProjection[]
  characters: CharacterProjection[]
  locations: LocationProjection[]
  history: Array<{
    turnId: string
    sceneId: string | null
    mode: GameTurnCommand['mode']
    playerText: string
    outcome: string
    narrative: string
    costsAndConsequences: string[]
    unresolvedAmbiguities: string[]
  }>
  confirmedEvents: StoredEvent[]
  confirmedFacts: StoredFact[]
  knowledge: StoredKnowledge[]
  reservedIds: {
    events: string[]
    facts: string[]
    itemInstances: string[]
    scenes: string[]
  }
  allowedOperationTypes: readonly string[]
}

interface StoredEvent {
  id: string
  kind: string
  actorIds: string[]
  targetIds: string[]
  itemIds: string[]
  locationId: string
  sourceTurnId: string
  createdAt: string
}

interface StoredFact {
  id: string
  claim: string
  truthStatus: 'observed' | 'reported' | 'inferred' | 'contested'
  sourceEventIds: string[]
  createdAt: string
}

interface StoredKnowledge {
  characterId: string
  factId: string
  sourceEventId: string
  confidence: number
}

interface StoredTurn {
  turnId: string
  sceneId?: string
  mode: GameTurnCommand['mode']
  playerText: string
  outcome: string
  narrative: string
  costsAndConsequences?: string[]
  unresolvedAmbiguities?: string[]
}

interface StoredIdempotencyRecord {
  key: string
  fingerprint: string
  response: GameTurnResponse
}

interface StoredGameSession {
  snapshot: GameSessionSnapshot
  ownerId: string
  events: StoredEvent[]
  facts: StoredFact[]
  knowledge: StoredKnowledge[]
  turns: StoredTurn[]
  idempotency: StoredIdempotencyRecord[]
  stateRevisions?: {
    zeroLineOpeningPresence?: 1
  }
}

export interface GameSessionStorage {
  getItem<T>(key: string): Promise<T | null>
  setItem<T>(key: string, value: T): Promise<void>
  getKeys(): Promise<string[]>
}

interface InFlightTurn {
  fingerprint: string
  promise: Promise<GameTurnResponse>
}

function nowIso(): string {
  return new Date().toISOString()
}

function sessionKey(sessionId: string): string {
  return `sessions:${sessionId}`
}

function fingerprint(command: GameTurnCommand): string {
  const source = JSON.stringify(command)
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}:${source.length}`
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function makeMessage(
  input: Omit<GameMessage, 'id' | 'created_at' | 'selected_items' | 'selected_journal_entries'>
    & {
      selected_items?: InventoryItemProjection[]
      selected_journal_entries?: JournalEntryProjection[]
    },
): GameMessage {
  return {
    ...input,
    selected_items: clone(input.selected_items || []),
    selected_journal_entries: clone(input.selected_journal_entries || []),
    id: `message:${globalThis.crypto.randomUUID()}`,
    created_at: nowIso(),
  }
}

function defaultJournalProjection(
  command: GameTurnCommand,
  output: TurnOutput,
  sourceEventIds: string[],
  storyTime: string,
  entryId = `journal:${globalThis.crypto.randomUUID()}`,
): JournalProjectionDraft {
  return {
    id: entryId,
    entry_type: command.mode === 'exploration' ? 'clue' : 'event',
    title: output.resolution.summary.slice(0, 80),
    summary: output.resolution.summary,
    uncertainty: output.audit.unresolved_ambiguities.length ? 'suspected' : 'confirmed',
    source_event_ids: [...sourceEventIds],
    involved_entity_ids: [...new Set([
      'player',
      ...output.intent.targets,
      ...output.intent.referenced_entities,
    ])],
    story_time: storyTime,
  }
}

function assertJournalProjection(
  entries: JournalProjectionDraft[],
  reservedJournalIds: string[],
  sourceEventIds: string[],
): void {
  if (entries.length > reservedJournalIds.length)
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Журнал создал незарезервированную запись.', 502)
  const reserved = new Set(reservedJournalIds)
  const committedEvents = new Set(sourceEventIds)
  for (const entry of entries) {
    if (!reserved.has(entry.id))
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Журнал использовал незарезервированный ID.', 502)
    if (!entry.source_event_ids.length || entry.source_event_ids.some(eventId => !committedEvents.has(eventId)))
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Журнал сослался на неподтвержденное событие.', 502)
    if (!entry.title.trim() || entry.title.length > 160 || !entry.summary.trim() || entry.summary.length > 2_000)
      throw new FabulaApiError('MODEL_CONTRACT_ERROR', 'Журнал вернул некорректный текст.', 502)
  }
}

function assertCharacterProjectionUpdates(
  updates: CharacterProjectionUpdateDraft[],
  characters: CharacterProjection[],
  sourceEventIds: string[],
): void {
  const knownCharacters = new Set(characters.map(character => character.id))
  const committedEvents = new Set(sourceEventIds)
  const seenCharacters = new Set<string>()
  for (const update of updates) {
    if (!knownCharacters.has(update.character_id) || seenCharacters.has(update.character_id))
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Индекс персонажей использовал неизвестного или повторного персонажа.', 502)
    seenCharacters.add(update.character_id)
    if (!update.source_event_ids.length
      || update.source_event_ids.some(eventId => !committedEvents.has(eventId))) {
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Индекс персонажей сослался на неподтвержденное событие.', 502)
    }
    const values = [update.relation, update.description, update.knowledge_summary]
    if (values.every(value => value === null)
      || values.some(value => value !== null && (!value.trim() || value.length > 2_000))) {
      throw new FabulaApiError('MODEL_CONTRACT_ERROR', 'Индекс персонажей вернул некорректное обновление.', 502)
    }
  }
}

function makeSuggestions(
  suggestions: Array<{ id?: string, label: string, mode: SuggestedAction['mode'], intent_hint?: string, intentHint?: string }>,
  turnId?: string,
): SuggestedAction[] {
  return suggestions.slice(0, 6).map((suggestion, index) => ({
    id: suggestion.id || `suggestion:${turnId || 'opening'}:${index}`,
    label: suggestion.label,
    mode: suggestion.mode,
    intent_hint: suggestion.intent_hint || suggestion.intentHint || suggestion.label,
  }))
}

function summaryOf(session: StoredGameSession): GameSessionSummary {
  const { snapshot } = session
  const pack = STORY_PACKS[snapshot.story_pack_id]
  const lastMessage = [...snapshot.messages].reverse().find(message => message.role !== 'system')
  return {
    id: snapshot.id,
    story_pack_id: snapshot.story_pack_id,
    story_pack_version: snapshot.story_pack_version,
    story_title: pack.title,
    story_cover: pack.cover,
    persona_name: snapshot.persona.name,
    role_label: snapshot.persona.role_label,
    status: snapshot.status,
    version: snapshot.version,
    scene_title: snapshot.scene.title,
    updated_at: snapshot.updated_at,
    last_excerpt: lastMessage?.text.slice(0, 150) || pack.opening.objective,
  }
}

function makePersona(request: CreateGameSessionRequest): PlayerPersona {
  const pack = STORY_PACKS[request.story_pack_id]
  const role = pack.roles.find(candidate => candidate.id === request.persona.role_id)
  if (!role)
    throw new FabulaApiError('ROLE_NOT_FOUND', 'Выбранная роль больше недоступна для этого StoryPack.', 409)
  const freeDescription = request.persona.competence || request.persona.embodiment_note || role.competence
  return {
    ...request.persona,
    role_label: request.persona.role_label || role.label,
    competence: role.id.endsWith(':free') ? freeDescription : request.persona.competence || role.competence,
    limitation: request.persona.limitation || (role.id.endsWith(':free')
      ? 'Ограничение выводится только из явно указанного описания и правил мира'
      : role.limitation),
    background: request.persona.background || '',
  }
}

function makeStartingInventory(request: CreateGameSessionRequest, persona: PlayerPersona): InventoryItemProjection[] {
  const pack = STORY_PACKS[request.story_pack_id]
  const role = pack.roles.find(candidate => candidate.id === persona.role_id)
  const item = role?.startingItem
  if (!item)
    return []
  return [{
    id: `item:${globalThis.crypto.randomUUID()}`,
    template_id: `item-template:${request.story_pack_id}:${item.templateId}`,
    name: item.name,
    category: item.category,
    description: item.description,
    quantity: item.quantity,
    charges: item.charges,
    condition: item.condition,
    owner_id: 'player',
    owner_name: persona.name,
    holder_id: 'player',
    holder_name: persona.name,
    location_id: pack.publicLocations[0]?.id || pack.opening.sceneId.replace('scene:', 'location:'),
    location_name: pack.opening.location,
    slot: item.slot,
    version: 0,
    provenance: {
      kind: 'starting_equipment',
      source_event_id: null,
      summary: `Начальный предмет роли «${persona.role_label}» в истории «${pack.title}».`,
    },
  }]
}

function characterProjection(storyPackId: StoryPackId, characterId: string): CharacterProjection | null {
  const character = STORY_PACKS[storyPackId].publicCharacters.find(candidate => candidate.id === characterId)
  return character ? {
    ...character,
    knowledge_summary: 'Знает только то, чему был доступный источник',
  } : null
}

function makeCharacters(storyPackId: StoryPackId): CharacterProjection[] {
  return STORY_PACKS[storyPackId].opening.knownCharacterIds
    .map(characterId => characterProjection(storyPackId, characterId))
    .filter((character): character is CharacterProjection => character !== null)
}

function locationProjection(storyPackId: StoryPackId, locationId: string, status: string): LocationProjection | null {
  const location = STORY_PACKS[storyPackId].publicLocations.find(candidate => candidate.id === locationId)
  return location ? { ...location, status } : null
}

function makeLocations(storyPackId: StoryPackId): LocationProjection[] {
  const current = STORY_PACKS[storyPackId].publicLocations[0]
  return current ? [{ ...current, status: 'Текущая локация' }] : []
}

function normalizeStoredSession(value: StoredGameSession): StoredGameSession {
  const session = clone(value)
  const pack = STORY_PACKS[session.snapshot.story_pack_id]
  if (typeof session.snapshot.persona.background !== 'string')
    session.snapshot.persona.background = ''
  session.snapshot.messages.forEach((message) => {
    if (!Array.isArray(message.selected_items))
      message.selected_items = []
    message.selected_items.forEach(item => normalizeItemProvenance(item))
    if (!Array.isArray(message.selected_journal_entries))
      message.selected_journal_entries = []
  })
  session.snapshot.suggestions = makeSuggestions(
    session.snapshot.suggestions,
    `${session.snapshot.id}:${session.snapshot.version}`,
  )
  if (!Array.isArray(session.snapshot.scene.present_character_ids))
    session.snapshot.scene.present_character_ids = [...pack.opening.presentCharacterIds]
  if (pack.id === 'zero-line' && session.stateRevisions?.zeroLineOpeningPresence !== 1) {
    const hasLegacyOpeningPresence = session.snapshot.scene.id === pack.opening.sceneId
      && session.snapshot.scene.present_character_ids.length === 1
      && session.snapshot.scene.present_character_ids[0] === 'character:nina-gromova'
    if (hasLegacyOpeningPresence)
      session.snapshot.scene.present_character_ids = []
    session.stateRevisions = {
      ...session.stateRevisions,
      zeroLineOpeningPresence: 1,
    }
  }
  if (session.snapshot.version === 0) {
    session.snapshot.characters = makeCharacters(pack.id)
    session.snapshot.locations = makeLocations(pack.id)
  }
  session.snapshot.inventory.forEach((item) => {
    normalizeItemProvenance(item)
    if (item.location_name === pack.opening.location && item.location_id !== session.snapshot.scene.location_id)
      item.location_id = session.snapshot.scene.location_id
  })
  return session
}

function normalizeItemProvenance(item: InventoryItemProjection): void {
  if (item.provenance)
    return
  item.provenance = {
    kind: 'legacy_snapshot',
    source_event_id: null,
    summary: 'Предмет уже находился в инвентаре до включения учета происхождения.',
  }
}

function makeReservedIds(sessionId: string, nextVersion: number) {
  return {
    events: Array.from({ length: 4 }, (_, index) => `event:${sessionId.slice(8)}:${nextVersion}:${index}`),
    facts: Array.from({ length: 4 }, (_, index) => `fact:${sessionId.slice(8)}:${nextVersion}:${index}`),
    itemInstances: Array.from({ length: 2 }, (_, index) => `item:${sessionId.slice(8)}:${nextVersion}:${index}`),
    scenes: [`scene:${sessionId.slice(8)}:${nextVersion}:0`],
  }
}

function expectedInventoryMatches(item: InventoryItemProjection, expected: ExpectedInventoryState): boolean {
  return item.owner_id === expected.owner_id
    && item.holder_id === expected.holder_id
    && item.location_id === expected.location_id
    && expected.container_id === null
    && item.quantity === expected.quantity
    && item.charges === expected.charges
    && item.condition === expected.condition
    && item.version === expected.version
}

function sameStringSet(left: string[], right: string[]): boolean {
  return left.length === right.length
    && new Set(left).size === left.length
    && new Set(right).size === right.length
    && left.every(value => right.includes(value))
}

function moveHeldItems(
  session: StoredGameSession,
  holderIds: ReadonlySet<string>,
  destinationLocationId: string,
  destinationLocationName: string,
): void {
  session.snapshot.inventory.forEach((item) => {
    if (!holderIds.has(item.holder_id) || item.location_id === destinationLocationId)
      return
    item.location_id = destinationLocationId
    item.location_name = destinationLocationName
    item.version += 1
  })
}

function assertKnownEntity(session: StoredGameSession, entityId: string): void {
  const pack = STORY_PACKS[session.snapshot.story_pack_id]
  const known = entityId === 'player'
    || session.snapshot.characters.some(character => character.id === entityId)
    || session.snapshot.locations.some(location => location.id === entityId)
    || session.snapshot.inventory.some(item => item.id === entityId)
    || pack.publicCharacters.some(character => character.id === entityId)
    || pack.publicLocations.some(location => location.id === entityId)
  if (!known)
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель сослалась на неизвестную сущность.', 502)
}

function entityName(session: StoredGameSession, entityId: string): string {
  if (entityId === 'player')
    return session.snapshot.persona.name
  const pack = STORY_PACKS[session.snapshot.story_pack_id]
  return session.snapshot.characters.find(character => character.id === entityId)?.name
    || session.snapshot.locations.find(location => location.id === entityId)?.name
    || pack.publicCharacters.find(character => character.id === entityId)?.name
    || pack.publicLocations.find(location => location.id === entityId)?.name
    || entityId
}

function revealCharacter(session: StoredGameSession, characterId: string): void {
  if (session.snapshot.characters.some(character => character.id === characterId))
    return
  const character = characterProjection(session.snapshot.story_pack_id, characterId)
  if (character)
    session.snapshot.characters.push(character)
}

function revealLocation(session: StoredGameSession, locationId: string, status = 'Известная локация'): void {
  const current = session.snapshot.locations.find(location => location.id === locationId)
  if (current) {
    current.status = status
    return
  }
  const location = locationProjection(session.snapshot.story_pack_id, locationId, status)
  if (location)
    session.snapshot.locations.push(location)
}

function assertCommandReferences(session: StoredGameSession, command: GameTurnCommand): void {
  const knownTargets = new Set([
    'player',
    ...session.snapshot.characters.map(character => character.id),
    ...session.snapshot.locations.map(location => location.id),
  ])
  if (command.selected_target_ids.some(targetId => !knownTargets.has(targetId)))
    throw new FabulaApiError('INVALID_COMMAND_REFERENCE', 'Ход ссылается на неизвестную цель.', 400)

  const selectedItems = command.selected_item_ids.map(itemId =>
    session.snapshot.inventory.find(item => item.id === itemId))
  if (selectedItems.some(item => !item))
    throw new FabulaApiError('INVALID_COMMAND_REFERENCE', 'Ход ссылается на неизвестный предмет.', 400)
  if (selectedItems.some(item =>
    item!.holder_id !== 'player'
    || item!.location_id !== session.snapshot.scene.location_id
    || item!.condition === 'spent'
    || item!.quantity <= 0
    || item!.charges === 0)) {
    throw new FabulaApiError(
      'ITEM_NOT_ACCESSIBLE',
      'Выбранный предмет сейчас не находится у игрока или уже исчерпан.',
      409,
    )
  }

  if (command.selected_journal_entry_ids.some(entryId =>
    !session.snapshot.journal.some(entry => entry.id === entryId))) {
    throw new FabulaApiError(
      'INVALID_COMMAND_REFERENCE',
      'Ход ссылается на неизвестную запись журнала.',
      400,
    )
  }

  if (command.selected_suggestion_id !== null) {
    const suggestion = session.snapshot.suggestions.find(candidate => candidate.id === command.selected_suggestion_id)
    if (!suggestion || suggestion.mode !== command.mode)
      throw new FabulaApiError('INVALID_COMMAND_REFERENCE', 'Предложенное действие больше не относится к текущей сцене.', 400)
  }
}

function applyOperations(
  session: StoredGameSession,
  command: GameTurnCommand,
  output: TurnOutput,
  reservedIds: EngineSessionSnapshot['reservedIds'],
): string[] {
  if (output.status !== 'resolved' && output.operations.length > 0)
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Неподтвержденный ход не может менять канон.', 502)
  if (output.status === 'resolved' && !output.operations.some(operation => operation.type === 'event.create'))
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Подтвержденный ход обязан создать событие.', 502)

  const createdEventIds = new Set<string>()
  const createdFactIds = new Set<string>()
  const createdItemIds = new Set<string>()
  const referencedNewItemIds = new Set<string>()
  const eventIdsForJournal: string[] = []
  let sceneStateChanged = false

  for (const operation of output.operations) {
    if (!ALLOWED_TURN_OPERATION_TYPES.includes(operation.type))
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель запросила неподдерживаемую операцию.', 502)

    if (operation.type === 'event.create') {
      if (!reservedIds.events.includes(operation.event_id) || createdEventIds.has(operation.event_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель использовала незарезервированный event_id.', 502)
      if (operation.source_turn_id !== command.idempotency_key)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель изменила source_turn_id.', 502)
      if (!STORY_PACKS[session.snapshot.story_pack_id].publicLocations
        .some(location => location.id === operation.location_id)) {
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Событие относится к неизвестной локации.', 502)
      }
      operation.actor_ids.forEach(entityId => assertKnownEntity(session, entityId))
      operation.target_ids.forEach(entityId => assertKnownEntity(session, entityId))
      operation.item_ids.forEach((itemId) => {
        if (reservedIds.itemInstances.includes(itemId))
          referencedNewItemIds.add(itemId)
        else
          assertKnownEntity(session, itemId)
      })
      operation.actor_ids.forEach(entityId => revealCharacter(session, entityId))
      operation.target_ids.forEach(entityId => revealCharacter(session, entityId))
      revealLocation(session, operation.location_id, operation.location_id === session.snapshot.scene.location_id
        ? 'Текущая локация'
        : 'Зафиксировано событие')
      session.events.push({
        id: operation.event_id,
        kind: operation.event_kind,
        actorIds: [...operation.actor_ids],
        targetIds: [...operation.target_ids],
        itemIds: [...operation.item_ids],
        locationId: operation.location_id,
        sourceTurnId: operation.source_turn_id,
        createdAt: nowIso(),
      })
      createdEventIds.add(operation.event_id)
      eventIdsForJournal.push(operation.event_id)
      continue
    }

    if (operation.type === 'scene.transition') {
      if (sceneStateChanged
        || !reservedIds.scenes.includes(operation.scene_id)
        || !createdEventIds.has(operation.source_event_id)) {
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Переход сцены не подтвержден текущим событием и серверным резервом.', 502)
      }
      if (operation.expected.scene_id !== session.snapshot.scene.id
        || operation.expected.location_id !== session.snapshot.scene.location_id
        || operation.expected.story_time !== session.snapshot.scene.story_time) {
        throw new FabulaApiError('SCENE_VERSION_CONFLICT', 'Сцена изменилась до применения перехода.', 409)
      }
      const location = STORY_PACKS[session.snapshot.story_pack_id].publicLocations
        .find(candidate => candidate.id === operation.location_id)
      if (!location)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Переход относится к неизвестной локации StoryPack.', 502)
      if (new Set(operation.present_character_ids).size !== operation.present_character_ids.length)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Состав новой сцены содержит повторяющихся персонажей.', 502)
      operation.present_character_ids.forEach((characterId) => {
        if (!STORY_PACKS[session.snapshot.story_pack_id].publicCharacters.some(character => character.id === characterId))
          throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'В новую сцену добавлен неизвестный персонаж.', 502)
        revealCharacter(session, characterId)
      })
      session.snapshot.locations.forEach((knownLocation) => {
        if (knownLocation.status === 'Текущая локация')
          knownLocation.status = 'Известная локация'
      })
      revealLocation(session, operation.location_id, 'Текущая локация')
      moveHeldItems(
        session,
        new Set(['player', ...operation.present_character_ids]),
        operation.location_id,
        location.name,
      )
      session.snapshot.scene = {
        id: operation.scene_id,
        title: operation.title,
        location_id: operation.location_id,
        location_name: location.name,
        story_time: operation.story_time,
        objective: operation.objective,
        present_character_ids: [...operation.present_character_ids],
      }
      sceneStateChanged = true
      continue
    }

    if (operation.type === 'scene.update_presence') {
      const sourceEvent = session.events.find(event => event.id === operation.source_event_id)
      if (sceneStateChanged
        || !createdEventIds.has(operation.source_event_id)
        || !sourceEvent
        || sourceEvent.locationId !== session.snapshot.scene.location_id) {
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Изменение состава сцены не подтверждено текущим событием.', 502)
      }
      if (operation.expected.scene_id !== session.snapshot.scene.id
        || !sameStringSet(operation.expected.present_character_ids, session.snapshot.scene.present_character_ids)) {
        throw new FabulaApiError('SCENE_VERSION_CONFLICT', 'Состав сцены изменился до применения хода.', 409)
      }
      if (new Set(operation.present_character_ids).size !== operation.present_character_ids.length)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Новый состав сцены содержит повторяющихся персонажей.', 502)

      const pack = STORY_PACKS[session.snapshot.story_pack_id]
      const publicCharacterIds = new Set(pack.publicCharacters.map(character => character.id))
      if (operation.present_character_ids.some(characterId => !publicCharacterIds.has(characterId)))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'В состав сцены добавлен неизвестный персонаж.', 502)

      const previousPresent = new Set(session.snapshot.scene.present_character_ids)
      const nextPresent = new Set(operation.present_character_ids)
      const exitingCharacterIds = [...previousPresent].filter(characterId => !nextPresent.has(characterId))
      const enteringCharacterIds = [...nextPresent].filter(characterId => !previousPresent.has(characterId))
      const eventCharacterIds = new Set([...sourceEvent.actorIds, ...sourceEvent.targetIds])
      if ([...exitingCharacterIds, ...enteringCharacterIds].some(characterId => !eventCharacterIds.has(characterId)))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Изменение состава сцены не связано с персонажами подтвержденного события.', 502)
      const departureIds = operation.departures.map(departure => departure.character_id)
      if (!sameStringSet(departureIds, exitingCharacterIds))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Для каждого покинувшего сцену персонажа нужен ровно один пункт назначения.', 502)

      operation.departures.forEach((departure) => {
        const destination = pack.publicLocations.find(location => location.id === departure.destination_location_id)
        if (!destination || destination.id === session.snapshot.scene.location_id)
          throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Пункт назначения покинувшего сцену персонажа некорректен.', 502)
        revealLocation(session, destination.id)
        moveHeldItems(session, new Set([departure.character_id]), destination.id, destination.name)
      })

      operation.present_character_ids.forEach(characterId => revealCharacter(session, characterId))
      moveHeldItems(
        session,
        nextPresent,
        session.snapshot.scene.location_id,
        session.snapshot.scene.location_name,
      )
      session.snapshot.scene.present_character_ids = [...operation.present_character_ids]
      sceneStateChanged = true
      continue
    }

    if (operation.type === 'fact.create') {
      if (!reservedIds.facts.includes(operation.fact_id) || createdFactIds.has(operation.fact_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель использовала незарезервированный fact_id.', 502)
      if (!operation.source_event_ids.length
        || operation.source_event_ids.some(eventId => !createdEventIds.has(eventId) && !session.events.some(event => event.id === eventId))) {
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Факт не имеет подтвержденного события-источника.', 502)
      }
      session.facts.push({
        id: operation.fact_id,
        claim: operation.claim,
        truthStatus: operation.truth_status,
        sourceEventIds: [...operation.source_event_ids],
        createdAt: nowIso(),
      })
      createdFactIds.add(operation.fact_id)
      continue
    }

    if (operation.type === 'knowledge.grant') {
      if (!session.snapshot.characters.some(character => character.id === operation.character_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Знание назначено неизвестному персонажу.', 502)
      if (!createdFactIds.has(operation.fact_id) && !session.facts.some(fact => fact.id === operation.fact_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Знание ссылается на неизвестный факт.', 502)
      if (!createdEventIds.has(operation.source_event_id) && !session.events.some(event => event.id === operation.source_event_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Знание не имеет подтвержденного источника.', 502)
      revealCharacter(session, operation.character_id)
      const character = session.snapshot.characters.find(candidate => candidate.id === operation.character_id)
      const fact = session.facts.find(candidate => candidate.id === operation.fact_id)
      if (character && fact)
        character.knowledge_summary = fact.claim
      session.knowledge.push({
        characterId: operation.character_id,
        factId: operation.fact_id,
        sourceEventId: operation.source_event_id,
        confidence: operation.confidence,
      })
      continue
    }

    if (operation.type === 'inventory.create_instance') {
      if (!createdEventIds.has(operation.source_event_id))
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Новый предмет требует событие текущего хода.', 502)
      if (!reservedIds.itemInstances.includes(operation.item_id)
        || createdItemIds.has(operation.item_id)
        || session.snapshot.inventory.some(item => item.id === operation.item_id)) {
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Модель использовала незарезервированный item_id.', 502)
      }
      assertKnownEntity(session, operation.owner_id)
      assertKnownEntity(session, operation.holder_id)
      assertKnownEntity(session, operation.location_id)
      revealCharacter(session, operation.owner_id)
      revealCharacter(session, operation.holder_id)
      revealLocation(session, operation.location_id)
      session.snapshot.inventory.push({
        id: operation.item_id,
        template_id: operation.template_id,
        name: operation.name,
        category: operation.category,
        description: operation.description,
        quantity: operation.quantity,
        charges: operation.charges,
        condition: operation.condition,
        owner_id: operation.owner_id,
        owner_name: entityName(session, operation.owner_id),
        holder_id: operation.holder_id,
        holder_name: entityName(session, operation.holder_id),
        location_id: operation.location_id,
        location_name: entityName(session, operation.location_id),
        slot: operation.slot,
        version: 0,
        provenance: {
          kind: 'world_event',
          source_event_id: operation.source_event_id,
          summary: `Появление предмета подтверждено событием в локации «${entityName(session, operation.location_id)}».`,
        },
      })
      createdItemIds.add(operation.item_id)
      continue
    }

    if (!createdEventIds.has(operation.source_event_id))
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Операция предмета требует событие текущего хода.', 502)
    const item = session.snapshot.inventory.find(candidate => candidate.id === operation.item_id)
    if (!item)
      throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Операция относится к неизвестному предмету.', 502)
    if (!expectedInventoryMatches(item, operation.expected))
      throw new FabulaApiError('INVENTORY_VERSION_CONFLICT', 'Предмет изменился до применения хода.', 409)

    if (operation.type === 'inventory.transfer_custody') {
      if (operation.from_holder_id !== item.holder_id || operation.quantity !== item.quantity)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Некорректная передача предмета.', 502)
      assertKnownEntity(session, operation.to_holder_id)
      revealCharacter(session, operation.to_holder_id)
      item.holder_id = operation.to_holder_id
      item.holder_name = operation.to_holder_id === 'player'
        ? session.snapshot.persona.name
        : session.snapshot.characters.find(character => character.id === operation.to_holder_id)?.name || operation.to_holder_id
      item.version += 1
      continue
    }

    if (operation.type === 'inventory.transfer_ownership') {
      if (operation.from_owner_id !== item.owner_id || operation.quantity !== item.quantity)
        throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Некорректная передача права на предмет.', 502)
      assertKnownEntity(session, operation.to_owner_id)
      revealCharacter(session, operation.to_owner_id)
      item.owner_id = operation.to_owner_id
      item.owner_name = operation.to_owner_id === 'player'
        ? session.snapshot.persona.name
        : session.snapshot.characters.find(character => character.id === operation.to_owner_id)?.name || operation.to_owner_id
      item.version += 1
      continue
    }

    if (operation.type === 'inventory.consume') {
      if (item.charges !== null) {
        if (operation.amount > item.charges)
          throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Недостаточно зарядов предмета.', 502)
        item.charges -= operation.amount
        if (item.charges === 0)
          item.condition = 'spent'
      }
      else {
        if (operation.amount > item.quantity)
          throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Недостаточное количество предмета.', 502)
        item.quantity -= operation.amount
        if (item.quantity === 0)
          item.condition = 'spent'
      }
      item.version += 1
    }
  }

  if (output.media_candidate && !createdEventIds.has(output.media_candidate.event_id))
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Медиа предложено для неподтвержденного события.', 502)
  if ([...referencedNewItemIds].some(itemId => !createdItemIds.has(itemId)))
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Событие ссылается на новый предмет без создания экземпляра.', 502)
  output.intent.targets.forEach(entityId => assertKnownEntity(session, entityId))
  output.intent.referenced_entities.forEach(entityId => assertKnownEntity(session, entityId))
  output.intent.atomic_steps.forEach((step) => {
    assertKnownEntity(session, String(step.actor_id))
    ;(step.target_ids as string[]).forEach(entityId => assertKnownEntity(session, entityId))
    ;(step.item_ids as string[]).forEach(entityId => assertKnownEntity(session, entityId))
    if (step.source_location_id !== null)
      assertKnownEntity(session, String(step.source_location_id))
    if (step.destination_location_id !== null)
      assertKnownEntity(session, String(step.destination_location_id))
  })
  const canonFactIds = new Set([
    ...getStoryPackContext(session.snapshot.story_pack_id).hardCanon
      .map((_, index) => `canon:${session.snapshot.story_pack_id}:${index + 1}`),
    ...session.facts.map(fact => fact.id),
  ])
  if (output.audit.canon_fact_ids_used.some(factId => !canonFactIds.has(factId)))
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Аудит модели ссылается на неизвестный факт канона.', 502)
  const memoryEventIds = new Set(session.events.map(event => event.id))
  if (output.audit.memory_event_ids_used.some(eventId => !memoryEventIds.has(eventId)))
    throw new FabulaApiError('MODEL_AUTHORITY_ERROR', 'Аудит модели ссылается на неизвестное событие памяти.', 502)
  return eventIdsForJournal
}

export class GameSessionRepository {
  private readonly inFlightTurns = new Map<string, InFlightTurn>()
  private readonly sessionQueues = new Map<string, Promise<void>>()

  constructor(private readonly storage: GameSessionStorage) {}

  async create(ownerId: string, request: CreateGameSessionRequest): Promise<GameSessionSnapshot> {
    const pack = STORY_PACKS[request.story_pack_id]
    const persona = makePersona(request)
    const createdAt = nowIso()
    const sessionId = `session:${globalThis.crypto.randomUUID()}`
    const locationId = pack.publicLocations[0]?.id || pack.opening.sceneId.replace('scene:', 'location:')
    const openingMessage = makeMessage({
      role: 'narrator',
      speaker: pack.opening.narrator,
      text: pack.opening.narrative,
      mode: null,
      outcome: null,
    })
    const session: StoredGameSession = {
      ownerId,
      snapshot: {
        schema_version: 'game-session@1.0',
        id: sessionId,
        story_pack_id: pack.id,
        story_pack_version: pack.version,
        status: 'active',
        version: 0,
        created_at: createdAt,
        updated_at: createdAt,
        persona,
        scene: {
          id: pack.opening.sceneId,
          title: pack.opening.title,
          location_id: locationId,
          location_name: pack.opening.location,
          story_time: pack.opening.storyTime,
          objective: pack.opening.objective,
          present_character_ids: [...pack.opening.presentCharacterIds],
        },
        messages: [openingMessage],
        suggestions: makeSuggestions(pack.opening.suggestions),
        inventory: makeStartingInventory(request, persona),
        journal: [{
          id: `journal:${globalThis.crypto.randomUUID()}`,
          entry_type: 'objective',
          title: pack.opening.journalTitle,
          summary: pack.opening.journalSummary,
          uncertainty: 'confirmed',
          source_event_ids: [],
          involved_entity_ids: ['player', locationId],
          story_time: pack.opening.storyTime,
          created_at: createdAt,
        }],
        characters: makeCharacters(pack.id),
        locations: makeLocations(pack.id),
      },
      events: [],
      facts: [],
      knowledge: [],
      turns: [],
      idempotency: [],
      stateRevisions: pack.id === 'zero-line'
        ? { zeroLineOpeningPresence: 1 }
        : undefined,
    }
    await this.storage.setItem(sessionKey(sessionId), session)
    return clone(session.snapshot)
  }

  async get(ownerId: string, sessionId: string): Promise<GameSessionSnapshot> {
    const session = await this.requireOwned(ownerId, sessionId)
    return clone(session.snapshot)
  }

  async list(ownerId: string): Promise<GameSessionSummary[]> {
    const keys = (await this.storage.getKeys()).filter(key => key.startsWith('sessions:'))
    const sessions = await Promise.all(keys.map(key => this.storage.getItem<StoredGameSession>(key)))
    return sessions
      .filter((session): session is StoredGameSession => session !== null && session.ownerId === ownerId)
      .map(summaryOf)
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))
  }

  async executeTurn(
    ownerId: string,
    command: GameTurnCommand,
    worker: (snapshot: EngineSessionSnapshot, validateOutput: TurnOutputValidator) => Promise<SessionTurnResult>,
    requestId: string,
    journalProjector?: JournalProjector,
  ): Promise<GameTurnResponse> {
    const inFlightKey = `${ownerId}:${command.session_id}:${command.idempotency_key}`
    const commandFingerprint = fingerprint(command)
    const existing = this.inFlightTurns.get(inFlightKey)
    if (existing) {
      if (existing.fingerprint !== commandFingerprint)
        throw new FabulaApiError('IDEMPOTENCY_CONFLICT', 'Этот idempotency_key уже использован для другого хода.', 409)
      const response = await existing.promise
      return { ...clone(response), replayed: true }
    }

    const promise = this.withSessionQueue(command.session_id, () =>
      this.executeTurnLocked(ownerId, command, worker, requestId, commandFingerprint, journalProjector))
    this.inFlightTurns.set(inFlightKey, { fingerprint: commandFingerprint, promise })
    try {
      return await promise
    }
    finally {
      if (this.inFlightTurns.get(inFlightKey)?.promise === promise)
        this.inFlightTurns.delete(inFlightKey)
    }
  }

  private async executeTurnLocked(
    ownerId: string,
    command: GameTurnCommand,
    worker: (
      snapshot: EngineSessionSnapshot,
      validateOutput: TurnOutputValidator,
    ) => Promise<SessionTurnResult>,
    requestId: string,
    commandFingerprint: string,
    journalProjector?: JournalProjector,
  ): Promise<GameTurnResponse> {
    const session = await this.requireOwned(ownerId, command.session_id)
    const replay = session.idempotency.find(record => record.key === command.idempotency_key)
    if (replay) {
      if (replay.fingerprint !== commandFingerprint)
        throw new FabulaApiError('IDEMPOTENCY_CONFLICT', 'Этот idempotency_key уже использован для другого хода.', 409)
      return {
        ...clone(replay.response),
        session_version: session.snapshot.version,
        replayed: true,
        session: clone(session.snapshot),
      }
    }
    if (command.expected_session_version !== session.snapshot.version)
      throw new FabulaApiError('SESSION_VERSION_CONFLICT', 'Версия истории устарела. Свежая сцена уже загружена с сервера.', 409)
    assertCommandReferences(session, command)

    const reservedIds = makeReservedIds(session.snapshot.id, session.snapshot.version + 1)
    const engineSnapshot: EngineSessionSnapshot = {
      sessionId: session.snapshot.id,
      storyPackId: session.snapshot.story_pack_id,
      storyPackVersion: session.snapshot.story_pack_version,
      version: session.snapshot.version,
      persona: clone(session.snapshot.persona),
      scene: clone(session.snapshot.scene),
      inventory: clone(session.snapshot.inventory),
      journal: clone(session.snapshot.journal),
      characters: clone(session.snapshot.characters),
      locations: clone(session.snapshot.locations),
      history: session.turns.slice(-12).map(turn => ({
        ...clone(turn),
        sceneId: turn.sceneId || null,
        costsAndConsequences: [...(turn.costsAndConsequences || [])],
        unresolvedAmbiguities: [...(turn.unresolvedAmbiguities || [])],
      })),
      confirmedEvents: clone(session.events.slice(-24)),
      confirmedFacts: clone(session.facts.slice(-32)),
      knowledge: clone(session.knowledge),
      reservedIds,
      allowedOperationTypes: ALLOWED_TURN_OPERATION_TYPES,
    }
    const validateOutput: TurnOutputValidator = (output) => {
      const preview = clone(session)
      applyOperations(preview, command, output, reservedIds)
    }
    const result = await worker(engineSnapshot, validateOutput)
    if (session.snapshot.version !== command.expected_session_version)
      throw new FabulaApiError('SESSION_VERSION_CONFLICT', 'История изменилась во время хода.', 409)

    const selectedItems = session.snapshot.inventory
      .filter(item => command.selected_item_ids.includes(item.id))
      .map(item => clone(item))
    const selectedJournalEntries = session.snapshot.journal
      .filter(entry => command.selected_journal_entry_ids.includes(entry.id))
      .map(entry => clone(entry))
    const nextSession = clone(session)
    let sourceEventIds: string[]
    try {
      sourceEventIds = applyOperations(nextSession, command, result.output, reservedIds)
    }
    catch (error) {
      if (error instanceof FabulaApiError && result.modelRuns?.length) {
        throw new AiExecutionError(
          error.code,
          error.message,
          result.modelRuns,
          error.retryable,
        )
      }
      throw error
    }
    const createdAt = nowIso()
    nextSession.snapshot.messages.push(
      makeMessage({
        role: 'player',
        speaker: nextSession.snapshot.persona.name,
        text: command.text,
        mode: command.mode,
        outcome: null,
        selected_items: selectedItems,
        selected_journal_entries: selectedJournalEntries,
      }),
      makeMessage({
        role: 'narrator',
        speaker: STORY_PACKS[nextSession.snapshot.story_pack_id].opening.narrator,
        text: result.output.narrative_text || result.output.resolution.summary,
        mode: null,
        outcome: result.output.resolution.outcome,
      }),
    )
    if (nextSession.snapshot.messages.length > 80)
      nextSession.snapshot.messages.splice(0, nextSession.snapshot.messages.length - 80)

    const reservedJournalIds = sourceEventIds.length
      ? [`journal:${globalThis.crypto.randomUUID()}`]
      : []
    const journalBeforeTurn = clone(nextSession.snapshot.journal)
    if (sourceEventIds.length) {
      const fallbackEntry = defaultJournalProjection(
        command,
        result.output,
        sourceEventIds,
        nextSession.snapshot.scene.story_time,
        reservedJournalIds[0],
      )
      nextSession.snapshot.journal.unshift({
        ...fallbackEntry,
        created_at: createdAt,
      })
      if (nextSession.snapshot.journal.length > 80)
        nextSession.snapshot.journal.splice(80)
    }

    nextSession.snapshot.suggestions = makeSuggestions(result.output.suggested_actions, command.idempotency_key)
    nextSession.snapshot.version += 1
    nextSession.snapshot.updated_at = createdAt
    nextSession.turns.push({
      turnId: command.idempotency_key,
      sceneId: session.snapshot.scene.id,
      mode: command.mode,
      playerText: command.text,
      outcome: result.output.resolution.outcome,
      narrative: result.output.narrative_text,
      costsAndConsequences: [...result.output.resolution.costs_and_consequences],
      unresolvedAmbiguities: [...result.output.audit.unresolved_ambiguities],
    })
    if (nextSession.turns.length > 40)
      nextSession.turns.splice(0, nextSession.turns.length - 40)

    const response: GameTurnResponse = {
      schema_version: 'turn-response@1.0',
      request_id: requestId,
      turn_id: command.idempotency_key,
      session_id: command.session_id,
      session_version: nextSession.snapshot.version,
      replayed: false,
      model: result.model,
      fallback_used: result.fallbackUsed,
      advisory_used: result.advisoryUsed,
      session: clone(nextSession.snapshot),
    }
    nextSession.idempotency.push({
      key: command.idempotency_key,
      fingerprint: commandFingerprint,
      response: clone(response),
    })
    if (nextSession.idempotency.length > 48)
      nextSession.idempotency.splice(0, nextSession.idempotency.length - 48)
    await this.storage.setItem(sessionKey(nextSession.snapshot.id), nextSession)

    if (sourceEventIds.length && journalProjector) {
      let journalProjection: JournalProjectionResult
      try {
        journalProjection = await journalProjector({
          snapshot: {
            ...engineSnapshot,
            version: nextSession.snapshot.version,
            scene: clone(nextSession.snapshot.scene),
            inventory: clone(nextSession.snapshot.inventory),
            journal: journalBeforeTurn,
            characters: clone(nextSession.snapshot.characters),
            locations: clone(nextSession.snapshot.locations),
            confirmedEvents: clone(nextSession.events.slice(-24)),
            confirmedFacts: clone(nextSession.facts.slice(-32)),
            knowledge: clone(nextSession.knowledge),
          },
          output: result.output,
          sourceEventIds: [...sourceEventIds],
          reservedJournalIds,
        })
        assertJournalProjection(
          journalProjection.entries,
          reservedJournalIds,
          sourceEventIds,
        )
        assertCharacterProjectionUpdates(
          journalProjection.characterUpdates,
          nextSession.snapshot.characters,
          sourceEventIds,
        )
      }
      catch {
        journalProjection = {
          entries: [],
          characterUpdates: [],
          fallbackUsed: true,
          modelRuns: [],
        }
      }

      if (journalProjection.entries.length) {
        const reservedIds = new Set(reservedJournalIds)
        nextSession.snapshot.journal = [
          ...journalProjection.entries.map(entry => ({
            ...entry,
            created_at: createdAt,
          })),
          ...nextSession.snapshot.journal.filter(entry => !reservedIds.has(entry.id)),
        ].slice(0, 80)
      }
      for (const update of journalProjection.characterUpdates) {
        const character = nextSession.snapshot.characters
          .find(candidate => candidate.id === update.character_id)!
        if (update.relation !== null)
          character.relation = update.relation
        if (update.description !== null)
          character.description = update.description
        if (update.knowledge_summary !== null)
          character.knowledge_summary = update.knowledge_summary
      }
      response.fallback_used = result.fallbackUsed || journalProjection.fallbackUsed
      response.session = clone(nextSession.snapshot)
      const idempotencyRecord = nextSession.idempotency.find(record => record.key === command.idempotency_key)
      if (idempotencyRecord)
        idempotencyRecord.response = clone(response)
      await this.storage.setItem(sessionKey(nextSession.snapshot.id), nextSession)
    }

    return response
  }

  private async requireOwned(ownerId: string, sessionId: string): Promise<StoredGameSession> {
    const session = await this.storage.getItem<StoredGameSession>(sessionKey(sessionId))
    if (!session)
      throw new FabulaApiError('SESSION_NOT_FOUND', 'История не найдена.', 404)
    if (session.ownerId !== ownerId)
      throw new FabulaApiError('SESSION_NOT_FOUND', 'История не найдена.', 404)
    return normalizeStoredSession(session)
  }

  private async withSessionQueue<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.sessionQueues.get(sessionId) || Promise.resolve()
    let release = () => {}
    const current = new Promise<void>((resolve) => {
      release = resolve
    })
    const tail = previous.then(() => current)
    this.sessionQueues.set(sessionId, tail)
    await previous
    try {
      return await task()
    }
    finally {
      release()
      if (this.sessionQueues.get(sessionId) === tail)
        this.sessionQueues.delete(sessionId)
    }
  }
}

export class MemoryGameSessionStorage implements GameSessionStorage {
  private readonly values = new Map<string, unknown>()

  async getItem<T>(key: string): Promise<T | null> {
    return this.values.has(key) ? clone(this.values.get(key) as T) : null
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.values.set(key, clone(value))
  }

  async getKeys(): Promise<string[]> {
    return [...this.values.keys()]
  }
}

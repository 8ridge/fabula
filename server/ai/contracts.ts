import type { GameTurnCommand } from '../../shared/game'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type TurnCommand = GameTurnCommand

export interface ExpectedInventoryState {
  owner_id: string
  holder_id: string
  location_id: string
  container_id: string | null
  quantity: number
  charges: number | null
  condition: 'pristine' | 'usable' | 'worn' | 'damaged' | 'spent'
  version: number
}

export interface ExpectedSceneState {
  scene_id: string
  location_id: string
  story_time: string
}

export interface ExpectedScenePresence {
  scene_id: string
  present_character_ids: string[]
}

export type TurnOperation =
  | {
    type: 'event.create'
    operation_index: number
    event_id: string
    event_kind: string
    actor_ids: string[]
    target_ids: string[]
    item_ids: string[]
    location_id: string
    source_turn_id: string
  }
  | {
    type: 'scene.transition'
    operation_index: number
    source_event_id: string
    scene_id: string
    title: string
    location_id: string
    story_time: string
    objective: string
    present_character_ids: string[]
    expected: ExpectedSceneState
  }
  | {
    type: 'scene.update_presence'
    operation_index: number
    source_event_id: string
    present_character_ids: string[]
    departures: Array<{
      character_id: string
      destination_location_id: string
    }>
    expected: ExpectedScenePresence
  }
  | {
    type: 'fact.create'
    operation_index: number
    fact_id: string
    claim: string
    truth_status: 'observed' | 'reported' | 'inferred' | 'contested'
    source_event_ids: string[]
  }
  | {
    type: 'knowledge.grant'
    operation_index: number
    character_id: string
    fact_id: string
    source_event_id: string
    confidence: number
  }
  | {
    type: 'inventory.create_instance'
    operation_index: number
    source_event_id: string
    item_id: string
    template_id: string
    name: string
    category: 'tool' | 'document' | 'medicine' | 'keepsake' | 'resource'
    description: string
    owner_id: string
    holder_id: string
    location_id: string
    quantity: number
    charges: number | null
    condition: 'pristine' | 'usable' | 'worn' | 'damaged' | 'spent'
    slot: 'hand' | 'body' | 'bag' | null
  }
  | {
    type: 'inventory.transfer_custody'
    operation_index: number
    source_event_id: string
    item_id: string
    from_holder_id: string
    to_holder_id: string
    quantity: number
    expected: ExpectedInventoryState
  }
  | {
    type: 'inventory.transfer_ownership'
    operation_index: number
    source_event_id: string
    item_id: string
    from_owner_id: string
    to_owner_id: string
    quantity: number
    expected: ExpectedInventoryState
  }
  | {
    type: 'inventory.consume'
    operation_index: number
    source_event_id: string
    item_id: string
    amount: number
    expected: ExpectedInventoryState
  }

export interface TurnOutput {
  schema_version: 'turn-output@0.2'
  turn_id: string
  expected_session_version: number
  status: 'resolved' | 'clarification_required' | 'rejected'
  intent: {
    type: string
    targets: string[]
    referenced_entities: string[]
    atomic_steps: Array<Record<string, JsonValue>>
  }
  context_check: Record<string, JsonValue>
  difficulty: {
    base: number
    environment: number
    time_pressure: number
    injury: number
    opposition: number
    skill: number
    tools: number
    preparation: number
    help: number
    final_band: number
    uncertainty: 'low' | 'medium' | 'high'
  }
  resolution: {
    summary: string
    outcome: 'success' | 'partial_success' | 'failure' | 'impossible'
    reason_codes: string[]
    costs_and_consequences: string[]
  }
  operations: TurnOperation[]
  narrative_brief: {
    must_include: string[]
    must_not_invent: string[]
    tone: string
    point_of_view: 'second_person'
    sensory_scope: string[]
  }
  narrative_text: string
  suggested_actions: Array<{
    label: string
    mode: 'action' | 'speech' | 'exploration'
    intent_hint: string
  }>
  media_candidate: null | {
    event_id: string
    kind: 'image' | 'video'
    salience: number
    reason_codes: string[]
    exclusive_event_hint: boolean
  }
  safety_flags: string[]
  audit: {
    canon_fact_ids_used: string[]
    memory_event_ids_used: string[]
    assumptions: string[]
    unresolved_ambiguities: string[]
    difficulty_regulation_note: string | null
  }
}

export class ContractError extends Error {
  readonly code: string
  readonly fieldErrors: string[]

  constructor(code: string, message: string, fieldErrors: string[] = []) {
    super(message)
    this.name = 'ContractError'
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/
const MODES = new Set(['action', 'speech', 'exploration'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  const extras = Object.keys(value).filter(key => !allowedSet.has(key))
  if (extras.length)
    throw new ContractError('INVALID_FIELDS', 'Запрос содержит запрещенные поля.', extras.map(key => `${path}.${key}`))
}

function requiredKeys(value: Record<string, unknown>, required: readonly string[], path: string): void {
  const missing = required.filter(key => !(key in value))
  if (missing.length)
    throw new ContractError('MISSING_FIELDS', 'В запросе не хватает обязательных полей.', missing.map(key => `${path}.${key}`))
}

function stringArray(value: unknown, path: string, maxItems = 32): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some(item => typeof item !== 'string' || item.length > 160))
    throw new ContractError('INVALID_FIELD', 'Некорректный список строк.', [path])
  return value
}

function boundedString(value: unknown, path: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.length < min || value.length > max)
    throw new ContractError('INVALID_FIELD', 'Некорректная длина строки.', [path])
  return value
}

function boundedInteger(value: unknown, path: string, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max)
    throw new ContractError('INVALID_FIELD', 'Некорректное целое число.', [path])
  return Number(value)
}

function boundedNumber(value: unknown, path: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new ContractError('INVALID_FIELD', 'Некорректное число.', [path])
  return value
}

export function parseTurnCommand(value: unknown): TurnCommand {
  if (!isRecord(value))
    throw new ContractError('INVALID_BODY', 'Ожидался JSON-объект.')
  const keys = [
    'schema_version',
    'session_id',
    'idempotency_key',
    'expected_session_version',
    'mode',
    'text',
    'selected_target_ids',
    'selected_item_ids',
    'selected_journal_entry_ids',
    'selected_suggestion_id',
  ] as const
  exactKeys(value, keys, '$')
  requiredKeys(value, keys.filter(key => key !== 'selected_journal_entry_ids'), '$')

  if (value.schema_version !== 'turn-command@1.0')
    throw new ContractError('UNSUPPORTED_SCHEMA', 'Неподдерживаемая версия команды.', ['$.schema_version'])
  if (typeof value.session_id !== 'string' || !SAFE_ID.test(value.session_id))
    throw new ContractError('INVALID_FIELD', 'Некорректный session_id.', ['$.session_id'])
  if (typeof value.idempotency_key !== 'string' || !SAFE_ID.test(value.idempotency_key))
    throw new ContractError('INVALID_FIELD', 'Некорректный idempotency_key.', ['$.idempotency_key'])
  if (!MODES.has(String(value.mode)))
    throw new ContractError('INVALID_FIELD', 'Некорректный режим хода.', ['$.mode'])
  const text = boundedString(value.text, '$.text', 1, 1200)
  boundedInteger(value.expected_session_version, '$.expected_session_version', 0, 1_000_000)
  const selectedTargetIds = stringArray(value.selected_target_ids, '$.selected_target_ids', 16)
  const selectedItemIds = stringArray(value.selected_item_ids, '$.selected_item_ids', 16)
  const selectedJournalEntryIds = value.selected_journal_entry_ids === undefined
    ? []
    : stringArray(value.selected_journal_entry_ids, '$.selected_journal_entry_ids', 8)
  if (value.selected_suggestion_id !== null && (typeof value.selected_suggestion_id !== 'string' || value.selected_suggestion_id.length > 160))
    throw new ContractError('INVALID_FIELD', 'Некорректный suggestion_id.', ['$.selected_suggestion_id'])

  return {
    schema_version: 'turn-command@1.0',
    session_id: value.session_id,
    idempotency_key: value.idempotency_key,
    expected_session_version: Number(value.expected_session_version),
    mode: value.mode as TurnCommand['mode'],
    text: text.trim(),
    selected_target_ids: selectedTargetIds,
    selected_item_ids: selectedItemIds,
    selected_journal_entry_ids: selectedJournalEntryIds,
    selected_suggestion_id: value.selected_suggestion_id as string | null,
  }
}

export interface ModuleRequest {
  schema_version: 'ai-module-request@1.0'
  request_id: string
  payload: Record<string, JsonValue>
  template_variables: Record<string, JsonValue>
}

function assertJsonValue(value: unknown, path: string, depth = 0): asserts value is JsonValue {
  if (depth > 8)
    throw new ContractError('INVALID_FIELD', 'Слишком глубокая JSON-структура.', [path])
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'string' && value.length > 8000)
      throw new ContractError('INVALID_FIELD', 'Строка слишком длинная.', [path])
    return
  }
  if (Array.isArray(value)) {
    if (value.length > 100)
      throw new ContractError('INVALID_FIELD', 'Слишком длинный массив.', [path])
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`, depth + 1))
    return
  }
  if (isRecord(value)) {
    if (Object.keys(value).length > 100)
      throw new ContractError('INVALID_FIELD', 'Слишком много полей.', [path])
    Object.entries(value).forEach(([key, item]) => {
      if (!/^[A-Za-z0-9_.-]{1,80}$/.test(key))
        throw new ContractError('INVALID_FIELD', 'Некорректное имя поля.', [`${path}.${key}`])
      assertJsonValue(item, `${path}.${key}`, depth + 1)
    })
    return
  }
  throw new ContractError('INVALID_FIELD', 'Значение не является JSON.', [path])
}

export function parseModuleRequest(value: unknown): ModuleRequest {
  if (!isRecord(value))
    throw new ContractError('INVALID_BODY', 'Ожидался JSON-объект.')
  const keys = ['schema_version', 'request_id', 'payload', 'template_variables'] as const
  exactKeys(value, keys, '$')
  requiredKeys(value, ['schema_version', 'request_id', 'payload'], '$')
  if (value.schema_version !== 'ai-module-request@1.0')
    throw new ContractError('UNSUPPORTED_SCHEMA', 'Неподдерживаемая версия запроса.', ['$.schema_version'])
  if (typeof value.request_id !== 'string' || !SAFE_ID.test(value.request_id))
    throw new ContractError('INVALID_FIELD', 'Некорректный request_id.', ['$.request_id'])
  if (!isRecord(value.payload))
    throw new ContractError('INVALID_FIELD', 'payload должен быть объектом.', ['$.payload'])
  const templateVariables = value.template_variables === undefined ? {} : value.template_variables
  if (!isRecord(templateVariables))
    throw new ContractError('INVALID_FIELD', 'template_variables должен быть объектом.', ['$.template_variables'])
  assertJsonValue(value.payload, '$.payload')
  assertJsonValue(templateVariables, '$.template_variables')
  const serializedLength = JSON.stringify(value).length
  if (serializedLength > 64_000)
    throw new ContractError('BODY_TOO_LARGE', 'Запрос превышает допустимый размер.')
  return {
    schema_version: 'ai-module-request@1.0',
    request_id: value.request_id,
    payload: value.payload as Record<string, JsonValue>,
    template_variables: templateVariables as Record<string, JsonValue>,
  }
}

const atomicStepKeys = [
  'step',
  'phase',
  'explicit_or_inferred',
  'actor_id',
  'target_ids',
  'item_ids',
  'source_location_id',
  'destination_location_id',
  'hands_required',
  'attention_required',
  'duration_seconds',
  'noise_band',
  'visibility',
  'precondition_codes',
  'interruption_points',
  'completion_evidence',
] as const

function validateAtomicStep(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула некорректный atomic_step.', [path])
  exactKeys(value, atomicStepKeys, path)
  requiredKeys(value, atomicStepKeys, path)
  boundedString(value.step, `${path}.step`, 1, 120)
  if (!['prepare', 'attempt', 'complete', 'interrupted'].includes(String(value.phase)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная фаза atomic_step.', [`${path}.phase`])
  if (!['explicit', 'inferred'].includes(String(value.explicit_or_inferred)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный источник atomic_step.', [`${path}.explicit_or_inferred`])
  boundedString(value.actor_id, `${path}.actor_id`, 1, 160)
  stringArray(value.target_ids, `${path}.target_ids`, 16)
  stringArray(value.item_ids, `${path}.item_ids`, 16)
  if (value.source_location_id !== null)
    boundedString(value.source_location_id, `${path}.source_location_id`, 1, 160)
  if (value.destination_location_id !== null)
    boundedString(value.destination_location_id, `${path}.destination_location_id`, 1, 160)
  boundedInteger(value.hands_required, `${path}.hands_required`, 0, 2)
  boundedString(value.attention_required, `${path}.attention_required`, 1, 40)
  boundedInteger(value.duration_seconds, `${path}.duration_seconds`, 0, 86_400)
  boundedInteger(value.noise_band, `${path}.noise_band`, 0, 5)
  boundedString(value.visibility, `${path}.visibility`, 1, 80)
  stringArray(value.precondition_codes, `${path}.precondition_codes`, 32)
  stringArray(value.interruption_points, `${path}.interruption_points`, 32)
  stringArray(value.completion_evidence, `${path}.completion_evidence`, 32)
}

const inventoryExpectedKeys = [
  'owner_id',
  'holder_id',
  'location_id',
  'container_id',
  'quantity',
  'charges',
  'condition',
  'version',
] as const

function validateExpectedInventoryState(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный expected для предмета.', [path])
  exactKeys(value, inventoryExpectedKeys, path)
  requiredKeys(value, inventoryExpectedKeys, path)
  boundedString(value.owner_id, `${path}.owner_id`, 1, 160)
  boundedString(value.holder_id, `${path}.holder_id`, 1, 160)
  boundedString(value.location_id, `${path}.location_id`, 1, 160)
  if (value.container_id !== null)
    boundedString(value.container_id, `${path}.container_id`, 1, 160)
  boundedInteger(value.quantity, `${path}.quantity`, 0, 1_000_000)
  if (value.charges !== null)
    boundedInteger(value.charges, `${path}.charges`, 0, 1_000_000)
  if (!['pristine', 'usable', 'worn', 'damaged', 'spent'].includes(String(value.condition)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректное состояние предмета.', [`${path}.condition`])
  boundedInteger(value.version, `${path}.version`, 0, 1_000_000)
}

function validateExpectedSceneState(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный expected для сцены.', [path])
  const keys = ['scene_id', 'location_id', 'story_time'] as const
  exactKeys(value, keys, path)
  requiredKeys(value, keys, path)
  boundedString(value.scene_id, `${path}.scene_id`, 1, 160)
  boundedString(value.location_id, `${path}.location_id`, 1, 160)
  boundedString(value.story_time, `${path}.story_time`, 1, 160)
}

function validateExpectedScenePresence(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный expected для состава сцены.', [path])
  const keys = ['scene_id', 'present_character_ids'] as const
  exactKeys(value, keys, path)
  requiredKeys(value, keys, path)
  boundedString(value.scene_id, `${path}.scene_id`, 1, 160)
  const presentCharacterIds = stringArray(value.present_character_ids, `${path}.present_character_ids`, 16)
  if (new Set(presentCharacterIds).size !== presentCharacterIds.length)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Состав сцены не должен содержать повторяющиеся ID.', [`${path}.present_character_ids`])
}

function validateTurnOperation(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная операция хода.', [path])
  boundedInteger(value.operation_index, `${path}.operation_index`, 0, 63)

  switch (value.type) {
    case 'event.create':
      exactKeys(value, ['type', 'operation_index', 'event_id', 'event_kind', 'actor_ids', 'target_ids', 'item_ids', 'location_id', 'source_turn_id'], path)
      requiredKeys(value, ['type', 'operation_index', 'event_id', 'event_kind', 'actor_ids', 'target_ids', 'item_ids', 'location_id', 'source_turn_id'], path)
      boundedString(value.event_id, `${path}.event_id`, 1, 160)
      boundedString(value.event_kind, `${path}.event_kind`, 1, 120)
      stringArray(value.actor_ids, `${path}.actor_ids`, 16)
      stringArray(value.target_ids, `${path}.target_ids`, 16)
      stringArray(value.item_ids, `${path}.item_ids`, 16)
      boundedString(value.location_id, `${path}.location_id`, 1, 160)
      boundedString(value.source_turn_id, `${path}.source_turn_id`, 1, 160)
      return
    case 'scene.transition':
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'scene_id', 'title', 'location_id', 'story_time', 'objective', 'present_character_ids', 'expected'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'scene_id', 'title', 'location_id', 'story_time', 'objective', 'present_character_ids', 'expected'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedString(value.scene_id, `${path}.scene_id`, 1, 160)
      boundedString(value.title, `${path}.title`, 1, 160)
      boundedString(value.location_id, `${path}.location_id`, 1, 160)
      boundedString(value.story_time, `${path}.story_time`, 1, 160)
      boundedString(value.objective, `${path}.objective`, 1, 500)
      stringArray(value.present_character_ids, `${path}.present_character_ids`, 16)
      validateExpectedSceneState(value.expected, `${path}.expected`)
      return
    case 'scene.update_presence': {
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'present_character_ids', 'departures', 'expected'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'present_character_ids', 'departures', 'expected'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      const presentCharacterIds = stringArray(value.present_character_ids, `${path}.present_character_ids`, 16)
      if (new Set(presentCharacterIds).size !== presentCharacterIds.length)
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Состав сцены не должен содержать повторяющиеся ID.', [`${path}.present_character_ids`])
      if (!Array.isArray(value.departures) || value.departures.length > 16)
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный список покинувших сцену персонажей.', [`${path}.departures`])
      const departureIds: string[] = []
      value.departures.forEach((departure, index) => {
        const departurePath = `${path}.departures[${index}]`
        if (!isRecord(departure))
          throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректное перемещение персонажа.', [departurePath])
        exactKeys(departure, ['character_id', 'destination_location_id'], departurePath)
        requiredKeys(departure, ['character_id', 'destination_location_id'], departurePath)
        departureIds.push(boundedString(departure.character_id, `${departurePath}.character_id`, 1, 160))
        boundedString(departure.destination_location_id, `${departurePath}.destination_location_id`, 1, 160)
      })
      if (new Set(departureIds).size !== departureIds.length)
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Персонаж не может покинуть сцену дважды.', [`${path}.departures`])
      validateExpectedScenePresence(value.expected, `${path}.expected`)
      return
    }
    case 'fact.create':
      exactKeys(value, ['type', 'operation_index', 'fact_id', 'claim', 'truth_status', 'source_event_ids'], path)
      requiredKeys(value, ['type', 'operation_index', 'fact_id', 'claim', 'truth_status', 'source_event_ids'], path)
      boundedString(value.fact_id, `${path}.fact_id`, 1, 160)
      boundedString(value.claim, `${path}.claim`, 1, 1000)
      if (!['observed', 'reported', 'inferred', 'contested'].includes(String(value.truth_status)))
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный truth_status.', [`${path}.truth_status`])
      stringArray(value.source_event_ids, `${path}.source_event_ids`, 16)
      return
    case 'knowledge.grant':
      exactKeys(value, ['type', 'operation_index', 'character_id', 'fact_id', 'source_event_id', 'confidence'], path)
      requiredKeys(value, ['type', 'operation_index', 'character_id', 'fact_id', 'source_event_id', 'confidence'], path)
      boundedString(value.character_id, `${path}.character_id`, 1, 160)
      boundedString(value.fact_id, `${path}.fact_id`, 1, 160)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedNumber(value.confidence, `${path}.confidence`, 0, 1)
      return
    case 'inventory.create_instance':
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'template_id', 'name', 'category', 'description', 'owner_id', 'holder_id', 'location_id', 'quantity', 'charges', 'condition', 'slot'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'template_id', 'name', 'category', 'description', 'owner_id', 'holder_id', 'location_id', 'quantity', 'charges', 'condition', 'slot'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedString(value.item_id, `${path}.item_id`, 1, 160)
      boundedString(value.template_id, `${path}.template_id`, 1, 160)
      boundedString(value.name, `${path}.name`, 1, 160)
      if (!['tool', 'document', 'medicine', 'keepsake', 'resource'].includes(String(value.category)))
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная категория предмета.', [`${path}.category`])
      boundedString(value.description, `${path}.description`, 1, 1000)
      boundedString(value.owner_id, `${path}.owner_id`, 1, 160)
      boundedString(value.holder_id, `${path}.holder_id`, 1, 160)
      boundedString(value.location_id, `${path}.location_id`, 1, 160)
      boundedInteger(value.quantity, `${path}.quantity`, 1, 1_000_000)
      if (value.charges !== null)
        boundedInteger(value.charges, `${path}.charges`, 0, 1_000_000)
      if (!['pristine', 'usable', 'worn', 'damaged', 'spent'].includes(String(value.condition)))
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректное состояние предмета.', [`${path}.condition`])
      if (value.slot !== null && !['hand', 'body', 'bag'].includes(String(value.slot)))
        throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный слот предмета.', [`${path}.slot`])
      return
    case 'inventory.transfer_custody':
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'from_holder_id', 'to_holder_id', 'quantity', 'expected'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'from_holder_id', 'to_holder_id', 'quantity', 'expected'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedString(value.item_id, `${path}.item_id`, 1, 160)
      boundedString(value.from_holder_id, `${path}.from_holder_id`, 1, 160)
      boundedString(value.to_holder_id, `${path}.to_holder_id`, 1, 160)
      boundedInteger(value.quantity, `${path}.quantity`, 1, 1_000_000)
      validateExpectedInventoryState(value.expected, `${path}.expected`)
      return
    case 'inventory.transfer_ownership':
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'from_owner_id', 'to_owner_id', 'quantity', 'expected'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'from_owner_id', 'to_owner_id', 'quantity', 'expected'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedString(value.item_id, `${path}.item_id`, 1, 160)
      boundedString(value.from_owner_id, `${path}.from_owner_id`, 1, 160)
      boundedString(value.to_owner_id, `${path}.to_owner_id`, 1, 160)
      boundedInteger(value.quantity, `${path}.quantity`, 1, 1_000_000)
      validateExpectedInventoryState(value.expected, `${path}.expected`)
      return
    case 'inventory.consume':
      exactKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'amount', 'expected'], path)
      requiredKeys(value, ['type', 'operation_index', 'source_event_id', 'item_id', 'amount', 'expected'], path)
      boundedString(value.source_event_id, `${path}.source_event_id`, 1, 160)
      boundedString(value.item_id, `${path}.item_id`, 1, 160)
      boundedInteger(value.amount, `${path}.amount`, 1, 1_000_000)
      validateExpectedInventoryState(value.expected, `${path}.expected`)
      return
    default:
      throw new ContractError('MODEL_AUTHORITY_ERROR', 'Модель вернула запрещенный тип операции.', [`${path}.type`])
  }
}

function validateTurnOutputShape(value: Record<string, unknown>, expectedTurnId: string, expectedVersion: number): void {
  const topKeys = [
    'schema_version',
    'turn_id',
    'expected_session_version',
    'status',
    'intent',
    'context_check',
    'difficulty',
    'resolution',
    'operations',
    'narrative_brief',
    'narrative_text',
    'suggested_actions',
    'media_candidate',
    'safety_flags',
    'audit',
  ] as const
  exactKeys(value, topKeys, '$')
  requiredKeys(value, topKeys, '$')
  if (value.schema_version !== 'turn-output@0.2')
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула неверную версию контракта.', ['$.schema_version'])
  if (value.turn_id !== expectedTurnId)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель изменила turn_id.', ['$.turn_id'])
  if (value.expected_session_version !== expectedVersion)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель изменила версию сессии.', ['$.expected_session_version'])
  if (!['resolved', 'clarification_required', 'rejected'].includes(String(value.status)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный status.', ['$.status'])

  if (!isRecord(value.intent))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный intent.', ['$.intent'])
  exactKeys(value.intent, ['type', 'targets', 'referenced_entities', 'atomic_steps'], '$.intent')
  requiredKeys(value.intent, ['type', 'targets', 'referenced_entities', 'atomic_steps'], '$.intent')
  boundedString(value.intent.type, '$.intent.type', 1, 120)
  stringArray(value.intent.targets, '$.intent.targets')
  stringArray(value.intent.referenced_entities, '$.intent.referenced_entities')
  if (!Array.isArray(value.intent.atomic_steps) || value.intent.atomic_steps.length > 12)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректные atomic_steps.', ['$.intent.atomic_steps'])
  value.intent.atomic_steps.forEach((step, index) => validateAtomicStep(step, `$.intent.atomic_steps[${index}]`))

  if (!isRecord(value.context_check))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный context_check.', ['$.context_check'])
  const contextCheck = value.context_check
  const contextKeys = [
    'actor_can_attempt',
    'actor_conscious',
    'target_reachable',
    'target_perceivable',
    'item_accessible',
    'ownership_valid',
    'knowledge_sources_valid',
    'channel_valid',
    'scope_valid',
    'consent_valid',
    'barriers_allow_attempt',
    'time_sufficient',
    'blocking_reasons',
  ]
  exactKeys(contextCheck, contextKeys, '$.context_check')
  requiredKeys(contextCheck, contextKeys, '$.context_check')
  for (const key of contextKeys.slice(0, -1)) {
    if (typeof contextCheck[key] !== 'boolean')
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный context_check.', [`$.context_check.${key}`])
  }
  stringArray(contextCheck.blocking_reasons, '$.context_check.blocking_reasons')
  const contextAllowsAttempt = contextKeys
    .slice(0, -1)
    .every(key => contextCheck[key] === true)
  const hasBlockingReasons = (contextCheck.blocking_reasons as unknown[]).length > 0
  if (contextAllowsAttempt === hasBlockingReasons) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      contextAllowsAttempt
        ? 'Разрешенный ход не может содержать blocking_reasons.'
        : 'Заблокированный ход обязан содержать blocking_reasons.',
      ['$.context_check.blocking_reasons'],
    )
  }

  if (!isRecord(value.difficulty))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная difficulty.', ['$.difficulty'])
  const difficultyKeys = ['base', 'environment', 'time_pressure', 'injury', 'opposition', 'skill', 'tools', 'preparation', 'help', 'final_band', 'uncertainty']
  exactKeys(value.difficulty, difficultyKeys, '$.difficulty')
  requiredKeys(value.difficulty, difficultyKeys, '$.difficulty')
  for (const key of difficultyKeys.slice(0, -2))
    boundedInteger(value.difficulty[key], `$.difficulty.${key}`, -5, 5)
  boundedInteger(value.difficulty.final_band, '$.difficulty.final_band', 0, 5)
  if (!['low', 'medium', 'high'].includes(String(value.difficulty.uncertainty)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная uncertainty.', ['$.difficulty.uncertainty'])
  const calculatedBand = Math.max(0, Math.min(5,
    Number(value.difficulty.base)
    + Number(value.difficulty.environment)
    + Number(value.difficulty.time_pressure)
    + Number(value.difficulty.injury)
    + Number(value.difficulty.opposition)
    - Number(value.difficulty.skill)
    - Number(value.difficulty.tools)
    - Number(value.difficulty.preparation)
    - Number(value.difficulty.help),
  ))
  if (value.difficulty.final_band !== calculatedBand)
    throw new ContractError('MODEL_INVARIANT_ERROR', 'Модель неверно рассчитала сложность.', ['$.difficulty.final_band'])

  if (!isRecord(value.resolution))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная resolution.', ['$.resolution'])
  exactKeys(value.resolution, ['summary', 'outcome', 'reason_codes', 'costs_and_consequences'], '$.resolution')
  requiredKeys(value.resolution, ['summary', 'outcome', 'reason_codes', 'costs_and_consequences'], '$.resolution')
  boundedString(value.resolution.summary, '$.resolution.summary', 1, 1000)
  if (!['success', 'partial_success', 'failure', 'impossible'].includes(String(value.resolution.outcome)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный outcome.', ['$.resolution.outcome'])
  stringArray(value.resolution.reason_codes, '$.resolution.reason_codes')
  stringArray(value.resolution.costs_and_consequences, '$.resolution.costs_and_consequences')
  if (value.status === 'resolved' && (!contextAllowsAttempt || value.resolution.outcome === 'impossible')) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Resolved-ход требует успешной проверки контекста и возможного outcome.',
      ['$.status', '$.context_check', '$.resolution.outcome'],
    )
  }
  if (value.status === 'rejected' && (contextAllowsAttempt || value.resolution.outcome !== 'impossible')) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Rejected-ход требует блокирующей причины и outcome impossible.',
      ['$.status', '$.context_check', '$.resolution.outcome'],
    )
  }
  if (value.status === 'clarification_required' && ['success', 'partial_success'].includes(String(value.resolution.outcome))) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Уточнение не может одновременно быть успешным исходом.',
      ['$.status', '$.resolution.outcome'],
    )
  }

  if (!Array.isArray(value.operations) || value.operations.length > 24)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный список операций.', ['$.operations'])
  value.operations.forEach((operation, index) => validateTurnOperation(operation, `$.operations[${index}]`))
  const operationIndexes = value.operations.map(operation => (operation as { operation_index: number }).operation_index)
  if (new Set(operationIndexes).size !== operationIndexes.length
    || operationIndexes.some((operationIndex, index) => operationIndex !== index)) {
    throw new ContractError('MODEL_INVARIANT_ERROR', 'operation_index должен быть последовательным и уникальным.', ['$.operations'])
  }

  if (!isRecord(value.narrative_brief))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный narrative_brief.', ['$.narrative_brief'])
  exactKeys(value.narrative_brief, ['must_include', 'must_not_invent', 'tone', 'point_of_view', 'sensory_scope'], '$.narrative_brief')
  requiredKeys(value.narrative_brief, ['must_include', 'must_not_invent', 'tone', 'point_of_view', 'sensory_scope'], '$.narrative_brief')
  stringArray(value.narrative_brief.must_include, '$.narrative_brief.must_include')
  stringArray(value.narrative_brief.must_not_invent, '$.narrative_brief.must_not_invent')
  boundedString(value.narrative_brief.tone, '$.narrative_brief.tone', 1, 80)
  if (value.narrative_brief.point_of_view !== 'second_person')
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная точка зрения.', ['$.narrative_brief.point_of_view'])
  stringArray(value.narrative_brief.sensory_scope, '$.narrative_brief.sensory_scope')
  boundedString(value.narrative_text, '$.narrative_text', value.status === 'resolved' ? 1 : 0, 6000)

  if (!Array.isArray(value.suggested_actions) || value.suggested_actions.length > 6)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректные suggested_actions.', ['$.suggested_actions'])
  value.suggested_actions.forEach((action, index) => {
    const path = `$.suggested_actions[${index}]`
    if (!isRecord(action))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректное suggested_action.', [path])
    exactKeys(action, ['label', 'mode', 'intent_hint'], path)
    requiredKeys(action, ['label', 'mode', 'intent_hint'], path)
    boundedString(action.label, `${path}.label`, 1, 160)
    if (!MODES.has(String(action.mode)))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный mode.', [`${path}.mode`])
    boundedString(action.intent_hint, `${path}.intent_hint`, 1, 160)
  })

  if (value.media_candidate !== null) {
    if (!isRecord(value.media_candidate))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный media_candidate.', ['$.media_candidate'])
    exactKeys(value.media_candidate, ['event_id', 'kind', 'salience', 'reason_codes', 'exclusive_event_hint'], '$.media_candidate')
    requiredKeys(value.media_candidate, ['event_id', 'kind', 'salience', 'reason_codes', 'exclusive_event_hint'], '$.media_candidate')
    boundedString(value.media_candidate.event_id, '$.media_candidate.event_id', 1, 160)
    if (!['image', 'video'].includes(String(value.media_candidate.kind)))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный тип media_candidate.', ['$.media_candidate.kind'])
    boundedNumber(value.media_candidate.salience, '$.media_candidate.salience', 0, 1)
    stringArray(value.media_candidate.reason_codes, '$.media_candidate.reason_codes')
    if (typeof value.media_candidate.exclusive_event_hint !== 'boolean')
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный exclusive_event_hint.', ['$.media_candidate.exclusive_event_hint'])
  }
  stringArray(value.safety_flags, '$.safety_flags')

  if (!isRecord(value.audit))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный audit.', ['$.audit'])
  const auditKeys = ['canon_fact_ids_used', 'memory_event_ids_used', 'assumptions', 'unresolved_ambiguities', 'difficulty_regulation_note']
  exactKeys(value.audit, auditKeys, '$.audit')
  requiredKeys(value.audit, auditKeys, '$.audit')
  stringArray(value.audit.canon_fact_ids_used, '$.audit.canon_fact_ids_used')
  stringArray(value.audit.memory_event_ids_used, '$.audit.memory_event_ids_used')
  stringArray(value.audit.assumptions, '$.audit.assumptions')
  stringArray(value.audit.unresolved_ambiguities, '$.audit.unresolved_ambiguities')
  if (value.audit.difficulty_regulation_note !== null)
    boundedString(value.audit.difficulty_regulation_note, '$.audit.difficulty_regulation_note', 1, 500)
}

export function parseTurnOutput(value: unknown, expectedTurnId: string, expectedVersion: number): TurnOutput {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула не JSON-объект.')
  validateTurnOutputShape(value, expectedTurnId, expectedVersion)
  return value as unknown as TurnOutput
}

const stringSchema = { type: 'string', maxLength: 1000 } as const
const stringArraySchema = { type: 'array', items: stringSchema, maxItems: 32 } as const
const strictObject = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})

const inventoryConditionSchema = {
  type: 'string',
  enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
} as const

const inventoryCategorySchema = {
  type: 'string',
  enum: ['tool', 'document', 'medicine', 'keepsake', 'resource'],
} as const

const inventorySlotSchema = {
  anyOf: [
    { type: 'string', enum: ['hand', 'body', 'bag'] },
    { type: 'null' },
  ],
} as const

const expectedInventorySchema = strictObject({
  owner_id: stringSchema,
  holder_id: stringSchema,
  location_id: stringSchema,
  container_id: { anyOf: [stringSchema, { type: 'null' }] },
  quantity: { type: 'integer', minimum: 0 },
  charges: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
  condition: inventoryConditionSchema,
  version: { type: 'integer', minimum: 0 },
})

const expectedSceneSchema = strictObject({
  scene_id: stringSchema,
  location_id: stringSchema,
  story_time: stringSchema,
})

const expectedScenePresenceSchema = strictObject({
  scene_id: stringSchema,
  present_character_ids: stringArraySchema,
})

const sceneDepartureSchema = strictObject({
  character_id: stringSchema,
  destination_location_id: stringSchema,
})

const turnOperationSchema = {
  oneOf: [
    strictObject({
      type: { type: 'string', const: 'event.create' },
      operation_index: { type: 'integer', minimum: 0 },
      event_id: stringSchema,
      event_kind: stringSchema,
      actor_ids: stringArraySchema,
      target_ids: stringArraySchema,
      item_ids: stringArraySchema,
      location_id: stringSchema,
      source_turn_id: stringSchema,
    }),
    strictObject({
      type: { type: 'string', const: 'scene.transition' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      scene_id: stringSchema,
      title: stringSchema,
      location_id: stringSchema,
      story_time: stringSchema,
      objective: stringSchema,
      present_character_ids: stringArraySchema,
      expected: expectedSceneSchema,
    }),
    strictObject({
      type: { type: 'string', const: 'scene.update_presence' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      present_character_ids: stringArraySchema,
      departures: {
        type: 'array',
        items: sceneDepartureSchema,
        maxItems: 16,
      },
      expected: expectedScenePresenceSchema,
    }),
    strictObject({
      type: { type: 'string', const: 'fact.create' },
      operation_index: { type: 'integer', minimum: 0 },
      fact_id: stringSchema,
      claim: stringSchema,
      truth_status: { type: 'string', enum: ['observed', 'reported', 'inferred', 'contested'] },
      source_event_ids: stringArraySchema,
    }),
    strictObject({
      type: { type: 'string', const: 'knowledge.grant' },
      operation_index: { type: 'integer', minimum: 0 },
      character_id: stringSchema,
      fact_id: stringSchema,
      source_event_id: stringSchema,
      confidence: { type: 'number', minimum: 0, maximum: 1 },
    }),
    strictObject({
      type: { type: 'string', const: 'inventory.create_instance' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      item_id: stringSchema,
      template_id: stringSchema,
      name: stringSchema,
      category: inventoryCategorySchema,
      description: stringSchema,
      owner_id: stringSchema,
      holder_id: stringSchema,
      location_id: stringSchema,
      quantity: { type: 'integer', minimum: 1 },
      charges: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
      condition: inventoryConditionSchema,
      slot: inventorySlotSchema,
    }),
    strictObject({
      type: { type: 'string', const: 'inventory.transfer_custody' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      item_id: stringSchema,
      from_holder_id: stringSchema,
      to_holder_id: stringSchema,
      quantity: { type: 'integer', minimum: 1 },
      expected: expectedInventorySchema,
    }),
    strictObject({
      type: { type: 'string', const: 'inventory.transfer_ownership' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      item_id: stringSchema,
      from_owner_id: stringSchema,
      to_owner_id: stringSchema,
      quantity: { type: 'integer', minimum: 1 },
      expected: expectedInventorySchema,
    }),
    strictObject({
      type: { type: 'string', const: 'inventory.consume' },
      operation_index: { type: 'integer', minimum: 0 },
      source_event_id: stringSchema,
      item_id: stringSchema,
      amount: { type: 'integer', minimum: 1 },
      expected: expectedInventorySchema,
    }),
  ],
} as const

export const TURN_OUTPUT_JSON_SCHEMA = strictObject({
  schema_version: { type: 'string', const: 'turn-output@0.2' },
  turn_id: { type: 'string' },
  expected_session_version: { type: 'integer', minimum: 0 },
  status: { type: 'string', enum: ['resolved', 'clarification_required', 'rejected'] },
  intent: strictObject({
    type: stringSchema,
    targets: stringArraySchema,
    referenced_entities: stringArraySchema,
    atomic_steps: {
      type: 'array',
      maxItems: 12,
      items: strictObject({
        step: stringSchema,
        phase: { type: 'string', enum: ['prepare', 'attempt', 'complete', 'interrupted'] },
        explicit_or_inferred: { type: 'string', enum: ['explicit', 'inferred'] },
        actor_id: stringSchema,
        target_ids: stringArraySchema,
        item_ids: stringArraySchema,
        source_location_id: { anyOf: [stringSchema, { type: 'null' }] },
        destination_location_id: { anyOf: [stringSchema, { type: 'null' }] },
        hands_required: { type: 'integer', minimum: 0, maximum: 2 },
        attention_required: stringSchema,
        duration_seconds: { type: 'integer', minimum: 0, maximum: 86400 },
        noise_band: { type: 'integer', minimum: 0, maximum: 5 },
        visibility: stringSchema,
        precondition_codes: stringArraySchema,
        interruption_points: stringArraySchema,
        completion_evidence: stringArraySchema,
      }),
    },
  }),
  context_check: strictObject({
    actor_can_attempt: { type: 'boolean' },
    actor_conscious: { type: 'boolean' },
    target_reachable: { type: 'boolean' },
    target_perceivable: { type: 'boolean' },
    item_accessible: { type: 'boolean' },
    ownership_valid: { type: 'boolean' },
    knowledge_sources_valid: { type: 'boolean' },
    channel_valid: { type: 'boolean' },
    scope_valid: { type: 'boolean' },
    consent_valid: { type: 'boolean' },
    barriers_allow_attempt: { type: 'boolean' },
    time_sufficient: { type: 'boolean' },
    blocking_reasons: stringArraySchema,
  }),
  difficulty: strictObject({
    base: { type: 'integer', minimum: -5, maximum: 5 },
    environment: { type: 'integer', minimum: -5, maximum: 5 },
    time_pressure: { type: 'integer', minimum: -5, maximum: 5 },
    injury: { type: 'integer', minimum: -5, maximum: 5 },
    opposition: { type: 'integer', minimum: -5, maximum: 5 },
    skill: { type: 'integer', minimum: -5, maximum: 5 },
    tools: { type: 'integer', minimum: -5, maximum: 5 },
    preparation: { type: 'integer', minimum: -5, maximum: 5 },
    help: { type: 'integer', minimum: -5, maximum: 5 },
    final_band: { type: 'integer', minimum: 0, maximum: 5 },
    uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
  }),
  resolution: strictObject({
    summary: stringSchema,
    outcome: { type: 'string', enum: ['success', 'partial_success', 'failure', 'impossible'] },
    reason_codes: stringArraySchema,
    costs_and_consequences: stringArraySchema,
  }),
  operations: { type: 'array', maxItems: 24, items: turnOperationSchema },
  narrative_brief: strictObject({
    must_include: stringArraySchema,
    must_not_invent: stringArraySchema,
    tone: stringSchema,
    point_of_view: { type: 'string', const: 'second_person' },
    sensory_scope: stringArraySchema,
  }),
  narrative_text: { type: 'string', maxLength: 6000 },
  suggested_actions: {
    type: 'array',
    maxItems: 6,
    items: strictObject({
      label: stringSchema,
      mode: { type: 'string', enum: ['action', 'speech', 'exploration'] },
      intent_hint: stringSchema,
    }),
  },
  media_candidate: {
    anyOf: [
      { type: 'null' },
      strictObject({
        event_id: stringSchema,
        kind: { type: 'string', enum: ['image', 'video'] },
        salience: { type: 'number', minimum: 0, maximum: 1 },
        reason_codes: stringArraySchema,
        exclusive_event_hint: { type: 'boolean' },
      }),
    ],
  },
  safety_flags: stringArraySchema,
  audit: strictObject({
    canon_fact_ids_used: stringArraySchema,
    memory_event_ids_used: stringArraySchema,
    assumptions: stringArraySchema,
    unresolved_ambiguities: stringArraySchema,
    difficulty_regulation_note: { anyOf: [stringSchema, { type: 'null' }] },
  }),
})

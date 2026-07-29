import { STORY_PACKS } from '../../shared/storypacks'
import { AI_MODELS } from './catalog'
import type { FabulaAiConfig } from './config'
import type { JsonValue, TurnCommand, TurnOutput } from './contracts'
import { ContractError, parseTurnOutput, TURN_OUTPUT_JSON_SCHEMA } from './contracts'
import { AiExecutionError, FabulaApiError } from './http'
import type { SafeModelRun } from './http'
import { OpenRouterClient, OpenRouterError } from './openrouter'
import type { EngineSessionSnapshot, SessionTurnResult, TurnOutputValidator } from '../game/session-repository'
import { getStoryPackContext } from '../game/storypack-context'

export interface TurnEngineResult extends SessionTurnResult {
  modelRuns: SafeModelRun[]
}

type PromptLoader = (moduleId: 'authoritative-turn' | 'scene-plan') => Promise<string>

export const TURN_MODEL_TIMEOUTS = {
  primaryMs: 55_000,
  fallbackMs: 25_000,
} as const

export class TurnEngine {
  private readonly client: OpenRouterClient
  private readonly promptLoader: PromptLoader

  constructor(
    config: FabulaAiConfig,
    client = new OpenRouterClient(config),
    promptLoader: PromptLoader = async moduleId => (await import('./prompts')).getSystemPrompt(moduleId),
  ) {
    this.client = client
    this.promptLoader = promptLoader
  }

  async execute(
    command: TurnCommand,
    snapshot: EngineSessionSnapshot,
    signal?: AbortSignal,
    validateOutput?: TurnOutputValidator,
  ): Promise<TurnEngineResult> {
    const modelRuns: SafeModelRun[] = []
    const packet = buildTurnPacket(command, snapshot, null)
    const primary = await this.tryTurnModel(
      AI_MODELS.deepseek.slug,
      'primary',
      packet,
      command,
      modelRuns,
      snapshot,
      validateOutput,
      signal,
    )
    if (primary) {
      return {
        output: primary,
        model: AI_MODELS.deepseek.slug,
        fallbackUsed: false,
        advisoryUsed: false,
        modelRuns,
      }
    }

    const fallback = await this.tryTurnModel(
      AI_MODELS.mistral.slug,
      'fallback',
      withRepairFeedback(packet, modelRuns.at(-1)),
      command,
      modelRuns,
      snapshot,
      validateOutput,
      signal,
    )
    if (fallback) {
      return {
        output: fallback,
        model: AI_MODELS.mistral.slug,
        fallbackUsed: true,
        advisoryUsed: false,
        modelRuns,
      }
    }

    const repairableFallback = modelRuns.at(-1)
    if (isRepairableModelRun(repairableFallback)) {
      const repairedFallback = await this.tryTurnModel(
        AI_MODELS.mistral.slug,
        'fallback',
        withRepairFeedback(packet, repairableFallback),
        command,
        modelRuns,
        snapshot,
        validateOutput,
        signal,
      )
      if (repairedFallback) {
        return {
          output: repairedFallback,
          model: AI_MODELS.mistral.slug,
          fallbackUsed: true,
          advisoryUsed: false,
          modelRuns,
        }
      }
    }

    {
      throw new AiExecutionError(
        'MODEL_FALLBACK_EXHAUSTED',
        'Основная и резервная модели не вернули безопасный ход.',
        modelRuns,
        modelRuns.some(run => run.error_code === 'UPSTREAM_TIMEOUT' || run.error_code === 'UPSTREAM_RATE_LIMITED'),
      )
    }
  }

  private async tryTurnModel(
    model: string,
    role: 'primary' | 'fallback',
    packet: Record<string, JsonValue>,
    command: TurnCommand,
    modelRuns: SafeModelRun[],
    snapshot: EngineSessionSnapshot,
    validateOutput?: TurnOutputValidator,
    signal?: AbortSignal,
  ) {
    let result: Awaited<ReturnType<OpenRouterClient['chatJson']>> | null = null
    try {
      result = await this.client.chatJson({
        model,
        system: await this.promptLoader('authoritative-turn'),
        payload: packet,
        maxOutputTokens: role === 'primary' ? 5200 : 2600,
        timeoutMs: role === 'primary' ? TURN_MODEL_TIMEOUTS.primaryMs : TURN_MODEL_TIMEOUTS.fallbackMs,
        signal,
        maxPrice: role === 'primary'
          ? { prompt: 0.15, completion: 0.3 }
          : { prompt: 0.25, completion: 0.8 },
        schema: {
          name: 'fabula_turn_output_0_2',
          schema: TURN_OUTPUT_JSON_SCHEMA,
        },
      })
      const output = parseTurnOutput(
        withServerEnvelope(result.output, command, snapshot),
        command.idempotency_key,
        command.expected_session_version,
      )
      assertKnownReferences(output, snapshot)
      validateOutput?.(output)
      modelRuns.push({
        role,
        model: result.model,
        request_id: result.requestId,
        usage: result.usage,
        status: 'accepted',
        error_code: null,
        validation_errors: [],
      })
      return output
    }
    catch (error) {
      modelRuns.push({
        role,
        model: result?.model || openRouterModel(error) || model,
        request_id: result?.requestId || openRouterRequestId(error),
        usage: result?.usage || openRouterUsage(error),
        status: 'discarded',
        error_code: safeErrorCode(error),
        validation_errors: safeValidationErrors(error),
      })
      if (signal?.aborted)
        throw error
      return null
    }
  }
}

function buildTurnPacket(
  command: TurnCommand,
  snapshot: EngineSessionSnapshot,
  scenePlan: Record<string, JsonValue> | null,
): Record<string, JsonValue> {
  const story = STORY_PACKS[snapshot.storyPackId]
  const context = getStoryPackContext(snapshot.storyPackId)
  const failedAttempts = snapshot.history.filter(turn => turn.outcome === 'failure' || turn.outcome === 'impossible').length
  return {
    schema_version: 'turn-input@0.2',
    prompt_version: 'turn-engine@0.3.0',
    trace_id: `trace:${command.idempotency_key}`,
    turn_id: command.idempotency_key,
    session_id: command.session_id,
    expected_session_version: command.expected_session_version,
    mode: command.mode,
    player_input: {
      text: command.text,
      target_ids: command.selected_target_ids,
      item_ids: command.selected_item_ids,
      selected_suggestion_id: command.selected_suggestion_id,
    },
    scene: {
      scene_id: snapshot.scene.id,
      mode: command.mode,
      location_id: snapshot.scene.location_id,
      present_character_ids: snapshot.scene.present_character_ids,
      time: snapshot.scene.story_time,
      scene_plan: scenePlan,
    },
    canon_snapshot: {
      title: story.title,
      story_pack_id: snapshot.storyPackId,
      story_pack_version: snapshot.storyPackVersion,
      hard_canon: context.hardCanon.map((claim, index) => ({
        fact_id: `canon:${snapshot.storyPackId}:${index + 1}`,
        claim,
      })),
      state_catalog: context.stateCatalog,
      player: {
        id: 'player',
        name: snapshot.persona.name,
        role: snapshot.persona.role_label,
        competence: snapshot.persona.competence,
        limitation: snapshot.persona.limitation,
        motivation: snapshot.persona.motivation,
        embodiment_note: snapshot.persona.embodiment_note,
      },
      scene: {
        id: snapshot.scene.id,
        title: snapshot.scene.title,
        location_id: snapshot.scene.location_id,
        location_name: snapshot.scene.location_name,
        story_time: snapshot.scene.story_time,
        objective: snapshot.scene.objective,
      },
      inventory: snapshot.inventory.map(item => ({
        id: item.id,
        template_id: item.template_id,
        name: item.name,
        quantity: item.quantity,
        charges: item.charges,
        condition: item.condition,
        owner_id: item.owner_id,
        holder_id: item.holder_id,
        location_id: item.location_id,
        container_id: null,
        version: item.version,
      })),
      characters: story.publicCharacters.map(character => ({
        id: character.id,
        name: character.name,
        role: character.role,
        relation: character.relation,
        known_to_player: snapshot.characters.some(known => known.id === character.id),
        present_in_scene: snapshot.scene.present_character_ids.includes(character.id),
      })),
      locations: story.publicLocations.map(location => ({
        id: location.id,
        name: location.name,
        known_to_player: snapshot.locations.some(known => known.id === location.id),
        current: snapshot.scene.location_id === location.id,
      })),
      confirmed_events: snapshot.confirmedEvents.slice(-24).map(event => ({
        id: event.id,
        kind: event.kind,
        actor_ids: event.actorIds,
        target_ids: event.targetIds,
        item_ids: event.itemIds,
        location_id: event.locationId,
        source_turn_id: event.sourceTurnId,
      })),
      confirmed_facts: snapshot.confirmedFacts.slice(-32).map(fact => ({
        id: fact.id,
        claim: fact.claim,
        truth_status: fact.truthStatus,
        source_event_ids: fact.sourceEventIds,
      })),
    },
    relevant_memories: snapshot.history.slice(-6).map(turn => ({
      turn_id: turn.turnId,
      mode: turn.mode,
      outcome: turn.outcome,
      narrative_summary: turn.narrative.slice(0, 600),
    })),
    pack_rules: {
      story_pack_id: snapshot.storyPackId,
      story_pack_version: snapshot.storyPackVersion,
      prompt_overlay_version: context.promptOverlayVersion,
      prompt_overlay: context.promptOverlay,
      operation_catalog_version: 'fabula-beta-operations@0.2',
    },
    resolution_randomness: {
      mode: 'deterministic',
      server_roll: null,
      rule_version: 'difficulty-resolution@0.2',
    },
    player_performance_summary: {
      window_turn_ids: snapshot.history.slice(-10).map(turn => turn.turnId),
      failed_attempts: failedAttempts,
      repeated_intents: 0,
      hints_used: 0,
      current_injuries: [],
      resource_pressure: 'low',
      stuck_signal: failedAttempts >= 3,
    },
    authority: {
      known_entities: knownEntityCatalog(snapshot),
      reserved_ids: {
        events: snapshot.reservedIds.events,
        facts: snapshot.reservedIds.facts,
        item_instances: snapshot.reservedIds.itemInstances,
        scenes: snapshot.reservedIds.scenes,
      },
      allowed_operation_types: [...snapshot.allowedOperationTypes],
      allowed_field_catalog: {
        'event.create': ['event_id', 'event_kind', 'actor_ids', 'target_ids', 'item_ids', 'location_id', 'source_turn_id'],
        'scene.transition': ['source_event_id', 'scene_id', 'title', 'location_id', 'story_time', 'objective', 'present_character_ids', 'expected'],
        'scene.update_presence': ['source_event_id', 'present_character_ids', 'departures', 'expected'],
        'fact.create': ['fact_id', 'claim', 'truth_status', 'source_event_ids'],
        'knowledge.grant': ['character_id', 'fact_id', 'source_event_id', 'confidence'],
        'inventory.create_instance': ['source_event_id', 'item_id', 'template_id', 'name', 'category', 'description', 'owner_id', 'holder_id', 'location_id', 'quantity', 'charges', 'condition', 'slot'],
        'inventory.transfer_custody': ['source_event_id', 'item_id', 'from_holder_id', 'to_holder_id', 'quantity', 'expected'],
        'inventory.transfer_ownership': ['source_event_id', 'item_id', 'from_owner_id', 'to_owner_id', 'quantity', 'expected'],
        'inventory.consume': ['source_event_id', 'item_id', 'amount', 'expected'],
      },
      operation_constraints: {
        knowledge_grant_recipient_ids: snapshot.characters.map(character => character.id),
      },
    },
    policy_hints: {
      media_may_be_suggested: false,
      safety_profile: context.safetyProfile,
      narration_density: snapshot.persona.narration_density,
      output_invariants: {
        blocking_reasons: 'empty_iff_all_context_checks_are_true',
        resolved_outcomes: ['success', 'partial_success', 'failure'],
        rejected_outcome: 'impossible',
      },
    },
  }
}

function withRepairFeedback(
  packet: Record<string, JsonValue>,
  previousRun: SafeModelRun | undefined,
): Record<string, JsonValue> {
  if (!previousRun)
    return packet
  return {
    ...packet,
    repair_feedback: {
      previous_role: previousRun.role,
      error_code: previousRun.error_code,
      validation_errors: previousRun.validation_errors,
    },
  }
}

function withServerEnvelope(
  output: unknown,
  command: TurnCommand,
  snapshot: EngineSessionSnapshot,
): unknown {
  if (!output || typeof output !== 'object' || Array.isArray(output))
    return output
  const storyContext = getStoryPackContext(snapshot.storyPackId)
  const allowedIds = new Set([
    command.idempotency_key,
    snapshot.scene.id,
    ...knownEntityCatalog(snapshot).map(entity => entity.id),
    ...snapshot.reservedIds.events,
    ...snapshot.reservedIds.facts,
    ...snapshot.reservedIds.itemInstances,
    ...snapshot.reservedIds.scenes,
    ...snapshot.confirmedEvents.map(event => event.id),
    ...snapshot.confirmedFacts.map(fact => fact.id),
    ...storyContext.hardCanon.map((_, index) => `canon:${snapshot.storyPackId}:${index + 1}`),
  ])
  const record = canonicalizeModelIds(output, null, allowedIds) as Record<string, unknown>
  const rawContextCheck = record.context_check
  const contextCheck = rawContextCheck && typeof rawContextCheck === 'object' && !Array.isArray(rawContextCheck)
    ? rawContextCheck as Record<string, unknown>
    : null
  const contextCheckKeys = [
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
  ]
  const normalizedContextCheck = contextCheck && contextCheckKeys.every(key => contextCheck[key] === true)
    ? { ...contextCheck, blocking_reasons: [] }
    : rawContextCheck
  const operations = Array.isArray(record.operations)
    ? record.operations.map((operation) => {
        if (!operation || typeof operation !== 'object' || Array.isArray(operation))
          return operation
        const operationRecord = operation as Record<string, unknown>
        return operationRecord.type === 'event.create'
          ? { ...operationRecord, source_turn_id: command.idempotency_key }
          : operation
      })
    : record.operations
  return {
    ...record,
    turn_id: command.idempotency_key,
    expected_session_version: command.expected_session_version,
    operations,
    context_check: normalizedContextCheck,
  }
}

function canonicalizeModelIds(
  value: unknown,
  key: string | null,
  allowedIds: ReadonlySet<string>,
): unknown {
  if (typeof value === 'string' && key && (
    key.endsWith('_id')
    || key.endsWith('_ids')
    || key === 'targets'
    || key === 'referenced_entities'
  )) {
    return closestAllowedId(value, allowedIds)
  }
  if (Array.isArray(value))
    return value.map(item => canonicalizeModelIds(item, key, allowedIds))
  if (!value || typeof value !== 'object')
    return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([childKey, childValue]) => [
        childKey,
        canonicalizeModelIds(childValue, childKey, allowedIds),
      ]),
  )
}

function closestAllowedId(value: string, allowedIds: ReadonlySet<string>): string {
  if (allowedIds.has(value))
    return value
  const prefix = value.includes(':') ? value.slice(0, value.indexOf(':')) : value
  let best: string | null = null
  let bestDistance = 3
  let tied = false
  for (const candidate of allowedIds) {
    const candidatePrefix = candidate.includes(':') ? candidate.slice(0, candidate.indexOf(':')) : candidate
    if (candidatePrefix !== prefix)
      continue
    const distance = boundedEditDistance(value, candidate, 2)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
      tied = false
    }
    else if (distance === bestDistance) {
      tied = true
    }
  }
  return best && !tied && bestDistance <= 2 ? best : value
}

function boundedEditDistance(left: string, right: string, limit: number): number {
  if (Math.abs(left.length - right.length) > limit)
    return limit + 1
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    let rowBest = current[0]!
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      const next = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + cost,
      )
      current.push(next)
      rowBest = Math.min(rowBest, next)
    }
    if (rowBest > limit)
      return limit + 1
    previous = current
  }
  return previous[right.length]!
}

function isRepairableModelRun(run: SafeModelRun | undefined): boolean {
  return run?.status === 'discarded' && [
    'MODEL_AUTHORITY_ERROR',
    'MODEL_CONTRACT_ERROR',
    'MODEL_INVARIANT_ERROR',
  ].includes(run.error_code || '')
}

function knownEntityCatalog(snapshot: EngineSessionSnapshot) {
  const story = STORY_PACKS[snapshot.storyPackId]
  return [
    {
      id: 'player',
      kind: 'player',
      name: snapshot.persona.name,
    },
    ...story.publicCharacters.map(character => ({
      id: character.id,
      kind: 'character',
      name: character.name,
    })),
    ...story.publicLocations.map(location => ({
      id: location.id,
      kind: 'location',
      name: location.name,
    })),
    ...snapshot.inventory.map(item => ({
      id: item.id,
      kind: 'item',
      name: item.name,
    })),
  ]
}

function assertKnownReferences(output: TurnOutput, snapshot: EngineSessionSnapshot): void {
  const catalog = knownEntityCatalog(snapshot)
  const knownIds = new Set(catalog.map(entity => entity.id))
  const locationIds = new Set(catalog.filter(entity => entity.kind === 'location').map(entity => entity.id))
  const characterIds = new Set([
    'player',
    ...catalog.filter(entity => entity.kind === 'character').map(entity => entity.id),
  ])
  const knowledgeRecipientIds = new Set(snapshot.characters.map(character => character.id))
  const itemIds = new Set(catalog.filter(entity => entity.kind === 'item').map(entity => entity.id))
  const eventItemIds = new Set([...itemIds, ...snapshot.reservedIds.itemInstances])

  const assertIds = (values: string[], allowed: Set<string>, path: string) => {
    const unknown = values.filter(value => !allowed.has(value))
    if (unknown.length) {
      throw new ContractError(
        'MODEL_AUTHORITY_ERROR',
        'Модель сослалась на сущность вне серверного каталога.',
        unknown.map(value => `${path}:${value}`),
      )
    }
  }
  const assertNullableId = (value: JsonValue, allowed: Set<string>, path: string) => {
    if (value !== null && (typeof value !== 'string' || !allowed.has(value))) {
      throw new ContractError(
        'MODEL_AUTHORITY_ERROR',
        'Модель сослалась на сущность вне серверного каталога.',
        [`${path}:${String(value)}`],
      )
    }
  }

  assertIds(output.intent.targets, knownIds, '$.intent.targets')
  assertIds(output.intent.referenced_entities, knownIds, '$.intent.referenced_entities')
  output.intent.atomic_steps.forEach((step, index) => {
    assertIds([String(step.actor_id)], knownIds, `$.intent.atomic_steps[${index}].actor_id`)
    assertIds(step.target_ids as string[], knownIds, `$.intent.atomic_steps[${index}].target_ids`)
    assertIds(step.item_ids as string[], itemIds, `$.intent.atomic_steps[${index}].item_ids`)
    assertNullableId(step.source_location_id ?? null, locationIds, `$.intent.atomic_steps[${index}].source_location_id`)
    assertNullableId(step.destination_location_id ?? null, locationIds, `$.intent.atomic_steps[${index}].destination_location_id`)
  })

  output.operations.forEach((operation, index) => {
    const path = `$.operations[${index}]`
    if (operation.type === 'event.create') {
      assertIds(operation.actor_ids, knownIds, `${path}.actor_ids`)
      assertIds(operation.target_ids, knownIds, `${path}.target_ids`)
      assertIds(operation.item_ids, eventItemIds, `${path}.item_ids`)
      assertIds([operation.location_id], locationIds, `${path}.location_id`)
      for (const entityId of [...operation.actor_ids, ...operation.target_ids]) {
        if (characterIds.has(entityId) && entityId !== 'player')
          knowledgeRecipientIds.add(entityId)
      }
    }
    else if (operation.type === 'scene.transition') {
      assertIds([operation.location_id], locationIds, `${path}.location_id`)
      assertIds(operation.present_character_ids, characterIds, `${path}.present_character_ids`)
    }
    else if (operation.type === 'scene.update_presence') {
      assertIds(operation.present_character_ids, characterIds, `${path}.present_character_ids`)
      operation.departures.forEach((departure, departureIndex) => {
        assertIds([departure.character_id], characterIds, `${path}.departures[${departureIndex}].character_id`)
        assertIds([departure.destination_location_id], locationIds, `${path}.departures[${departureIndex}].destination_location_id`)
      })
    }
    else if (operation.type === 'knowledge.grant') {
      assertIds([operation.character_id], knowledgeRecipientIds, `${path}.character_id`)
    }
    else if (operation.type === 'inventory.create_instance') {
      assertIds([operation.item_id], new Set(snapshot.reservedIds.itemInstances), `${path}.item_id`)
      assertIds([operation.owner_id, operation.holder_id], characterIds, `${path}.owner_id`)
      assertIds([operation.location_id], locationIds, `${path}.location_id`)
    }
    else if (operation.type === 'inventory.transfer_custody') {
      assertIds([operation.item_id], itemIds, `${path}.item_id`)
      assertIds([operation.from_holder_id, operation.to_holder_id], characterIds, `${path}.holder_id`)
    }
    else if (operation.type === 'inventory.transfer_ownership') {
      assertIds([operation.item_id], itemIds, `${path}.item_id`)
      assertIds([operation.from_owner_id, operation.to_owner_id], characterIds, `${path}.owner_id`)
    }
    else if (operation.type === 'inventory.consume') {
      assertIds([operation.item_id], itemIds, `${path}.item_id`)
    }
  })
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ContractError || error instanceof OpenRouterError || error instanceof FabulaApiError)
    return error.code
  return 'UNKNOWN_MODEL_ERROR'
}

function safeValidationErrors(error: unknown): string[] {
  if (error instanceof ContractError)
    return error.fieldErrors.slice(0, 20)
  if (error instanceof FabulaApiError) {
    return error.fieldErrors.length
      ? error.fieldErrors.slice(0, 20)
      : [`repository:${error.code}:${error.message}`]
  }
  return []
}

function openRouterModel(error: unknown): string | null {
  return error instanceof OpenRouterError ? error.upstreamModel : null
}

function openRouterRequestId(error: unknown): string | null {
  return error instanceof OpenRouterError ? error.upstreamRequestId : null
}

function openRouterUsage(error: unknown) {
  return error instanceof OpenRouterError ? error.upstreamUsage : null
}

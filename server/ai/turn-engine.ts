import { STORY_PACKS } from '../../shared/storypacks'
import { AI_MODELS } from './catalog'
import type { FabulaAiConfig } from './config'
import type { JsonValue, TurnCommand } from './contracts'
import { ContractError, parseTurnOutput, TURN_OUTPUT_JSON_SCHEMA } from './contracts'
import { AiExecutionError } from './http'
import type { SafeModelRun } from './http'
import { OpenRouterClient, OpenRouterError } from './openrouter'
import { sanitizeNemotronPayload } from './security'
import type { EngineSessionSnapshot, SessionTurnResult } from '../game/session-repository'
import { getStoryPackContext } from '../game/storypack-context'
import { getStandaloneContract, parseStandaloneOutput } from './standalone-contracts'

export interface TurnEngineResult extends SessionTurnResult {
  modelRuns: SafeModelRun[]
}

type PromptLoader = (moduleId: 'authoritative-turn' | 'scene-plan') => Promise<string>

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

  async execute(command: TurnCommand, snapshot: EngineSessionSnapshot): Promise<TurnEngineResult> {
    const modelRuns: SafeModelRun[] = []
    const advisory = await this.maybePlan(command, snapshot, modelRuns)
    const packet = buildTurnPacket(command, snapshot, advisory)
    const primary = await this.tryTurnModel(
      AI_MODELS.deepseek.slug,
      'primary',
      packet,
      command,
      modelRuns,
    )
    if (primary) {
      return {
        output: primary,
        model: AI_MODELS.deepseek.slug,
        fallbackUsed: false,
        advisoryUsed: advisory !== null,
        modelRuns,
      }
    }

    const fallback = await this.tryTurnModel(
      AI_MODELS.mistral.slug,
      'fallback',
      packet,
      command,
      modelRuns,
    )
    if (!fallback) {
      throw new AiExecutionError(
        'MODEL_FALLBACK_EXHAUSTED',
        'Основная и резервная модели не вернули безопасный ход.',
        modelRuns,
        modelRuns.some(run => run.error_code === 'UPSTREAM_TIMEOUT' || run.error_code === 'UPSTREAM_RATE_LIMITED'),
      )
    }
    return {
      output: fallback,
      model: AI_MODELS.mistral.slug,
      fallbackUsed: true,
      advisoryUsed: advisory !== null,
      modelRuns,
    }
  }

  private async maybePlan(
    command: TurnCommand,
    snapshot: EngineSessionSnapshot,
    modelRuns: SafeModelRun[],
  ): Promise<Record<string, JsonValue> | null> {
    const sanitized = sanitizeNemotronPayload({
      story_pack_id: snapshot.storyPackId,
      scene_id: snapshot.scene.id,
      entity_roles: ['player', 'present_npc'],
      confirmed_fact_refs: snapshot.confirmedFacts.slice(-16).map(fact => fact.id),
      confirmed_event_refs: snapshot.confirmedEvents.slice(-16).map(event => event.id),
      resource_bands: ['unknown'],
      active_threads: [snapshot.scene.objective],
      unresolved_callbacks: [],
      pack_constraints: ['no_new_canon', 'no_pii'],
      recent_outcome_bands: snapshot.history.slice(-6).map(turn => turn.outcome),
      available_paths: ['action', 'speech', 'exploration'],
      allowed_difficulty_knobs: ['clarity', 'time_pressure', 'opposition'],
    }) as Record<string, JsonValue>
    const freePlan = await this.tryScenePlan(
      AI_MODELS.nemotronFree,
      sanitized,
      true,
      modelRuns,
    )
    if (freePlan)
      return freePlan
    return this.tryScenePlan(
      AI_MODELS.nemotronPaid,
      sanitized,
      false,
      modelRuns,
    )
  }

  private async tryScenePlan(
    model: typeof AI_MODELS.nemotronFree | typeof AI_MODELS.nemotronPaid,
    payload: Record<string, JsonValue>,
    freeEndpoint: boolean,
    modelRuns: SafeModelRun[],
  ): Promise<Record<string, JsonValue> | null> {
    let result: Awaited<ReturnType<OpenRouterClient['chatJson']>> | null = null
    try {
      const contract = getStandaloneContract('scene-plan')
      result = await this.client.chatJson({
        model: model.slug,
        system: await this.promptLoader('scene-plan'),
        payload,
        maxOutputTokens: 1800,
        maxPrice: freeEndpoint
          ? { prompt: 0, completion: 0 }
          : { prompt: 0.55, completion: 2.3 },
        sanitizedFreeEndpoint: freeEndpoint,
        jsonMode: model.jsonMode,
        schema: model.jsonMode === 'json-schema' ? contract : undefined,
      })
      const output = parseStandaloneOutput('scene-plan', result.output)
      modelRuns.push({
        role: 'advisory',
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
        role: 'advisory',
        model: result?.model || openRouterModel(error) || model.slug,
        request_id: result?.requestId || openRouterRequestId(error),
        usage: result?.usage || openRouterUsage(error),
        status: 'discarded',
        error_code: safeErrorCode(error),
        validation_errors: safeValidationErrors(error),
      })
      return null
    }
  }

  private async tryTurnModel(
    model: string,
    role: 'primary' | 'fallback',
    packet: Record<string, JsonValue>,
    command: TurnCommand,
    modelRuns: SafeModelRun[],
  ) {
    let result: Awaited<ReturnType<OpenRouterClient['chatJson']>> | null = null
    try {
      result = await this.client.chatJson({
        model,
        system: await this.promptLoader('authoritative-turn'),
        payload: packet,
        maxOutputTokens: 4000,
        maxPrice: role === 'primary'
          ? { prompt: 0.15, completion: 0.3 }
          : { prompt: 0.25, completion: 0.8 },
        schema: {
          name: 'fabula_turn_output_0_2',
          schema: TURN_OUTPUT_JSON_SCHEMA,
        },
      })
      const output = parseTurnOutput(result.output, command.idempotency_key, command.expected_session_version)
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
    },
    policy_hints: {
      media_may_be_suggested: false,
      safety_profile: context.safetyProfile,
      narration_density: snapshot.persona.narration_density,
    },
  }
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ContractError || error instanceof OpenRouterError)
    return error.code
  return 'UNKNOWN_MODEL_ERROR'
}

function safeValidationErrors(error: unknown): string[] {
  return error instanceof ContractError ? error.fieldErrors.slice(0, 20) : []
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

import { AI_MODELS } from './catalog'
import type { FabulaAiConfig } from './config'
import type { JsonValue, TurnCommand } from './contracts'
import { ContractError, parseTurnOutput, TURN_OUTPUT_JSON_SCHEMA } from './contracts'
import type { OpenRouterUsage } from './openrouter'
import { OpenRouterClient, OpenRouterError } from './openrouter'
import { getSystemPrompt } from './prompts'
import { sanitizeNemotronPayload } from './security'
import type { SessionSnapshot, SessionTurnResult } from './session-store'

interface ModelRunSummary {
  role: 'advisory' | 'primary' | 'fallback'
  model: string
  requestId: string | null
  usage: OpenRouterUsage | null
  status: 'accepted' | 'discarded'
  errorCode: string | null
}

export interface TurnEngineResult extends SessionTurnResult {
  modelRuns: ModelRunSummary[]
}

const STORY_CONTEXT: Record<TurnCommand['story_id'], {
  packId: string
  title: string
  location: string
  character: string
  objective: string
  state: string[]
  overlay: string
}> = {
  fant: {
    packId: 'eighth-seal',
    title: 'Пепельные земли',
    location: 'Руины Эхокарты',
    character: 'Старик-хранитель',
    objective: 'Решить, кому достанется право разбудить Цитадель',
    state: ['Сумерки', 'Пепельный ветер', 'Клятва не названа'],
    overlay: 'Договорная магия имеет заранее известную цену. Артефакты не меняют владельца без подтвержденного события.',
  },
  scifi: {
    packId: 'zeroed',
    title: 'Станция "Кассандра"',
    location: 'Сектор D-17',
    character: 'Кассандра / AI',
    objective: 'Найти последний журнал экипажа и проверить память Кассандры',
    state: ['Аварийный свет', 'Иней в шлюзе', 'Второй источник питания'],
    overlay: 'Технологии физически ограничены. Цифровой доступ требует capability, а доказательства сохраняют provenance.',
  },
  hist: {
    packId: 'road-from-capua',
    title: 'Дорога из Капуи',
    location: 'Дорога из Капуи',
    character: 'Марк Лициний',
    objective: 'Доставить табличку, не выдав заговор и своих людей',
    state: ['Перед рассветом', 'Дорога без стражи', 'Свидетель у костра'],
    overlay: 'Макроистория и подтвержденные источники важнее удобного поворота. Counterfactual обязан быть причинным.',
  },
  post: {
    packId: 'history-of-how-i-got-here',
    title: 'Линия разрыва',
    location: 'Редакция "Север"',
    character: 'Лера Орлова',
    objective: 'Найти источник записи и защитить свидетеля',
    state: ['Ночная смена', 'Закрытый канал', 'Свидетель пропал'],
    overlay: 'Ресурсы, двери, свидетели, шум и следы изменяются только подтвержденными событиями.',
  },
}

export class TurnEngine {
  private readonly config: FabulaAiConfig
  private readonly client: OpenRouterClient

  constructor(config: FabulaAiConfig, client = new OpenRouterClient(config)) {
    this.config = config
    this.client = client
  }

  async execute(command: TurnCommand, snapshot: SessionSnapshot): Promise<TurnEngineResult> {
    const modelRuns: ModelRunSummary[] = []
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
    if (!fallback)
      throw new ContractError('MODEL_FALLBACK_EXHAUSTED', 'Основная и резервная модели не вернули безопасный ход.')
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
    snapshot: SessionSnapshot,
    modelRuns: ModelRunSummary[],
  ): Promise<Record<string, JsonValue> | null> {
    if (!this.config.nemotronEnabled)
      return null
    const sanitized = sanitizeNemotronPayload({
      story_pack_id: STORY_CONTEXT[command.story_id].packId,
      scene_id: command.story_id,
      entity_roles: ['player', 'present_npc'],
      confirmed_fact_refs: [],
      confirmed_event_refs: snapshot.history.map(turn => turn.turnId),
      resource_bands: ['unknown'],
      active_threads: ['primary_objective'],
      unresolved_callbacks: [],
      pack_constraints: ['no_new_canon', 'no_pii'],
      recent_outcome_bands: snapshot.history.slice(-6).map(turn => turn.outcome),
      available_paths: ['action', 'speech', 'exploration'],
      allowed_difficulty_knobs: ['clarity', 'time_pressure', 'opposition'],
    }) as Record<string, JsonValue>
    try {
      const result = await this.client.chatJson({
        model: AI_MODELS.nemotronFree.slug,
        system: await getSystemPrompt('scene-plan'),
        payload: sanitized,
        maxOutputTokens: 1800,
        maxPrice: { prompt: 0, completion: 0 },
        sanitizedFreeEndpoint: true,
      })
      if (!isScenePlan(result.output)) {
        modelRuns.push({
          role: 'advisory',
          model: result.model,
          requestId: result.requestId,
          usage: result.usage,
          status: 'discarded',
          errorCode: 'SCENE_PLAN_INVALID',
        })
        return null
      }
      modelRuns.push({
        role: 'advisory',
        model: result.model,
        requestId: result.requestId,
        usage: result.usage,
        status: 'accepted',
        errorCode: null,
      })
      return result.output
    }
    catch (error) {
      modelRuns.push({
        role: 'advisory',
        model: AI_MODELS.nemotronFree.slug,
        requestId: null,
        usage: null,
        status: 'discarded',
        errorCode: safeErrorCode(error),
      })
      return null
    }
  }

  private async tryTurnModel(
    model: string,
    role: 'primary' | 'fallback',
    packet: Record<string, JsonValue>,
    command: TurnCommand,
    modelRuns: ModelRunSummary[],
  ) {
    try {
      const result = await this.client.chatJson({
        model,
        system: await getSystemPrompt('authoritative-turn'),
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
        requestId: result.requestId,
        usage: result.usage,
        status: 'accepted',
        errorCode: null,
      })
      return output
    }
    catch (error) {
      modelRuns.push({
        role,
        model,
        requestId: null,
        usage: null,
        status: 'discarded',
        errorCode: safeErrorCode(error),
      })
      return null
    }
  }
}

function buildTurnPacket(
  command: TurnCommand,
  snapshot: SessionSnapshot,
  scenePlan: Record<string, JsonValue> | null,
): Record<string, JsonValue> {
  const story = STORY_CONTEXT[command.story_id]
  const failedAttempts = snapshot.history.filter(turn => turn.outcome === 'failure' || turn.outcome === 'impossible').length
  return {
    schema_version: 'turn-input@0.2',
    prompt_version: 'turn-engine@0.2.0',
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
      scene_id: `scene:${command.story_id}`,
      mode: command.mode,
      location_id: `location:${command.story_id}`,
      present_character_ids: [`character:${command.story_id}:primary`],
      time: 'current_scene',
      scene_plan: scenePlan,
    },
    canon_snapshot: {
      title: story.title,
      location: story.location,
      present_character: story.character,
      objective: story.objective,
      visible_state: story.state,
      preview_only: true,
    },
    relevant_memories: snapshot.history.slice(-6).map(turn => ({
      turn_id: turn.turnId,
      mode: turn.mode,
      outcome: turn.outcome,
      narrative_summary: turn.narrative.slice(0, 600),
    })),
    pack_rules: {
      story_pack_id: story.packId,
      story_pack_version: `${story.packId}@preview-0.1`,
      prompt_overlay_version: `${story.packId}-overlay@preview-0.1`,
      prompt_overlay: story.overlay,
      operation_catalog_version: 'preview-no-operations@0.1',
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
      reserved_ids: { events: [], facts: [], item_instances: [] },
      allowed_operation_types: [],
      allowed_field_catalog: {},
    },
    policy_hints: {
      media_may_be_suggested: false,
      safety_profile: 'preview-default',
    },
  }
}

function isScenePlan(value: unknown): value is Record<string, JsonValue> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return false
  const record = value as Record<string, unknown>
  const required = [
    'schema_version',
    'status',
    'scene_goal',
    'independent_npc_intentions',
    'world_pressure_if_player_waits',
    'plausible_developments',
    'relevant_refs',
    'callbacks_potentially_relevant',
    'continuity_checks',
    'dead_end_risks',
    'forbidden_shortcuts',
  ]
  return record.schema_version === 'scene-plan@1.0'
    && (record.status === 'ready' || record.status === 'invalid')
    && required.every(key => key in record)
    && Object.keys(record).every(key => required.includes(key))
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ContractError || error instanceof OpenRouterError)
    return error.code
  return 'UNKNOWN_MODEL_ERROR'
}

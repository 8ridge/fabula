import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { TurnCommand } from './contracts'
import { AiExecutionError } from './http'
import { OpenRouterError } from './openrouter'
import type { ChatJsonRequest, OpenRouterClient } from './openrouter'
import type { EngineSessionSnapshot } from '../game/session-repository'
import { TURN_MODEL_TIMEOUTS, TurnEngine } from './turn-engine'

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: '',
}

const command: TurnCommand = {
  schema_version: 'turn-command@1.0',
  session_id: 'session:telemetry',
  idempotency_key: 'turn:telemetry',
  expected_session_version: 0,
  mode: 'exploration',
  text: 'Я проверяю дверь.',
  selected_target_ids: [],
  selected_item_ids: [],
  selected_suggestion_id: null,
}

const snapshot: EngineSessionSnapshot = {
  sessionId: command.session_id,
  storyPackId: 'eighth-seal',
  storyPackVersion: '0.2',
  version: 0,
  persona: {
    name: 'Лея',
    role_id: 'eighth-seal:engineer',
    role_label: 'Инженерное мышление',
    competence: 'Разбирает задачу на этапы',
    limitation: 'Нужны материалы и время',
    motivation: 'Понять восьмой круг',
    embodiment_note: '',
    narration_density: 'balanced',
  },
  scene: {
    id: 'scene:eighth-seal:summoning-hall',
    title: 'Лишний круг',
    location_id: 'location:summoning-hall',
    location_name: 'Зал Призыва',
    story_time: 'Первый час',
    objective: 'Понять природу восьмого круга',
    present_character_ids: [],
  },
  inventory: [],
  characters: [],
  locations: [{
    id: 'location:summoning-hall',
    name: 'Зал Призыва',
    description: 'Зал восьми кругов.',
    status: 'Текущая локация',
  }],
  history: [],
  confirmedEvents: [],
  confirmedFacts: [],
  reservedIds: {
    events: ['event:reserved:0001'],
    facts: ['fact:reserved:0001'],
    itemInstances: [],
    scenes: ['scene:reserved:0001'],
  },
  allowedOperationTypes: ['event.create', 'fact.create'],
}

function successfulTurnOutput() {
  return {
    schema_version: 'turn-output@0.2',
    turn_id: command.idempotency_key,
    expected_session_version: command.expected_session_version,
    status: 'resolved',
    intent: {
      type: 'inspect_door',
      targets: [],
      referenced_entities: [],
      atomic_steps: [],
    },
    context_check: {
      actor_can_attempt: true,
      actor_conscious: true,
      target_reachable: true,
      target_perceivable: true,
      item_accessible: true,
      ownership_valid: true,
      knowledge_sources_valid: true,
      channel_valid: true,
      scope_valid: true,
      consent_valid: true,
      barriers_allow_attempt: true,
      time_sufficient: true,
      blocking_reasons: [],
    },
    difficulty: {
      base: 1,
      environment: 0,
      time_pressure: 0,
      injury: 0,
      opposition: 0,
      skill: 0,
      tools: 0,
      preparation: 0,
      help: 0,
      final_band: 1,
      uncertainty: 'low',
    },
    resolution: {
      summary: 'Дверь остается закрытой.',
      outcome: 'success',
      reason_codes: ['door_inspected'],
      costs_and_consequences: [],
    },
    operations: [],
    narrative_brief: {
      must_include: ['дверь'],
      must_not_invent: [],
      tone: 'tense',
      point_of_view: 'second_person',
      sensory_scope: ['visible'],
    },
    narrative_text: 'Ты внимательно осматриваешь закрытую дверь.',
    suggested_actions: [],
    media_candidate: null,
    safety_flags: [],
    audit: {
      canon_fact_ids_used: [],
      memory_event_ids_used: [],
      assumptions: [],
      unresolved_ambiguities: [],
      difficulty_regulation_note: null,
    },
  }
}

describe('turn engine model telemetry', () => {
  test('runs only the authoritative model on a normal turn with a bounded timeout', async () => {
    const calls: Array<Pick<ChatJsonRequest, 'model' | 'timeoutMs'>> = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push({ model: request.model, timeoutMs: request.timeoutMs })
        return {
          requestId: 'request:primary',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = new TurnEngine(config, client, async () => 'system prompt')

    const result = await engine.execute(command, snapshot)

    expect(calls).toEqual([{
      model: 'deepseek/deepseek-v4-flash',
      timeoutMs: TURN_MODEL_TIMEOUTS.primaryMs,
    }])
    expect(result.advisoryUsed).toBe(false)
    expect(result.fallbackUsed).toBe(false)
  })

  test('preserves usage and safe error codes for discarded paid attempts', async () => {
    const calls: Array<Pick<ChatJsonRequest, 'model' | 'timeoutMs'>> = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push({ model: request.model, timeoutMs: request.timeoutMs })
        return {
          requestId: `request:${request.model}`,
          model: request.model,
          output: { invalid: true },
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = new TurnEngine(config, client, async () => 'system prompt')

    let thrown: unknown
    try {
      await engine.execute(command, snapshot)
    }
    catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(AiExecutionError)
    expect((thrown as AiExecutionError).code).toBe('MODEL_FALLBACK_EXHAUSTED')
    expect((thrown as AiExecutionError).modelRuns).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'INVALID_FIELDS',
        usage: { total_tokens: 10, cost: 0.001 },
      },
      {
        role: 'fallback',
        status: 'discarded',
        error_code: 'INVALID_FIELDS',
        usage: { total_tokens: 10, cost: 0.001 },
      },
    ])
    expect(calls).toEqual([
      {
        model: 'deepseek/deepseek-v4-flash',
        timeoutMs: TURN_MODEL_TIMEOUTS.primaryMs,
      },
      {
        model: 'mistralai/mistral-small-2603',
        timeoutMs: TURN_MODEL_TIMEOUTS.fallbackMs,
      },
    ])
  })

  test('does not start fallback after the caller cancels the turn', async () => {
    let calls = 0
    const client = {
      chatJson: async ({ signal }: ChatJsonRequest) => {
        calls += 1
        await new Promise<never>((_resolve, reject) => {
          const rejectAborted = () => reject(new OpenRouterError('UPSTREAM_ABORTED', 'Запрос отменен.', 499, true))
          if (signal?.aborted)
            rejectAborted()
          else
            signal?.addEventListener('abort', rejectAborted, { once: true })
        })
      },
    } as unknown as OpenRouterClient
    const engine = new TurnEngine(config, client, async () => 'system prompt')
    const controller = new AbortController()
    const request = engine.execute(command, snapshot, controller.signal)
    while (calls === 0)
      await new Promise(resolve => setTimeout(resolve, 1))

    controller.abort()

    await expect(request).rejects.toMatchObject({ code: 'UPSTREAM_ABORTED' })
    expect(calls).toBe(1)
  })
})

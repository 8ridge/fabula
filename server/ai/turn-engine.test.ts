import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { TurnCommand, TurnOutput } from './contracts'
import { AiExecutionError, FabulaApiError } from './http'
import { OpenRouterError } from './openrouter'
import type { ChatJsonRequest, OpenRouterClient } from './openrouter'
import type { EngineSessionSnapshot } from '../game/session-repository'
import type { RuntimeStoryPackSource } from '../game/storypack-source'
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
  history: [{
    turnId: 'turn:scene-opened',
    sceneId: 'scene:eighth-seal:summoning-hall',
    mode: 'exploration',
    playerText: 'Я осматриваюсь.',
    outcome: 'success',
    narrative: 'Зал остается тихим.',
    costsAndConsequences: [],
    unresolvedAmbiguities: [],
  }],
  confirmedEvents: [],
  confirmedFacts: [],
  knowledge: [],
  reservedIds: {
    events: ['event:reserved:0001'],
    facts: ['fact:reserved:0001'],
    itemInstances: [],
    scenes: ['scene:reserved:0001'],
  },
  allowedOperationTypes: ['event.create', 'fact.create'],
}

const storyPackSource: RuntimeStoryPackSource = {
  storyPackId: snapshot.storyPackId,
  sourceFile: '04_storypack_eighth_seal.md',
  sourceHash: `sha256:${'a'.repeat(64)}`,
  technicalPackId: 'fantasy-eighth-seal@0.2',
  promptOverlayVersion: 'fantasy-eighth-seal@0.2#aaaaaaaaaaaa',
  promptOverlay: 'PACK_ID: fantasy-eighth-seal@0.2',
  hardCanon: ['Восьмой круг не дает игроку скрытой божественности.'],
  canonicalCore: '# StoryPack 04\n\n## Сюжет по восьми актам',
}

function createEngine(client: OpenRouterClient): TurnEngine {
  return new TurnEngine(
    config,
    client,
    async () => 'system prompt',
    async () => storyPackSource,
  )
}

function successfulTurnOutput(): TurnOutput {
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
  test('uses sanitized free Nemotron only at a scene boundary before the authoritative turn', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (request.model === 'nvidia/nemotron-3-ultra-550b-a55b:free') {
          return {
            requestId: 'request:advisory',
            model: request.model,
            output: {
              plan_version: 'scene-plan@0.2',
              scene_goal: 'Проверить границы восьмого круга',
              dramatic_question: 'Почему круг ответил игроку?',
              active_world_pressures: [],
              npc_intentions: [],
              unresolved_consequences: [],
              allowed_directions: [{
                direction: 'Осмотреть печать',
                type: 'safe',
                required_facts: [],
                pressure_advanced: [],
              }],
              avoid_repetition: [],
              forbidden_next_moves: ['Не объявлять игрока богом'],
              climax_conditions: [],
              potential_media_trigger: {
                event_ref: null,
                eligible_only_if: [],
                visual_uniqueness: 'none',
              },
              expires_after_turns: 4,
            },
            usage: { total_tokens: 20, cost: 0 },
          }
        }
        return {
          requestId: 'request:primary',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(command, {
      ...snapshot,
      history: [],
    })

    expect(requests.map(request => request.model)).toEqual([
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'deepseek/deepseek-v4-flash',
    ])
    expect(requests[0]).toMatchObject({
      sanitizedFreeEndpoint: true,
      jsonMode: 'prompt-only',
      timeoutMs: TURN_MODEL_TIMEOUTS.advisoryMs,
      payload: {
        story_pack_id: 'eighth-seal',
        scene_id: snapshot.scene.id,
        active_threads: ['current_scene_objective'],
        pack_constraints: ['no_new_canon', 'no_pii', 'advisory_only'],
      },
    })
    expect(JSON.stringify(requests[0]?.payload)).not.toContain(command.text)
    expect(requests[1]?.payload.scene).toMatchObject({
      scene_plan: {
        plan_version: 'scene-plan@0.2',
        expires_after_turns: 4,
      },
    })
    expect(result.advisoryUsed).toBe(true)
  })

  test('builds the model packet from the canonical StoryPack source', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:canonical-pack',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const contextualSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      history: [{
        turnId: 'turn:previous',
        sceneId: snapshot.scene.id,
        mode: 'exploration',
        playerText: 'Я проверил печать у восьмого круга.',
        outcome: 'partial_success',
        narrative: 'Печать ответила слабым свечением.',
        costsAndConsequences: ['След на ладони'],
        unresolvedAmbiguities: ['Кто нарушил клятву'],
      }],
      confirmedFacts: [{
        id: 'fact:previous',
        claim: 'Печать реагирует на игрока.',
        truthStatus: 'observed',
        sourceEventIds: ['event:previous'],
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      knowledge: [{
        characterId: 'character:maelis',
        factId: 'fact:previous',
        sourceEventId: 'event:previous',
        confidence: 0.8,
      }],
    }

    await createEngine(client).execute(command, contextualSnapshot)

    expect(requests[0]?.payload.pack_rules).toMatchObject({
      technical_pack_id: storyPackSource.technicalPackId,
      source_file: storyPackSource.sourceFile,
      source_hash: storyPackSource.sourceHash,
      prompt_overlay: storyPackSource.promptOverlay,
      canonical_core_markdown: storyPackSource.canonicalCore,
    })
    expect(requests[0]?.payload.canon_snapshot).toMatchObject({
      hard_canon: [{
        fact_id: 'canon:eighth-seal:1',
        claim: storyPackSource.hardCanon[0],
      }],
      per_character_knowledge: [{
        character_id: 'character:maelis',
        fact_id: 'fact:previous',
        claim: 'Печать реагирует на игрока.',
      }],
    })
    expect(requests[0]?.payload.relevant_memories).toEqual([{
      turn_id: 'turn:previous',
      mode: 'exploration',
      player_input: 'Я проверил печать у восьмого круга.',
      outcome: 'partial_success',
      narrative_summary: 'Печать ответила слабым свечением.',
      costs_and_consequences: ['След на ладони'],
      unresolved_ambiguities: ['Кто нарушил клятву'],
    }])
  })

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
    const engine = createEngine(client)

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
    const engine = createEngine(client)

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

  test('rejects invented entity ids before persistence and lets the registered fallback repair the turn', async () => {
    const calls: string[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push(request.model)
        const output = successfulTurnOutput()
        if (calls.length === 1)
          output.intent.targets = ['door:invented-by-model']
        return {
          requestId: `request:${calls.length}`,
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.execute(command, snapshot)

    expect(calls).toEqual([
      'deepseek/deepseek-v4-flash',
      'mistralai/mistral-small-2603',
    ])
    expect(result.fallbackUsed).toBe(true)
    expect(result.modelRuns).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'MODEL_AUTHORITY_ERROR',
        validation_errors: ['$.intent.targets:door:invented-by-model'],
      },
      {
        role: 'fallback',
        status: 'accepted',
        error_code: null,
      },
    ])
  })

  test('passes exact repository rejection paths to the fallback without accepting the invalid turn', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)
    let validations = 0

    const result = await engine.execute(command, snapshot, undefined, () => {
      validations += 1
      if (validations === 1) {
        throw new FabulaApiError(
          'MODEL_AUTHORITY_ERROR',
          'Знание назначено неизвестному персонажу.',
          502,
          false,
          ['$.operations[2].character_id'],
        )
      }
    })

    expect(result.fallbackUsed).toBe(true)
    expect(validations).toBe(2)
    expect(requests[1]?.payload.repair_feedback).toEqual({
      previous_role: 'primary',
      error_code: 'MODEL_AUTHORITY_ERROR',
      validation_errors: ['$.operations[2].character_id'],
    })
  })

  test('uses the server-owned turn envelope while preserving strict validation of model content', async () => {
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        const output = successfulTurnOutput()
        output.turn_id = 'turn:model-invented'
        output.expected_session_version = 999
        output.difficulty.final_band = 5
        output.operations = [{
          type: 'event.create',
          operation_index: 0,
          event_id: snapshot.reservedIds.events[0]!,
          event_kind: 'door_inspected',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [],
          location_id: 'location:summoning-hal',
          source_turn_id: 'turn:model-invented',
        }]
        return {
          requestId: 'request:wrong-envelope',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.execute(command, snapshot)

    expect(result.output.turn_id).toBe(command.idempotency_key)
    expect(result.output.expected_session_version).toBe(command.expected_session_version)
    expect(result.output.difficulty.final_band).toBe(1)
    expect(result.output.operations[0]).toMatchObject({
      type: 'event.create',
      source_turn_id: command.idempotency_key,
      location_id: snapshot.scene.location_id,
    })
  })

  test('gives Mistral one bounded semantic repair after repository authority rejection', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (requests.length === 1)
          throw new OpenRouterError('UPSTREAM_TIMEOUT', 'OpenRouter не ответил вовремя.', 504, true)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)
    let validations = 0

    const result = await engine.execute(command, snapshot, undefined, () => {
      validations += 1
      if (validations === 1) {
        throw new FabulaApiError(
          'MODEL_AUTHORITY_ERROR',
          'Знание назначено неизвестному персонажу.',
          502,
        )
      }
    })

    expect(result.fallbackUsed).toBe(true)
    expect(requests).toHaveLength(3)
    expect(requests[2]?.payload.repair_feedback).toEqual({
      previous_role: 'fallback',
      error_code: 'MODEL_AUTHORITY_ERROR',
      validation_errors: [
        'repository:MODEL_AUTHORITY_ERROR:Знание назначено неизвестному персонажу.',
      ],
    })
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
    const engine = createEngine(client)
    const controller = new AbortController()
    const request = engine.execute(command, snapshot, controller.signal)
    while (calls === 0)
      await new Promise(resolve => setTimeout(resolve, 1))

    controller.abort()

    await expect(request).rejects.toMatchObject({ code: 'UPSTREAM_ABORTED' })
    expect(calls).toBe(1)
  })
})

import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { ModuleRequest } from './contracts'
import { AiModuleService } from './module-service'
import type { OpenRouterClient } from './openrouter'

function validScenePlan() {
  return {
    plan_version: 'scene-plan@0.2',
    scene_goal: 'Сохранить причинность.',
    dramatic_question: 'Что изменится?',
    active_world_pressures: [],
    npc_intentions: [],
    unresolved_consequences: [],
    allowed_directions: [],
    avoid_repetition: [],
    forbidden_next_moves: [],
    climax_conditions: [],
    potential_media_trigger: {
      event_ref: null,
      eligible_only_if: [],
      visual_uniqueness: '',
    },
    expires_after_turns: 4,
  }
}

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: 'https://fabula.example',
}

const request: ModuleRequest = {
  schema_version: 'ai-module-request@1.0',
  request_id: 'request:12345678',
  payload: { mode: 'CANON_AUDIT', candidate_turn_id: 'turn:12345678' },
  template_variables: {},
}

describe('non-authoritative module service', () => {
  test('returns standalone model JSON only after strict contract validation', async () => {
    const client = {
      chatJson: async () => ({
        requestId: 'provider-request',
        model: 'mistralai/mistral-small-2603',
        output: {
          audit_version: 'canon-audit@0.2',
          pass: true,
          hard_errors: [],
          soft_warnings: [],
          missing_callbacks: [],
          unsupported_narrative_claims: [],
          recommended_prompt_correction: '',
        },
        usage: null,
      }),
    } as unknown as OpenRouterClient
    const service = new AiModuleService(config, client, async () => 'system prompt')
    const result = await service.invoke('turn-qa', request)

    expect(result).toMatchObject({
      contract: 'canon-audit@0.2',
      target_contract: 'canon-audit@0.2',
      validation: 'strict_server_contract',
      authority: 'non_authoritative',
      status: 'ready',
      fallback_used: false,
    })
  })

  test('rejects syntax-valid output that fails the standalone structure', async () => {
    const client = {
      chatJson: async ({ model }: { model: string }) => ({
        requestId: 'provider-request',
        model,
        output: { audit_version: 'canon-audit@0.2', pass: true },
        usage: { total_tokens: 12, cost: 0.001 },
      }),
    } as unknown as OpenRouterClient
    const service = new AiModuleService(config, client, async () => 'system prompt')
    await expect(service.invoke('turn-qa', request)).rejects.toMatchObject({
      code: 'MODEL_FALLBACK_EXHAUSTED',
      modelRuns: [
        {
          model: 'mistralai/mistral-small-2603',
          status: 'discarded',
          error_code: 'MODEL_CONTRACT_ERROR',
          usage: { total_tokens: 12, cost: 0.001 },
        },
        {
          model: 'deepseek/deepseek-v4-flash-0731',
          status: 'discarded',
          error_code: 'MODEL_CONTRACT_ERROR',
          usage: { total_tokens: 12, cost: 0.001 },
        },
      ],
    })
  })

  test('uses the paid Nemotron route as a real fallback without a feature flag', async () => {
    const models: string[] = []
    const client = {
      chatJson: async ({ model }: { model: string }) => {
        models.push(model)
        return {
          requestId: 'provider-request',
          model,
          output: models.length === 1 ? { invalid: true } : validScenePlan(),
          usage: null,
        }
      },
    } as unknown as OpenRouterClient
    const service = new AiModuleService(config, client, async () => 'system prompt')
    const result = await service.invoke('scene-plan', {
      ...request,
      payload: {
        story_pack_id: 'synthetic-pack',
        scene_id: 'scene:synthetic-0001',
      },
    })
    expect(models).toEqual([
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'nvidia/nemotron-3-ultra-550b-a55b',
    ])
    expect(result).toMatchObject({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      fallback_used: true,
      model_runs: [
        {
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          status: 'discarded',
          error_code: 'MODEL_CONTRACT_ERROR',
        },
        {
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
          status: 'accepted',
          error_code: null,
        },
      ],
    })
  })

  test('does not expose authoritative prompt fragments as standalone modules', async () => {
    const service = new AiModuleService(config)
    await expect(service.invoke('inventory', request)).rejects.toMatchObject({
      code: 'TURN_FRAGMENT_ONLY',
    })
  })

  test('keeps video disabled until durable idempotency is available', async () => {
    const service = new AiModuleService(config)
    await expect(service.invoke('exclusive-video', request)).rejects.toMatchObject({
      code: 'MODULE_RUNTIME_BLOCKED',
    })
  })
})

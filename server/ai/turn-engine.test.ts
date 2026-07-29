import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { TurnCommand } from './contracts'
import { AiExecutionError } from './http'
import type { OpenRouterClient } from './openrouter'
import type { EngineSessionSnapshot } from '../game/session-repository'
import { TurnEngine } from './turn-engine'

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

describe('turn engine model telemetry', () => {
  test('preserves usage and safe error codes for discarded paid attempts', async () => {
    const client = {
      chatJson: async ({ model }: { model: string }) => ({
        requestId: `request:${model}`,
        model,
        output: { invalid: true },
        usage: { total_tokens: 10, cost: 0.001 },
      }),
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
          role: 'advisory',
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          status: 'discarded',
          error_code: 'MODEL_CONTRACT_ERROR',
          usage: { total_tokens: 10, cost: 0.001 },
        },
        {
          role: 'advisory',
          model: 'nvidia/nemotron-3-ultra-550b-a55b',
          status: 'discarded',
          error_code: 'MODEL_CONTRACT_ERROR',
          usage: { total_tokens: 10, cost: 0.001 },
        },
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
  })
})

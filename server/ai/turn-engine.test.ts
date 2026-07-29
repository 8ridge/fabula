import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { TurnCommand } from './contracts'
import { AiExecutionError } from './http'
import type { OpenRouterClient } from './openrouter'
import type { SessionSnapshot } from './session-store'
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
  story_id: 'fant',
  selected_target_ids: [],
  selected_item_ids: [],
  selected_suggestion_id: null,
}

const snapshot: SessionSnapshot = {
  sessionId: command.session_id,
  storyId: command.story_id,
  version: 0,
  history: [],
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

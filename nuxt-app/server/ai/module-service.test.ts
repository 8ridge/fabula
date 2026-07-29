import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { ModuleRequest } from './contracts'
import { AiModuleService } from './module-service'
import type { OpenRouterClient } from './openrouter'

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: 'https://fabula.example',
  appName: 'Fabula',
  enabled: true,
  allowUnauthenticated: true,
  nemotronEnabled: true,
  aionEnabled: true,
  mediaEnabled: false,
  premiumMediaEnabled: false,
  requestsPerMinute: 8,
}

const request: ModuleRequest = {
  schema_version: 'ai-module-request@1.0',
  request_id: 'request:12345678',
  payload: { candidate_turn_id: 'turn:12345678' },
  template_variables: {},
}

describe('non-authoritative module service', () => {
  test('labels generic model JSON honestly as syntax-only preview output', async () => {
    const client = {
      chatJson: async () => ({
        requestId: 'provider-request',
        model: 'mistralai/mistral-small-2603',
        output: { schema_version: 'turn-qa@1.0', verdict: 'PASS' },
        usage: null,
      }),
    } as unknown as OpenRouterClient
    const service = new AiModuleService(config, client, async () => 'system prompt')
    const result = await service.invoke('turn-qa', request)

    expect(result).toMatchObject({
      contract: 'unvalidated-model-json@1.0',
      target_contract: 'turn-qa@1.0',
      validation: 'json_syntax_only',
      authority: 'non_authoritative',
      status: 'preview_raw',
    })
  })

  test('does not expose authoritative prompt fragments as standalone modules', async () => {
    const service = new AiModuleService(config)
    await expect(service.invoke('inventory', request)).rejects.toMatchObject({
      code: 'TURN_FRAGMENT_ONLY',
    })
  })
})

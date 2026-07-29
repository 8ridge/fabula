import { describe, expect, test } from 'bun:test'
import { resolveAiConfig } from './config'

describe('AI runtime configuration', () => {
  test('uses only OpenRouter connection settings and ignores old feature flags', () => {
    const config = resolveAiConfig({
      openrouterApiKey: 'test-key-never-log',
      fabulaAiEnabled: false,
      fabulaAiNemotronEnabled: false,
      fabulaAiMediaEnabled: false,
    })
    expect(config).toEqual({
      apiKey: 'test-key-never-log',
      baseUrl: 'https://openrouter.ai/api/v1',
      siteUrl: '',
    })
    expect('enabled' in config).toBe(false)
  })

  test('rejects an alternate OpenRouter base URL', () => {
    expect(() => resolveAiConfig({
      openrouterBaseUrl: 'https://attacker.example/api/v1',
    })).toThrow('OPENROUTER_BASE_URL_REJECTED')
  })
})

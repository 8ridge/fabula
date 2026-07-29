import { describe, expect, test } from 'bun:test'
import { resolveAiConfig } from './config'

describe('AI runtime configuration', () => {
  test('clamps cost limits and timeouts to fail-safe bounds', () => {
    const config = resolveAiConfig({
      fabulaAiImageMaxCostUsd: 99,
      fabulaAiVideoMaxCostUsd: -1,
      fabulaAiTextTimeoutMs: 1,
      fabulaAiImageTimeoutMs: 999_999,
    })
    expect(config.imageMaxCostUsd).toBe(1)
    expect(config.videoMaxCostUsd).toBe(0)
    expect(config.textTimeoutMs).toBe(5_000)
    expect(config.imageTimeoutMs).toBe(300_000)
  })

  test('rejects an alternate OpenRouter base URL', () => {
    expect(() => resolveAiConfig({
      openrouterBaseUrl: 'https://attacker.example/api/v1',
    })).toThrow('OPENROUTER_BASE_URL_REJECTED')
  })
})

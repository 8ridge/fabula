import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import { OpenRouterClient, OpenRouterError } from './openrouter'

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: 'https://fabula.example',
  appName: 'Fabula',
  enabled: true,
  allowUnauthenticated: true,
  nemotronEnabled: false,
  aionEnabled: false,
  mediaEnabled: false,
  premiumMediaEnabled: false,
  requestsPerMinute: 8,
}

describe('OpenRouter transport', () => {
  test('keeps model, privacy and price policy server-owned', async () => {
    let capturedUrl = ''
    let capturedInit: RequestInit | undefined
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url)
      capturedInit = init
      return new Response(JSON.stringify({
        model: 'deepseek/deepseek-v4-flash',
        choices: [{ message: { content: '{"ok":true}' } }],
        usage: { prompt_tokens: 10, completion_tokens: 2, cost: 0.001 },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-test' },
      })
    }
    const result = await new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: { player_input: 'data' },
      maxOutputTokens: 100,
      maxPrice: { prompt: 0.15, completion: 0.3 },
    })

    expect(capturedUrl).toBe('https://openrouter.ai/api/v1/chat/completions')
    const headers = capturedInit?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer test-key-never-log')
    const body = JSON.parse(String(capturedInit?.body))
    expect(body.model).toBe('deepseek/deepseek-v4-flash')
    expect(body.provider).toMatchObject({
      require_parameters: true,
      data_collection: 'deny',
      zdr: true,
      max_price: { prompt: 0.15, completion: 0.3 },
    })
    expect(result.output).toEqual({ ok: true })
    expect(JSON.stringify(result)).not.toContain('test-key-never-log')
  })

  test('does not expose an upstream error body', async () => {
    const fakeFetch = async () => new Response(JSON.stringify({
      error: { message: 'provider echoed secret prompt' },
    }), { status: 400, headers: { 'content-type': 'application/json' } })
    const promise = new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
    })
    await expect(promise).rejects.toBeInstanceOf(OpenRouterError)
    await expect(promise).rejects.not.toThrow(/secret prompt/)
  })
})

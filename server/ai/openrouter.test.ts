import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import { OPENROUTER_TIMEOUTS, OpenRouterClient, OpenRouterError } from './openrouter'

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: 'https://fabula.example',
}

describe('OpenRouter transport', () => {
  test('keeps fixed server-side timeouts outside environment configuration', () => {
    expect(OPENROUTER_TIMEOUTS).toEqual({
      chatMs: 180_000,
      imageMs: 120_000,
      videoSubmitMs: 30_000,
      videoPollMs: 20_000,
    })
  })

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
      sort: 'throughput',
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

  test('preserves billed usage when model JSON is invalid', async () => {
    const fakeFetch = async () => new Response(JSON.stringify({
      model: 'deepseek/deepseek-v4-flash',
      choices: [{ message: { content: 'not-json' } }],
      usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12, cost: 0.001 },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-invalid-json' },
    })
    const promise = new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
    })
    await expect(promise).rejects.toMatchObject({
      code: 'MODEL_JSON_INVALID',
      upstreamRequestId: 'req-invalid-json',
      upstreamModel: 'deepseek/deepseek-v4-flash',
      upstreamUsage: { total_tokens: 12, cost: 0.001 },
    })
  })

  test('does not send unsupported JSON mode to the free Nemotron endpoint', async () => {
    let capturedBody: Record<string, unknown> = {}
    const fakeFetch = async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body))
      return new Response(JSON.stringify({
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
        choices: [{ message: { content: '{"ok":true}' } }],
      }), { status: 200 })
    }
    await new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
      maxPrice: { prompt: 0, completion: 0 },
      sanitizedFreeEndpoint: true,
      jsonMode: 'prompt-only',
    })
    expect(capturedBody.response_format).toBeUndefined()
  })

  test('keeps the timeout active while reading the response body', async () => {
    const fakeFetch = async () => new Response(new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode('{"choices":[]}'))
          controller.close()
        }, 30)
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
    const client = new OpenRouterClient(config, fakeFetch as typeof fetch, {
      chatMs: 5,
      imageMs: 5,
      videoSubmitMs: 5,
      videoPollMs: 5,
    })

    await expect(client.chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
    })).rejects.toMatchObject({ code: 'UPSTREAM_TIMEOUT' })
  })

  test('allows the turn orchestrator to impose a shorter per-call timeout', async () => {
    const fakeFetch = async () => new Response(new ReadableStream({
      start(controller) {
        setTimeout(() => {
          controller.enqueue(new TextEncoder().encode('{"choices":[]}'))
          controller.close()
        }, 30)
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })

    await expect(new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
      timeoutMs: 5,
    })).rejects.toMatchObject({ code: 'UPSTREAM_TIMEOUT' })
  })

  test('distinguishes caller cancellation from an upstream timeout', async () => {
    const fakeFetch = async (_url: string | URL | Request, init?: RequestInit) =>
      await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
      })
    const controller = new AbortController()
    const request = new OpenRouterClient(config, fakeFetch as typeof fetch).chatJson({
      model: 'deepseek/deepseek-v4-flash',
      system: 'system',
      payload: {},
      maxOutputTokens: 100,
      signal: controller.signal,
    })

    controller.abort()

    await expect(request).rejects.toMatchObject({ code: 'UPSTREAM_ABORTED' })
  })

  test('preflights image pricing and pins the provider before a paid request', async () => {
    const calls: Array<{ url: string, body: Record<string, unknown> | null }> = []
    const fakeFetch = async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(url),
        body: init?.body ? JSON.parse(String(init.body)) : null,
      })
      if (String(url).endsWith('/endpoints')) {
        return new Response(JSON.stringify({
          id: 'recraft/recraft-v4.1-utility',
          endpoints: [{
            provider_slug: 'recraft',
            pricing: [{ billable: 'output_image', unit: 'image', cost_usd: 0.035 }],
          }],
        }), { status: 200 })
      }
      return new Response(JSON.stringify({
        data: [{ b64_json: 'aGVsbG8=', media_type: 'image/png' }],
        usage: { cost: 0.035 },
      }), { status: 200 })
    }
    const result = await new OpenRouterClient(config, fakeFetch as typeof fetch).generateImage({
      model: 'recraft/recraft-v4.1-utility',
      prompt: 'synthetic item',
      aspectRatio: '1:1',
      providerSlug: 'recraft',
      maxCostUsd: 0.04,
    })
    expect(calls).toHaveLength(2)
    expect(calls[1]?.body?.provider).toEqual({
      only: ['recraft'],
      allow_fallbacks: false,
    })
    expect(result.estimatedCostUsd).toBe(0.035)
  })

  test('does not submit an image when OpenRouter omits a verifiable price', async () => {
    let calls = 0
    const fakeFetch = async () => {
      calls += 1
      return new Response(JSON.stringify({
        id: 'krea/krea-2-medium',
        endpoints: [{ provider_slug: 'krea', pricing: [] }],
      }), { status: 200 })
    }
    await expect(new OpenRouterClient(config, fakeFetch as typeof fetch).generateImage({
      model: 'krea/krea-2-medium',
      prompt: 'synthetic pack art',
      aspectRatio: '16:9',
      resolution: '1K',
      providerSlug: 'krea',
      maxCostUsd: 0.05,
    })).rejects.toMatchObject({ code: 'IMAGE_PRICE_UNAVAILABLE' })
    expect(calls).toBe(1)
  })

  test('preflights current video SKU pricing before submitting a job', async () => {
    const fakeFetch = async (url: string | URL | Request) => {
      if (String(url).endsWith('/videos/models')) {
        return new Response(JSON.stringify({
          data: [{
            id: 'x-ai/grok-imagine-video',
            supported_durations: [3],
            supported_resolutions: ['480p'],
            supported_aspect_ratios: ['16:9'],
            supported_frame_images: ['first_frame'],
            pricing_skus: {
              cents_per_image_input: '0.2',
              cents_per_video_output_second_480p: '5',
            },
          }],
        }), { status: 200 })
      }
      return new Response(JSON.stringify({
        id: 'video-job-123',
        status: 'pending',
        polling_url: '/api/v1/videos/video-job-123',
      }), { status: 202 })
    }
    const result = await new OpenRouterClient(config, fakeFetch as typeof fetch).submitVideo({
      model: 'x-ai/grok-imagine-video',
      prompt: 'synthetic motion',
      duration: 3,
      aspectRatio: '16:9',
      resolution: '480p',
      approvedStillUrl: 'https://fabula.example/frame.jpg',
      maxCostUsd: 0.16,
    })
    expect(result.estimatedCostUsd).toBe(0.152)
  })
})

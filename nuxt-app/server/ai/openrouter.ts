import type { FabulaAiConfig } from './config'
import type { JsonValue } from './contracts'

export interface OpenRouterUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  cost?: number
}

export interface ChatJsonRequest {
  model: string
  system: string
  payload: Record<string, JsonValue>
  maxOutputTokens: number
  maxPrice?: {
    prompt?: number
    completion?: number
  }
  schema?: {
    name: string
    schema: Record<string, unknown>
  }
  sanitizedFreeEndpoint?: boolean
}

export interface ChatJsonResult {
  requestId: string | null
  model: string
  output: unknown
  usage: OpenRouterUsage | null
}

export interface ImageRequest {
  model: string
  prompt: string
  aspectRatio: string
  resolution: string
  maxPrice?: number
}

export interface ImageResult {
  requestId: string | null
  model: string
  images: Array<{ b64Json: string, mediaType: string | null }>
  usage: OpenRouterUsage | null
}

export interface VideoRequest {
  model: string
  prompt: string
  duration: number
  aspectRatio: string
  resolution: string
  approvedStillUrl: string
}

export interface VideoJobResult {
  id: string
  pollingUrl: string
  status: string
  generationId: string | null
  unsignedUrls: string[]
  usage: OpenRouterUsage | null
}

export class OpenRouterError extends Error {
  readonly code: string
  readonly status: number
  readonly retryable: boolean
  readonly retryAfter: string | null

  constructor(code: string, message: string, status = 502, retryable = false, retryAfter: string | null = null) {
    super(message)
    this.name = 'OpenRouterError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.retryAfter = retryAfter
  }
}

type FetchLike = typeof globalThis.fetch

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asUsage(value: unknown): OpenRouterUsage | null {
  if (!isRecord(value))
    return null
  const usage: OpenRouterUsage = {}
  for (const key of ['prompt_tokens', 'completion_tokens', 'total_tokens', 'cost'] as const) {
    if (typeof value[key] === 'number')
      usage[key] = value[key]
  }
  return usage
}

function parseStrictJson(content: unknown): unknown {
  if (typeof content !== 'string' || !content.trim())
    throw new OpenRouterError('EMPTY_MODEL_RESPONSE', 'Модель вернула пустой ответ.')
  const trimmed = content.trim()
  if (trimmed.startsWith('```'))
    throw new OpenRouterError('MODEL_JSON_INVALID', 'Модель вернула Markdown вместо JSON.')
  try {
    return JSON.parse(trimmed)
  }
  catch {
    throw new OpenRouterError('MODEL_JSON_INVALID', 'Модель вернула поврежденный JSON.')
  }
}

export class OpenRouterClient {
  private readonly config: FabulaAiConfig
  private readonly fetchImpl: FetchLike

  constructor(config: FabulaAiConfig, fetchImpl: FetchLike = globalThis.fetch) {
    this.config = config
    this.fetchImpl = fetchImpl
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-OpenRouter-Title': this.config.appName,
    }
    if (this.config.siteUrl)
      headers['HTTP-Referer'] = this.config.siteUrl
    return headers
  }

  private async request(path: string, init: RequestInit, timeoutMs: number): Promise<{ body: unknown, requestId: string | null }> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let response: Response
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...(init.headers || {}) },
        signal: controller.signal,
      })
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError')
        throw new OpenRouterError('UPSTREAM_TIMEOUT', 'OpenRouter не ответил вовремя.', 504, true)
      throw new OpenRouterError('UPSTREAM_UNAVAILABLE', 'Не удалось связаться с OpenRouter.', 502, true)
    }
    finally {
      clearTimeout(timer)
    }

    const requestId = response.headers.get('x-request-id')
    let body: unknown = null
    try {
      body = await response.json()
    }
    catch {
      if (response.ok)
        throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул некорректный ответ.')
    }
    if (!response.ok) {
      const retryable = response.status === 408 || response.status === 429 || response.status >= 500
      const status = response.status === 401 || response.status === 403 ? 503 : response.status
      throw new OpenRouterError(
        response.status === 429 ? 'UPSTREAM_RATE_LIMITED' : 'UPSTREAM_REJECTED',
        response.status === 429 ? 'OpenRouter временно ограничил частоту запросов.' : 'OpenRouter отклонил запрос.',
        status,
        retryable,
        response.headers.get('retry-after'),
      )
    }
    return { body, requestId }
  }

  async chatJson(request: ChatJsonRequest): Promise<ChatJsonResult> {
    const provider: Record<string, unknown> = {
      require_parameters: true,
      allow_fallbacks: true,
      sort: 'price',
      data_collection: request.sanitizedFreeEndpoint ? 'allow' : 'deny',
      max_price: request.maxPrice,
    }
    if (!request.sanitizedFreeEndpoint)
      provider.zdr = true

    const body: Record<string, unknown> = {
      model: request.model,
      messages: [
        { role: 'system', content: request.system },
        { role: 'user', content: JSON.stringify(request.payload) },
      ],
      temperature: 0.2,
      max_tokens: request.maxOutputTokens,
      provider,
    }
    if (request.schema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: request.schema.name,
          strict: true,
          schema: request.schema.schema,
        },
      }
    }
    else {
      body.response_format = { type: 'json_object' }
    }

    const { body: responseBody, requestId } = await this.request(
      '/chat/completions',
      { method: 'POST', body: JSON.stringify(body) },
      45_000,
    )
    if (!isRecord(responseBody) || !Array.isArray(responseBody.choices) || !isRecord(responseBody.choices[0])) {
      throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул неожиданный формат ответа.')
    }
    const message = responseBody.choices[0].message
    if (!isRecord(message))
      throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter не вернул сообщение модели.')
    return {
      requestId,
      model: typeof responseBody.model === 'string' ? responseBody.model : request.model,
      output: parseStrictJson(message.content),
      usage: asUsage(responseBody.usage),
    }
  }

  async generateImage(request: ImageRequest): Promise<ImageResult> {
    const { body, requestId } = await this.request(
      '/images',
      {
        method: 'POST',
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          aspect_ratio: request.aspectRatio,
          resolution: request.resolution,
          provider: {
            sort: 'price',
            data_collection: 'deny',
            max_price: request.maxPrice ? { image: request.maxPrice } : undefined,
          },
        }),
      },
      90_000,
    )
    if (!isRecord(body) || !Array.isArray(body.data))
      throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter не вернул изображения.')
    const images = body.data.map((item) => {
      if (!isRecord(item) || typeof item.b64_json !== 'string' || item.b64_json.length === 0)
        throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул поврежденное изображение.')
      return {
        b64Json: item.b64_json,
        mediaType: typeof item.media_type === 'string' ? item.media_type : null,
      }
    })
    return {
      requestId,
      model: request.model,
      images,
      usage: asUsage(body.usage),
    }
  }

  async submitVideo(request: VideoRequest): Promise<VideoJobResult> {
    const { body } = await this.request(
      '/videos',
      {
        method: 'POST',
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          duration: request.duration,
          aspect_ratio: request.aspectRatio,
          resolution: request.resolution,
          frame_images: [{
            type: 'image_url',
            image_url: { url: request.approvedStillUrl },
            frame_type: 'first_frame',
          }],
        }),
      },
      30_000,
    )
    return parseVideoJob(body)
  }

  async pollVideo(jobId: string): Promise<VideoJobResult> {
    const { body } = await this.request(`/videos/${encodeURIComponent(jobId)}`, { method: 'GET' }, 20_000)
    return parseVideoJob(body)
  }
}

function parseVideoJob(value: unknown): VideoJobResult {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.status !== 'string')
    throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул поврежденный video job.')
  return {
    id: value.id,
    pollingUrl: typeof value.polling_url === 'string' ? value.polling_url : '',
    status: value.status,
    generationId: typeof value.generation_id === 'string' ? value.generation_id : null,
    unsignedUrls: Array.isArray(value.unsigned_urls)
      ? value.unsigned_urls.filter((url): url is string => typeof url === 'string')
      : [],
    usage: asUsage(value.usage),
  }
}

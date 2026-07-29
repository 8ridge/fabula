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
  timeoutMs?: number
  signal?: AbortSignal
  maxPrice?: {
    prompt?: number
    completion?: number
  }
  schema?: {
    name: string
    schema: Record<string, unknown>
  }
  sanitizedFreeEndpoint?: boolean
  jsonMode?: 'json-schema' | 'json-object' | 'prompt-only'
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
  resolution?: string
  inputReferences?: string[]
  outputFormat?: 'png' | 'jpeg' | 'webp'
  background?: 'auto' | 'transparent' | 'opaque'
  providerSlug: string
  maxCostUsd: number
}

export interface ImageResult {
  requestId: string | null
  model: string
  images: Array<{ b64Json: string, mediaType: string | null }>
  usage: OpenRouterUsage | null
  estimatedCostUsd: number
}

export interface VideoRequest {
  model: string
  prompt: string
  duration: number
  aspectRatio?: string
  resolution: string
  approvedStillUrl: string
  maxCostUsd: number
}

export interface VideoJobResult {
  id: string
  pollingUrl: string
  status: string
  generationId: string | null
  unsignedUrls: string[]
  usage: OpenRouterUsage | null
  estimatedCostUsd: number
}

export class OpenRouterError extends Error {
  readonly code: string
  readonly status: number
  readonly retryable: boolean
  readonly retryAfter: string | null
  upstreamRequestId: string | null = null
  upstreamModel: string | null = null
  upstreamUsage: OpenRouterUsage | null = null

  constructor(code: string, message: string, status = 502, retryable = false, retryAfter: string | null = null) {
    super(message)
    this.name = 'OpenRouterError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.retryAfter = retryAfter
  }

  withModelRun(requestId: string | null, model: string, usage: OpenRouterUsage | null): this {
    this.upstreamRequestId = requestId
    this.upstreamModel = model
    this.upstreamUsage = usage
    return this
  }
}

type FetchLike = typeof globalThis.fetch

export interface OpenRouterTimeouts {
  chatMs: number
  imageMs: number
  videoSubmitMs: number
  videoPollMs: number
}

export const OPENROUTER_TIMEOUTS: OpenRouterTimeouts = {
  chatMs: 180_000,
  imageMs: 120_000,
  videoSubmitMs: 30_000,
  videoPollMs: 20_000,
}

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
  private readonly timeouts: OpenRouterTimeouts

  constructor(
    config: FabulaAiConfig,
    fetchImpl: FetchLike = globalThis.fetch,
    timeouts?: OpenRouterTimeouts,
  ) {
    this.config = config
    this.fetchImpl = fetchImpl
    this.timeouts = timeouts || OPENROUTER_TIMEOUTS
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'X-OpenRouter-Title': 'Fabula',
    }
    if (this.config.siteUrl)
      headers['HTTP-Referer'] = this.config.siteUrl
    return headers
  }

  private async request(
    path: string,
    init: RequestInit,
    timeoutMs: number,
    externalSignal?: AbortSignal,
  ): Promise<{ body: unknown, requestId: string | null }> {
    const controller = new AbortController()
    let timedOut = false
    const abortFromExternal = () => controller.abort()
    if (externalSignal?.aborted)
      abortFromExternal()
    else
      externalSignal?.addEventListener('abort', abortFromExternal, { once: true })
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, timeoutMs)
    const abortedError = () => externalSignal?.aborted && !timedOut
      ? new OpenRouterError('UPSTREAM_ABORTED', 'Запрос к OpenRouter отменен.', 499, true)
      : new OpenRouterError('UPSTREAM_TIMEOUT', 'OpenRouter не ответил вовремя.', 504, true)
    let response: Response | undefined
    let body: unknown = null
    try {
      response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        ...init,
        headers: { ...this.headers(), ...(init.headers || {}) },
        signal: controller.signal,
      })
      try {
        body = await response.json()
        if (controller.signal.aborted)
          throw abortedError()
      }
      catch (error) {
        if (controller.signal.aborted || (error instanceof Error && error.name === 'AbortError'))
          throw abortedError()
        if (response.ok)
          throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул некорректный ответ.')
      }
    }
    catch (error) {
      if (error instanceof OpenRouterError)
        throw error
      if (error instanceof Error && error.name === 'AbortError')
        throw abortedError()
      throw new OpenRouterError('UPSTREAM_UNAVAILABLE', 'Не удалось связаться с OpenRouter.', 502, true)
    }
    finally {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', abortFromExternal)
    }

    if (!response)
      throw new OpenRouterError('UPSTREAM_UNAVAILABLE', 'Не удалось связаться с OpenRouter.', 502, true)
    const requestId = response.headers.get('x-request-id')
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
    const jsonMode = request.jsonMode || (request.schema ? 'json-schema' : 'json-object')
    if (request.schema && jsonMode === 'json-schema') {
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: request.schema.name,
          strict: true,
          schema: request.schema.schema,
        },
      }
    }
    else if (jsonMode === 'json-object') {
      body.response_format = { type: 'json_object' }
    }

    const { body: responseBody, requestId } = await this.request(
      '/chat/completions',
      { method: 'POST', body: JSON.stringify(body) },
      request.timeoutMs ?? this.timeouts.chatMs,
      request.signal,
    )
    if (!isRecord(responseBody) || !Array.isArray(responseBody.choices) || !isRecord(responseBody.choices[0])) {
      throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул неожиданный формат ответа.')
    }
    const message = responseBody.choices[0].message
    if (!isRecord(message))
      throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter не вернул сообщение модели.')
    const resolvedModel = typeof responseBody.model === 'string' ? responseBody.model : request.model
    const usage = asUsage(responseBody.usage)
    let output: unknown
    try {
      output = parseStrictJson(message.content)
    }
    catch (error) {
      if (error instanceof OpenRouterError)
        throw error.withModelRun(requestId, resolvedModel, usage)
      throw error
    }
    return {
      requestId,
      model: resolvedModel,
      output,
      usage,
    }
  }

  async generateImage(request: ImageRequest): Promise<ImageResult> {
    const estimatedCostUsd = await this.quoteImageCost(request)
    const { body, requestId } = await this.request(
      '/images',
      {
        method: 'POST',
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          aspect_ratio: request.aspectRatio,
          resolution: request.resolution,
          input_references: request.inputReferences?.map(url => ({
            type: 'image_url',
            image_url: { url },
          })),
          output_format: request.outputFormat,
          background: request.background,
          provider: {
            only: [request.providerSlug],
            allow_fallbacks: false,
          },
        }),
      },
      this.timeouts.imageMs,
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
    const usage = asUsage(body.usage)
    if (typeof usage?.cost === 'number' && usage.cost > request.maxCostUsd) {
      throw new OpenRouterError(
        'IMAGE_BUDGET_VIOLATED',
        'OpenRouter сообщил стоимость выше серверного лимита задачи.',
        502,
      )
    }
    return {
      requestId,
      model: request.model,
      images,
      usage,
      estimatedCostUsd,
    }
  }

  async submitVideo(request: VideoRequest): Promise<VideoJobResult> {
    const estimatedCostUsd = await this.quoteVideoCost(request)
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
      this.timeouts.videoSubmitMs,
    )
    return parseVideoJob(body, estimatedCostUsd)
  }

  async pollVideo(jobId: string): Promise<VideoJobResult> {
    const { body } = await this.request(`/videos/${encodeURIComponent(jobId)}`, { method: 'GET' }, this.timeouts.videoPollMs)
    return parseVideoJob(body, 0)
  }

  private async quoteImageCost(request: ImageRequest): Promise<number> {
    const modelPath = request.model.split('/').map(part => encodeURIComponent(part)).join('/')
    const { body } = await this.request(
      `/images/models/${modelPath}/endpoints`,
      { method: 'GET' },
      this.timeouts.imageMs,
    )
    if (!isRecord(body) || !Array.isArray(body.endpoints))
      throw new OpenRouterError('IMAGE_PRICE_UNAVAILABLE', 'OpenRouter не вернул проверяемую цену изображения.', 503)
    const costs = body.endpoints
      .filter(endpoint => isRecord(endpoint) && endpoint.provider_slug === request.providerSlug)
      .map(endpoint => imageEndpointCost(endpoint as Record<string, unknown>, request))
    if (costs.length === 0 || costs.some(cost => cost === null))
      throw new OpenRouterError('IMAGE_PRICE_UNAVAILABLE', 'OpenRouter не вернул проверяемую цену изображения.', 503)
    const estimatedCostUsd = Math.max(...costs as number[])
    assertQuotedCost(estimatedCostUsd, request.maxCostUsd, 'IMAGE')
    return estimatedCostUsd
  }

  private async quoteVideoCost(request: VideoRequest): Promise<number> {
    const { body } = await this.request('/videos/models', { method: 'GET' }, this.timeouts.videoSubmitMs)
    if (!isRecord(body) || !Array.isArray(body.data))
      throw new OpenRouterError('VIDEO_PRICE_UNAVAILABLE', 'OpenRouter не вернул проверяемую цену видео.', 503)
    const model = body.data.find(candidate => isRecord(candidate) && candidate.id === request.model)
    if (!isRecord(model)
      || !Array.isArray(model.supported_durations)
      || !model.supported_durations.includes(request.duration)
      || !Array.isArray(model.supported_resolutions)
      || !model.supported_resolutions.includes(request.resolution)
      || !Array.isArray(model.supported_frame_images)
      || !model.supported_frame_images.includes('first_frame')
      || !isRecord(model.pricing_skus)) {
      throw new OpenRouterError('VIDEO_PRICE_UNAVAILABLE', 'Параметры и цена video route не подтверждены OpenRouter.', 503)
    }
    if (request.aspectRatio && Array.isArray(model.supported_aspect_ratios) && !model.supported_aspect_ratios.includes(request.aspectRatio))
      throw new OpenRouterError('VIDEO_OPTION_UNSUPPORTED', 'OpenRouter не подтвердил выбранное соотношение сторон.', 422)
    const rate = cents(model.pricing_skus[`cents_per_video_output_second_${request.resolution}`])
    const imageInput = cents(model.pricing_skus.cents_per_image_input)
    if (rate === null || imageInput === null)
      throw new OpenRouterError('VIDEO_PRICE_UNAVAILABLE', 'OpenRouter не вернул проверяемую цену video route.', 503)
    const estimatedCostUsd = Number((rate * request.duration + imageInput).toFixed(6))
    assertQuotedCost(estimatedCostUsd, request.maxCostUsd, 'VIDEO')
    return estimatedCostUsd
  }
}

function parseVideoJob(value: unknown, estimatedCostUsd: number): VideoJobResult {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.status !== 'string')
    throw new OpenRouterError('UPSTREAM_INVALID_RESPONSE', 'OpenRouter вернул поврежденный video job.')
  const usage = asUsage(value.usage)
  return {
    id: value.id,
    pollingUrl: typeof value.polling_url === 'string' ? value.polling_url : '',
    status: value.status,
    generationId: typeof value.generation_id === 'string' ? value.generation_id : null,
    unsignedUrls: Array.isArray(value.unsigned_urls)
      ? value.unsigned_urls.filter((url): url is string => typeof url === 'string')
      : [],
    usage,
    estimatedCostUsd: usage?.cost ?? estimatedCostUsd,
  }
}

function imageEndpointCost(endpoint: Record<string, unknown>, request: ImageRequest): number | null {
  if (!Array.isArray(endpoint.pricing) || endpoint.pricing.length === 0)
    return null
  let outputCost: number | null = null
  let referenceCost = 0
  for (const line of endpoint.pricing) {
    if (!isRecord(line) || line.unit !== 'image' || typeof line.cost_usd !== 'number')
      return null
    if (line.billable === 'output_image') {
      const variant = typeof line.variant === 'string' ? line.variant.toLowerCase() : null
      if (request.resolution && variant === request.resolution.toLowerCase())
        outputCost = line.cost_usd
      else if (variant === null && outputCost === null)
        outputCost = line.cost_usd
    }
    else if (line.billable === 'input_reference' || line.billable === 'input_image') {
      referenceCost += line.cost_usd * (request.inputReferences?.length || 0)
    }
    else {
      return null
    }
  }
  return outputCost === null ? null : Number((outputCost + referenceCost).toFixed(6))
}

function cents(value: unknown): number | null {
  if (typeof value !== 'string')
    return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount / 100 : null
}

function assertQuotedCost(estimatedCostUsd: number, maxCostUsd: number, kind: 'IMAGE' | 'VIDEO'): void {
  if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd < 0)
    throw new OpenRouterError(`${kind}_PRICE_UNAVAILABLE`, 'OpenRouter не вернул проверяемую цену.', 503)
  if (!Number.isFinite(maxCostUsd) || maxCostUsd <= 0 || estimatedCostUsd > maxCostUsd) {
    throw new OpenRouterError(
      `${kind}_BUDGET_EXCEEDED`,
      'Актуальная цена OpenRouter превышает серверный лимит задачи.',
      403,
    )
  }
}

import type { H3Event } from 'h3'
import { getHeader, getRequestIP, getRequestURL } from 'h3'
import type { AiModuleDefinition } from './catalog'
import type { FabulaAiConfig } from './config'
import type { JsonValue } from './contracts'
import { FabulaApiError } from './http'

interface RateBucket {
  startedAt: number
  count: number
  concurrent: number
}

const buckets = new Map<string, RateBucket>()
const WINDOW_MS = 60_000
const MAX_CONCURRENT = 2

function clientKey(event: H3Event): string {
  return getRequestIP(event) || 'unknown'
}

function pruneBuckets(now: number): void {
  if (buckets.size < 500)
    return
  for (const [key, bucket] of buckets) {
    if (now - bucket.startedAt > WINDOW_MS * 2 && bucket.concurrent === 0)
      buckets.delete(key)
  }
}

export function assertRequestSize(event: H3Event, maxBytes: number): void {
  const contentLength = Number(getHeader(event, 'content-length') || 0)
  if (Number.isFinite(contentLength) && contentLength > maxBytes)
    throw new FabulaApiError('BODY_TOO_LARGE', 'Запрос превышает допустимый размер.', 413)
}

export function assertSameOrigin(event: H3Event): void {
  const origin = getHeader(event, 'origin')
  if (!origin)
    return
  const requestOrigin = getRequestURL(event).origin
  if (origin !== requestOrigin)
    throw new FabulaApiError('ORIGIN_REJECTED', 'Запрос с другого origin запрещен.', 403)
}

export function assertAiEnabled(config: FabulaAiConfig): void {
  if (!config.enabled)
    throw new FabulaApiError('AI_DISABLED', 'AI-контур выключен серверной настройкой.', 503)
  if (!config.apiKey)
    throw new FabulaApiError('AI_NOT_CONFIGURED', 'На сервере не настроен ключ OpenRouter.', 503)
  if (!config.allowUnauthenticated) {
    throw new FabulaApiError(
      'AUTH_REQUIRED',
      'Публичные AI-вызовы заблокированы до подключения авторизации.',
      503,
    )
  }
}

export function assertModuleGate(module: AiModuleDefinition, config: FabulaAiConfig): void {
  const enabled = module.gate === 'core'
    || (module.gate === 'nemotron' && config.nemotronEnabled)
    || (module.gate === 'nemotron-paid' && config.nemotronPaidEnabled)
    || (module.gate === 'aion' && config.aionEnabled)
    || (module.gate === 'media' && config.mediaEnabled)
    || (module.gate === 'premium-media' && config.mediaEnabled && config.premiumMediaEnabled)
  if (!enabled)
    throw new FabulaApiError('MODULE_DISABLED', 'Модуль выключен серверной политикой.', 403)
}

export function acquireRateLimit(event: H3Event, config: FabulaAiConfig): () => void {
  const now = Date.now()
  pruneBuckets(now)
  const key = clientKey(event)
  let bucket = buckets.get(key)
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    bucket = { startedAt: now, count: 0, concurrent: 0 }
    buckets.set(key, bucket)
  }
  if (bucket.count >= config.requestsPerMinute)
    throw new FabulaApiError('RATE_LIMITED', 'Слишком много AI-запросов. Повтори позже.', 429, true)
  if (bucket.concurrent >= MAX_CONCURRENT)
    throw new FabulaApiError('CONCURRENCY_LIMITED', 'Два AI-запроса уже выполняются.', 429, true)
  bucket.count += 1
  bucket.concurrent += 1
  let released = false
  return () => {
    if (released)
      return
    released = true
    const current = buckets.get(key)
    if (current)
      current.concurrent = Math.max(0, current.concurrent - 1)
  }
}

export function assertApprovedStillUrl(urlValue: unknown, config: FabulaAiConfig): string {
  if (typeof urlValue !== 'string')
    throw new FabulaApiError('APPROVED_STILL_REQUIRED', 'Для видео нужен URL утвержденного кадра.', 422)
  let url: URL
  let site: URL
  try {
    url = new URL(urlValue)
    site = new URL(config.siteUrl)
  }
  catch {
    throw new FabulaApiError('APPROVED_STILL_INVALID', 'Некорректный URL утвержденного кадра.', 422)
  }
  if (url.protocol !== 'https:' || url.origin !== site.origin)
    throw new FabulaApiError('APPROVED_STILL_REJECTED', 'Кадр должен находиться на настроенном asset-origin.', 422)
  return url.toString()
}

export function assertApprovedAssetUrls(
  value: unknown,
  config: FabulaAiConfig,
  maxItems: number,
  required: boolean,
): string[] {
  if (value === undefined && !required)
    return []
  if (!Array.isArray(value) || value.length > maxItems || (required && value.length === 0)) {
    throw new FabulaApiError(
      required ? 'APPROVED_REFERENCE_REQUIRED' : 'APPROVED_REFERENCES_INVALID',
      required ? 'Для этого модуля нужен утвержденный reference asset.' : 'Некорректный список reference assets.',
      422,
    )
  }
  return value.map(url => assertApprovedStillUrl(url, config))
}

export function sanitizeNemotronPayload(payload: Record<string, unknown>): Record<string, JsonValue> {
  const allowedKeys = new Set([
    'story_pack_id',
    'scene_id',
    'entity_roles',
    'confirmed_fact_refs',
    'confirmed_event_refs',
    'resource_bands',
    'active_threads',
    'unresolved_callbacks',
    'pack_constraints',
    'recent_outcome_bands',
    'available_paths',
    'allowed_difficulty_knobs',
  ])
  const sanitized: Record<string, JsonValue> = {}
  for (const [key, value] of Object.entries(payload)) {
    if (allowedKeys.has(key))
      sanitized[key] = sanitizeValue(value, key, 0)
  }
  if (Object.keys(sanitized).length === 0)
    throw new FabulaApiError('SANITIZED_PAYLOAD_EMPTY', 'Nemotron не получил разрешенных обезличенных полей.', 422)
  return sanitized
}

function sanitizeValue(value: unknown, path: string, depth: number): JsonValue {
  if (depth > 5)
    throw new FabulaApiError('SANITIZED_PAYLOAD_INVALID', 'Обезличенный payload слишком глубокий.', 422)
  if (value === null || typeof value === 'boolean' || typeof value === 'number')
    return value
  if (typeof value === 'string') {
    if (value.length > 240 || /@|https?:\/\/|\+?\d[\d\s()-]{7,}/.test(value))
      throw new FabulaApiError('PII_REJECTED', `Поле ${path} похоже на сырой текст или PII.`, 422)
    return value
  }
  if (Array.isArray(value)) {
    if (value.length > 50)
      throw new FabulaApiError('SANITIZED_PAYLOAD_INVALID', 'Слишком длинный обезличенный массив.', 422)
    return value.map((item, index) => sanitizeValue(item, `${path}[${index}]`, depth + 1))
  }
  if (value && typeof value === 'object') {
    const result: Record<string, JsonValue> = {}
    for (const [key, item] of Object.entries(value)) {
      if (!/^[A-Za-z0-9_.:-]{1,80}$/.test(key))
        throw new FabulaApiError('SANITIZED_PAYLOAD_INVALID', 'Некорректный ключ обезличенного payload.', 422)
      result[key] = sanitizeValue(item, `${path}.${key}`, depth + 1)
    }
    return result
  }
  throw new FabulaApiError('SANITIZED_PAYLOAD_INVALID', 'Некорректный обезличенный payload.', 422)
}

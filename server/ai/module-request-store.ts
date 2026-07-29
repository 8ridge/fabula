import type { ModuleRequest } from './contracts'
import { FabulaApiError } from './http'

interface ModuleRequestStoreOptions {
  maxRecords?: number
  ttlMs?: number
  now?: () => number
}

interface ModuleRecord {
  fingerprint: string
  promise: Promise<Record<string, unknown>>
  updatedAt: number
}

export class ModuleRequestStore {
  private readonly records = new Map<string, ModuleRecord>()
  private readonly maxRecords: number
  private readonly ttlMs: number
  private readonly now: () => number

  constructor(options: ModuleRequestStoreOptions = {}) {
    this.maxRecords = options.maxRecords || 1_000
    this.ttlMs = options.ttlMs || 24 * 60 * 60 * 1_000
    this.now = options.now || Date.now
  }

  async execute(
    moduleId: string,
    request: ModuleRequest,
    worker: () => Promise<Record<string, unknown>>,
  ): Promise<Record<string, unknown>> {
    this.pruneExpired()
    const key = request.request_id
    const requestFingerprint = fingerprint(moduleId, request)
    const existing = this.records.get(key)
    if (existing) {
      if (existing.fingerprint !== requestFingerprint) {
        throw new FabulaApiError(
          'IDEMPOTENCY_CONFLICT',
          'Этот request_id уже использован для другого AI-запроса.',
          409,
        )
      }
      existing.updatedAt = this.now()
      return { ...(await existing.promise), replayed: true }
    }
    if (this.records.size >= this.maxRecords) {
      throw new FabulaApiError(
        'IDEMPOTENCY_CAPACITY_REACHED',
        'Лимит защищенных AI-запросов исчерпан. Повтори позже.',
        503,
        true,
      )
    }
    const promise = worker()
    this.records.set(key, {
      fingerprint: requestFingerprint,
      promise,
      updatedAt: this.now(),
    })
    return { ...(await promise), replayed: false }
  }

  private pruneExpired(): void {
    const cutoff = this.now() - this.ttlMs
    for (const [key, record] of this.records) {
      if (record.updatedAt < cutoff)
        this.records.delete(key)
    }
  }
}

function fingerprint(moduleId: string, request: ModuleRequest): string {
  const source = JSON.stringify({ moduleId, request })
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}:${source.length}`
}

export const moduleRequestStore = new ModuleRequestStore()

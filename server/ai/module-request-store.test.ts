import { describe, expect, test } from 'bun:test'
import type { ModuleRequest } from './contracts'
import { ModuleRequestStore } from './module-request-store'

const request: ModuleRequest = {
  schema_version: 'ai-module-request@1.0',
  request_id: 'request:12345678',
  payload: { mode: 'CANON_AUDIT' },
  template_variables: {},
}

describe('standalone module idempotency', () => {
  test('coalesces an in-flight request and replays success', async () => {
    const store = new ModuleRequestStore()
    let calls = 0
    const worker = async () => {
      calls += 1
      return { status: 'ready' }
    }
    const first = await store.execute('turn-qa', request, worker)
    const replay = await store.execute('turn-qa', request, worker)
    expect(first.replayed).toBe(false)
    expect(replay.replayed).toBe(true)
    expect(calls).toBe(1)
  })

  test('replays failure without another potentially paid call', async () => {
    const store = new ModuleRequestStore()
    let calls = 0
    const worker = async (): Promise<Record<string, unknown>> => {
      calls += 1
      throw new Error('provider response was lost')
    }
    await expect(store.execute('turn-qa', request, worker)).rejects.toThrow()
    await expect(store.execute('turn-qa', request, worker)).rejects.toThrow()
    expect(calls).toBe(1)
  })

  test('rejects conflicting reuse and fails closed at capacity', async () => {
    const store = new ModuleRequestStore({ maxRecords: 1 })
    await store.execute('turn-qa', request, async () => ({ status: 'ready' }))
    await expect(store.execute('journal', request, async () => ({ status: 'ready' })))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' })
    await expect(store.execute('journal', {
      ...request,
      request_id: 'request:other-12345678',
    }, async () => ({ status: 'ready' })))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CAPACITY_REACHED' })
  })
})

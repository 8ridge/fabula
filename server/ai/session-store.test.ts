import { describe, expect, test } from 'bun:test'
import type { TurnCommand, TurnOutput } from './contracts'
import { validTurnCommand, validTurnOutput } from './contracts.test'
import { FabulaApiError } from './http'
import { PreviewSessionStore } from './session-store'
import type { SessionTurnResult } from './session-store'

function workerResult(): SessionTurnResult {
  return {
    output: validTurnOutput() as unknown as TurnOutput,
    model: 'deepseek/deepseek-v4-flash',
    fallbackUsed: false,
    advisoryUsed: false,
  }
}

describe('preview session idempotency', () => {
  test('coalesces concurrent duplicate turns into one model call', async () => {
    const store = new PreviewSessionStore()
    const command = validTurnCommand() as TurnCommand
    let calls = 0
    let resolveWorker: (value: ReturnType<typeof workerResult>) => void = () => {}
    const deferred = new Promise<ReturnType<typeof workerResult>>((resolve) => {
      resolveWorker = resolve
    })
    const worker = async () => {
      calls += 1
      return deferred
    }

    const first = store.execute(command, worker)
    const second = store.execute(command, worker)
    resolveWorker(workerResult())
    const [firstResult, secondResult] = await Promise.all([first, second])

    expect(calls).toBe(1)
    expect(firstResult.sessionVersion).toBe(1)
    expect(secondResult.sessionVersion).toBe(1)
    expect(secondResult.replayed).toBe(true)
  })

  test('rejects reuse of an idempotency key with another payload', async () => {
    const store = new PreviewSessionStore()
    const command = validTurnCommand() as TurnCommand
    await store.execute(command, async () => workerResult())
    const changed = validTurnCommand({ text: 'Другой ход.' }) as TurnCommand
    await expect(store.execute(changed, async () => workerResult())).rejects.toBeInstanceOf(FabulaApiError)
  })

  test('rejects a stale version before invoking a model', async () => {
    const store = new PreviewSessionStore()
    const command = validTurnCommand({ expected_session_version: 1 }) as TurnCommand
    let called = false
    await expect(store.execute(command, async () => {
      called = true
      return workerResult()
    })).rejects.toMatchObject({ code: 'SESSION_VERSION_CONFLICT' })
    expect(called).toBe(false)
  })

  test('replays a cached failure without a second paid call', async () => {
    const store = new PreviewSessionStore()
    const command = validTurnCommand() as TurnCommand
    let calls = 0
    const worker = async (): Promise<SessionTurnResult> => {
      calls += 1
      throw new Error('upstream failed after the request')
    }
    await expect(store.execute(command, worker)).rejects.toThrow('upstream failed')
    await expect(store.execute(command, worker)).rejects.toThrow('upstream failed')
    expect(calls).toBe(1)
  })

  test('fails closed at session capacity and prunes expired idle sessions', async () => {
    let now = 1_000
    const store = new PreviewSessionStore({
      maxSessions: 1,
      sessionTtlMs: 100,
      now: () => now,
    })
    const first = validTurnCommand() as TurnCommand
    store.snapshot(first)
    const second = validTurnCommand({
      session_id: 'session:other-12345678',
      idempotency_key: 'turn:other-12345678',
    }) as TurnCommand
    expect(() => store.snapshot(second)).toThrow()
    now += 101
    expect(store.snapshot(second).sessionId).toBe(second.session_id)
  })
})

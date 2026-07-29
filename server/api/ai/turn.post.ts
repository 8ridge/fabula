import { readBody, setHeader } from 'h3'
import { resolveAiConfig } from '../../ai/config'
import { parseTurnCommand } from '../../ai/contracts'
import { respondWithError } from '../../ai/http'
import { acquireRateLimit, assertAiConfigured, assertRequestSize, assertSameOrigin } from '../../ai/security'
import { previewSessionStore } from '../../ai/session-store'
import { TurnEngine } from '../../ai/turn-engine'

export default defineEventHandler(async (event) => {
  const requestId = globalThis.crypto.randomUUID()
  let turnId: string | undefined
  let release = () => {}
  try {
    assertSameOrigin(event)
    assertRequestSize(event, 16_000)
    const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
    assertAiConfigured(config)
    release = acquireRateLimit(event)
    const command = parseTurnCommand(await readBody(event))
    turnId = command.idempotency_key
    const engine = new TurnEngine(config)
    const result = await previewSessionStore.execute(command, snapshot => engine.execute(command, snapshot))
    setHeader(event, 'Cache-Control', 'no-store')
    return {
      schema_version: 'turn-response@1.0',
      request_id: requestId,
      turn_id: command.idempotency_key,
      session_id: command.session_id,
      session_version: result.sessionVersion,
      replayed: result.replayed,
      preview_only: true,
      persistence: 'process_memory',
      model: result.model,
      fallback_used: result.fallbackUsed,
      advisory_used: result.advisoryUsed,
      model_runs: result.modelRuns || [],
      turn: result.output,
    }
  }
  catch (error) {
    return respondWithError(event, error, requestId, turnId)
  }
  finally {
    release()
  }
})

import type { H3Event } from 'h3'
import { readBody, setHeader } from 'h3'
import type { GameTurnResponse } from '#shared/game'
import { resolveAiConfig } from '../ai/config'
import { parseTurnCommand } from '../ai/contracts'
import { AiExecutionError, FabulaApiError } from '../ai/http'
import { acquireRateLimit, assertAiConfigured, assertRequestSize, assertSameOrigin } from '../ai/security'
import { TurnEngine } from '../ai/turn-engine'
import { getOrCreatePlayerId } from './player'
import { getGameSessionRepository } from './session-runtime'

export async function handleGameTurn(event: H3Event, pathSessionId?: string) {
  assertSameOrigin(event)
  assertRequestSize(event, 16_000)
  const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
  assertAiConfigured(config)
  const release = acquireRateLimit(event)
  const controller = new AbortController()
  const requestId = globalThis.crypto.randomUUID()
  const abortTurn = () => controller.abort()
  event.node.req.once('aborted', abortTurn)
  event.node.res.once('close', abortTurn)
  try {
    const command = parseTurnCommand(await readBody(event))
    if (pathSessionId && command.session_id !== pathSessionId)
      throw new FabulaApiError('SESSION_ID_MISMATCH', 'Идентификатор сессии в пути и команде не совпадает.', 400)
    event.context.fabulaTurnId = command.idempotency_key
    const ownerId = getOrCreatePlayerId(event)
    const engine = new TurnEngine(config)
    let response: GameTurnResponse
    try {
      response = await getGameSessionRepository().executeTurn(
        ownerId,
        command,
        (snapshot, validateOutput) => engine.execute(command, snapshot, controller.signal, validateOutput),
        requestId,
      )
    }
    catch (error) {
      const modelRuns = error instanceof AiExecutionError ? error.modelRuns : []
      console.warn('fabula.turn.failed', {
        request_id: requestId,
        turn_id: command.idempotency_key,
        session_id: command.session_id,
        code: error instanceof FabulaApiError ? error.code : 'INTERNAL_ERROR',
        model_runs: modelRuns.map(run => ({
          role: run.role,
          model: run.model,
          request_id: run.request_id,
          status: run.status,
          error_code: run.error_code,
        })),
      })
      throw error
    }
    setHeader(event, 'Cache-Control', 'no-store')
    return response
  }
  finally {
    event.node.req.off('aborted', abortTurn)
    event.node.res.off('close', abortTurn)
    release()
  }
}

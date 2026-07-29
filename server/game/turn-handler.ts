import type { H3Event } from 'h3'
import { readBody, setHeader } from 'h3'
import { resolveAiConfig } from '../ai/config'
import { parseTurnCommand } from '../ai/contracts'
import { FabulaApiError } from '../ai/http'
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
  try {
    const command = parseTurnCommand(await readBody(event))
    if (pathSessionId && command.session_id !== pathSessionId)
      throw new FabulaApiError('SESSION_ID_MISMATCH', 'Идентификатор сессии в пути и команде не совпадает.', 400)
    const ownerId = getOrCreatePlayerId(event)
    const requestId = globalThis.crypto.randomUUID()
    const engine = new TurnEngine(config)
    const response = await getGameSessionRepository().executeTurn(
      ownerId,
      command,
      snapshot => engine.execute(command, snapshot),
      requestId,
    )
    setHeader(event, 'Cache-Control', 'no-store')
    return response
  }
  finally {
    release()
  }
}

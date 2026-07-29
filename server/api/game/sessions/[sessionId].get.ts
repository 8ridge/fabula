import { getRouterParam, setHeader } from 'h3'
import type { GetGameSessionResponse } from '#shared/game'
import { respondWithError } from '../../../ai/http'
import { parseSessionId } from '../../../game/contracts'
import { getOrCreatePlayerId } from '../../../game/player'
import { getGameSessionRepository } from '../../../game/session-runtime'

export default defineEventHandler(async (event): Promise<GetGameSessionResponse | ReturnType<typeof respondWithError>> => {
  const requestId = globalThis.crypto.randomUUID()
  try {
    const sessionId = parseSessionId(getRouterParam(event, 'sessionId'))
    const ownerId = getOrCreatePlayerId(event)
    const repository = getGameSessionRepository()
    const [session, startedSessions] = await Promise.all([
      repository.get(ownerId, sessionId),
      repository.list(ownerId),
    ])
    setHeader(event, 'Cache-Control', 'no-store')
    return {
      schema_version: 'session-snapshot@1.0',
      session,
      started_sessions: startedSessions,
    }
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
})

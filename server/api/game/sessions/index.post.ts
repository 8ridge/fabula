import { readBody, setHeader } from 'h3'
import type { CreateGameSessionResponse } from '#shared/game'
import { respondWithError } from '../../../ai/http'
import { assertRequestSize, assertSameOrigin } from '../../../ai/security'
import { parseCreateGameSessionRequest } from '../../../game/contracts'
import { getOrCreatePlayerId } from '../../../game/player'
import { getGameSessionRepository } from '../../../game/session-runtime'

export default defineEventHandler(async (event): Promise<CreateGameSessionResponse | ReturnType<typeof respondWithError>> => {
  const requestId = globalThis.crypto.randomUUID()
  try {
    assertSameOrigin(event)
    assertRequestSize(event, 8_000)
    const request = parseCreateGameSessionRequest(await readBody(event))
    const ownerId = getOrCreatePlayerId(event)
    const session = await getGameSessionRepository().create(ownerId, request)
    setHeader(event, 'Cache-Control', 'no-store')
    return {
      schema_version: 'session-created@1.0',
      session,
    }
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
})

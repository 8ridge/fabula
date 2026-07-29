import { getRouterParam } from 'h3'
import { respondWithError } from '../../../../ai/http'
import { parseSessionId } from '../../../../game/contracts'
import { handleGameTurn } from '../../../../game/turn-handler'

export default defineEventHandler(async (event) => {
  const requestId = globalThis.crypto.randomUUID()
  try {
    const sessionId = parseSessionId(getRouterParam(event, 'sessionId'))
    return await handleGameTurn(event, sessionId)
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
})

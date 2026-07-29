import { respondWithError } from '../../ai/http'
import { handleGameTurn } from '../../game/turn-handler'

export default defineEventHandler(async (event) => {
  const requestId = globalThis.crypto.randomUUID()
  try {
    return await handleGameTurn(event)
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
})

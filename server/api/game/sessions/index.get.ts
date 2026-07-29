import { setHeader } from 'h3'
import type { ListGameSessionsResponse } from '#shared/game'
import { getOrCreatePlayerId } from '../../../game/player'
import { getGameSessionRepository } from '../../../game/session-runtime'

export default defineEventHandler(async (event): Promise<ListGameSessionsResponse> => {
  const ownerId = getOrCreatePlayerId(event)
  const sessions = await getGameSessionRepository().list(ownerId)
  setHeader(event, 'Cache-Control', 'no-store')
  return {
    schema_version: 'session-list@1.0',
    sessions,
  }
})

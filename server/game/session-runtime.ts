import { useStorage } from 'nitropack/runtime'
import type { GameSessionStorage } from './session-repository'
import { GameSessionRepository } from './session-repository'

let repository: GameSessionRepository | null = null

export function getGameSessionRepository(): GameSessionRepository {
  if (!repository)
    repository = new GameSessionRepository(useStorage('fabula-sessions') as unknown as GameSessionStorage)
  return repository
}

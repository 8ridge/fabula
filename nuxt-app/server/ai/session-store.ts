import type { TurnCommand, TurnOutput } from './contracts'
import { FabulaApiError } from './http'

export interface SessionTurnResult {
  output: TurnOutput
  model: string
  fallbackUsed: boolean
  advisoryUsed: boolean
  modelRuns?: Array<{
    role: 'advisory' | 'primary' | 'fallback'
    model: string
    requestId: string | null
    usage: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
      cost?: number
    } | null
    status: 'accepted' | 'discarded'
    errorCode: string | null
  }>
}

export interface StoredTurnResult extends SessionTurnResult {
  sessionVersion: number
  replayed: boolean
}

export interface SessionSnapshot {
  sessionId: string
  storyId: TurnCommand['story_id']
  version: number
  history: Array<{
    turnId: string
    mode: TurnCommand['mode']
    playerText: string
    outcome: string
    narrative: string
  }>
}

interface IdempotencyRecord {
  fingerprint: string
  promise: Promise<StoredTurnResult>
}

interface SessionState extends SessionSnapshot {
  idempotency: Map<string, IdempotencyRecord>
  inFlightKey: string | null
}

function fingerprint(command: TurnCommand): string {
  const source = JSON.stringify(command)
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}:${source.length}`
}

export class PreviewSessionStore {
  private readonly sessions = new Map<string, SessionState>()

  snapshot(command: TurnCommand): SessionSnapshot {
    const session = this.getOrCreate(command)
    return {
      sessionId: session.sessionId,
      storyId: session.storyId,
      version: session.version,
      history: session.history.map(item => ({ ...item })),
    }
  }

  async execute(command: TurnCommand, worker: (snapshot: SessionSnapshot) => Promise<SessionTurnResult>): Promise<StoredTurnResult> {
    const session = this.getOrCreate(command)
    const key = command.idempotency_key
    const commandFingerprint = fingerprint(command)
    const existing = session.idempotency.get(key)
    if (existing) {
      if (existing.fingerprint !== commandFingerprint)
        throw new FabulaApiError('IDEMPOTENCY_CONFLICT', 'Этот idempotency_key уже использован для другого хода.', 409)
      const replay = await existing.promise
      return { ...replay, replayed: true }
    }
    if (command.expected_session_version !== session.version)
      throw new FabulaApiError('SESSION_VERSION_CONFLICT', 'Версия сессии устарела. Обнови сцену и повтори ход.', 409)
    if (session.inFlightKey)
      throw new FabulaApiError('SESSION_BUSY', 'Предыдущий ход этой сессии еще выполняется.', 409, true)

    session.inFlightKey = key
    const promise = this.runAndCommit(session, command, worker)
    session.idempotency.set(key, { fingerprint: commandFingerprint, promise })
    try {
      return await promise
    }
    catch (error) {
      session.idempotency.delete(key)
      throw error
    }
    finally {
      if (session.inFlightKey === key)
        session.inFlightKey = null
    }
  }

  private getOrCreate(command: TurnCommand): SessionState {
    const existing = this.sessions.get(command.session_id)
    if (existing) {
      if (existing.storyId !== command.story_id)
        throw new FabulaApiError('SESSION_STORY_CONFLICT', 'Сессия уже привязана к другому StoryPack.', 409)
      return existing
    }
    const created: SessionState = {
      sessionId: command.session_id,
      storyId: command.story_id,
      version: 0,
      history: [],
      idempotency: new Map(),
      inFlightKey: null,
    }
    this.sessions.set(command.session_id, created)
    return created
  }

  private async runAndCommit(
    session: SessionState,
    command: TurnCommand,
    worker: (snapshot: SessionSnapshot) => Promise<SessionTurnResult>,
  ): Promise<StoredTurnResult> {
    const snapshot = this.snapshot(command)
    const result = await worker(snapshot)
    if (session.version !== command.expected_session_version)
      throw new FabulaApiError('SESSION_VERSION_CONFLICT', 'Сессия изменилась во время хода.', 409)
    session.version += 1
    session.history.push({
      turnId: command.idempotency_key,
      mode: command.mode,
      playerText: command.text,
      outcome: result.output.resolution.outcome,
      narrative: result.output.narrative_text,
    })
    if (session.history.length > 12)
      session.history.splice(0, session.history.length - 12)
    return {
      ...result,
      sessionVersion: session.version,
      replayed: false,
    }
  }
}

export const previewSessionStore = new PreviewSessionStore()

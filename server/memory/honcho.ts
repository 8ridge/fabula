import type {
  GameSessionSnapshot,
  GameTurnCommand,
  GameTurnResponse,
} from '../../shared/game'
import type { TurnExternalMemory } from '../ai/turn-engine'

const MANAGED_HONCHO_URL = 'https://api.honcho.dev'
const WORKSPACE_ID = 'fabula'
const NARRATOR_PEER_ID = 'fabula-narrator'
const HONCHO_TIMEOUT_MS = 6_000

type FetchLike = typeof globalThis.fetch

export interface HonchoConfig {
  apiKey: string
  baseUrl: string
}

export interface HonchoIdentity {
  playerPeerId: string
  narratorPeerId: string
  sessionId: string
}

export class HonchoMemoryError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'HonchoMemoryError'
    this.code = code
  }
}

function resolveBaseUrl(value: unknown): string {
  let url: URL
  try {
    url = new URL(String(value || MANAGED_HONCHO_URL))
  }
  catch {
    throw new Error('HONCHO_BASE_URL_REJECTED')
  }
  const localHttp = url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !localHttp)
    || url.username
    || url.password
    || url.search
    || url.hash
    || (url.pathname !== '/' && url.pathname !== '')) {
    throw new Error('HONCHO_BASE_URL_REJECTED')
  }
  return url.origin
}

export function resolveHonchoConfig(runtimeConfig: Record<string, unknown>): HonchoConfig {
  return {
    apiKey: String(runtimeConfig.honchoApiKey || ''),
    baseUrl: resolveBaseUrl(runtimeConfig.honchoBaseUrl),
  }
}

async function opaqueResourceId(prefix: string, ...parts: string[]): Promise<string> {
  if (parts.some(part => !part.trim()))
    throw new HonchoMemoryError('HONCHO_INVALID_ID', 'Не удалось сформировать идентификатор памяти.')
  const digestBytes = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(parts.join('\0')),
  )
  const digest = Array.from(
    new Uint8Array(digestBytes),
    byte => byte.toString(16).padStart(2, '0'),
  ).join('')
  return `${prefix}-${digest}`
}

export async function deriveHonchoIdentity(
  ownerId: string,
  fabulaSessionId: string,
): Promise<HonchoIdentity> {
  return {
    playerPeerId: await opaqueResourceId('player', 'owner', ownerId),
    narratorPeerId: NARRATOR_PEER_ID,
    sessionId: await opaqueResourceId('session', 'owner', ownerId, 'session', fabulaSessionId),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function boundedString(value: unknown, maxLength: number): string | null {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, maxLength)
    : null
}

function memoryStateSummary(session: GameSessionSnapshot): string {
  const inventory = session.inventory.slice(0, 24).map(item => ({
    name: item.name,
    owner: item.owner_name,
    holder: item.holder_name,
    location: item.location_name,
    quantity: item.quantity,
    charges: item.charges,
    condition: item.condition,
    provenance: item.provenance.summary,
  }))
  const journal = session.journal[0]
  return [
    'Подтвержденное сервером состояние после хода:',
    `Сцена: ${session.scene.title}; место: ${session.scene.location_name}; время: ${session.scene.story_time}.`,
    journal
      ? `Последняя запись журнала: ${journal.title}. ${journal.summary}`
      : 'Новой записи журнала нет.',
    `Инвентарь: ${JSON.stringify(inventory)}.`,
  ].join('\n').slice(0, 8_000)
}

export class HonchoMemoryClient {
  private readonly preparedSessions = new Map<string, Promise<HonchoIdentity>>()
  private readonly recordedTurns = new Set<string>()
  private workspaceReady: Promise<void> | null = null

  constructor(
    private readonly config: HonchoConfig,
    private readonly fetchImpl: FetchLike = globalThis.fetch,
    private readonly timeoutMs = HONCHO_TIMEOUT_MS,
  ) {}

  async recall(
    ownerId: string,
    fabulaSessionId: string,
    signal?: AbortSignal,
  ): Promise<TurnExternalMemory | null> {
    const identity = await this.prepare(ownerId, fabulaSessionId, signal)
    const query = new URLSearchParams({
      tokens: '1800',
      summary: 'true',
      peer_target: identity.playerPeerId,
      peer_perspective: identity.narratorPeerId,
      limit_to_session: 'false',
    })
    const response = await this.request(
      `/v3/workspaces/${WORKSPACE_ID}/sessions/${identity.sessionId}/context?${query}`,
      { method: 'GET' },
      signal,
    )
    if (!isRecord(response))
      throw new HonchoMemoryError('HONCHO_INVALID_RESPONSE', 'Honcho вернул некорректный контекст.')
    const summary = isRecord(response.summary)
      ? boundedString(response.summary.content, 4_000)
      : null
    const peerRepresentation = boundedString(response.peer_representation, 4_000)
    const peerCard = Array.isArray(response.peer_card)
      ? response.peer_card
          .filter((entry): entry is string => typeof entry === 'string')
          .slice(0, 24)
          .map(entry => entry.slice(0, 500))
      : []
    if (!summary && !peerRepresentation && peerCard.length === 0)
      return null
    return {
      source: 'honcho',
      summary,
      peer_representation: peerRepresentation,
      peer_card: peerCard,
    }
  }

  async recordTurn(
    ownerId: string,
    command: GameTurnCommand,
    response: GameTurnResponse,
    signal?: AbortSignal,
  ): Promise<void> {
    const recordKey = `${ownerId}:${command.session_id}:${command.idempotency_key}`
    if (this.recordedTurns.has(recordKey))
      return
    const identity = await this.prepare(ownerId, command.session_id, signal)
    const latestMessages = response.session.messages.slice(-2)
    const playerMessage = latestMessages.find(message => message.role === 'player')
    const narratorMessage = latestMessages.find(message => message.role === 'narrator')
    if (!playerMessage || !narratorMessage)
      throw new HonchoMemoryError('HONCHO_TURN_INCOMPLETE', 'В подтвержденном ходе не хватает сообщений.')

    await this.request(
      `/v3/workspaces/${WORKSPACE_ID}/sessions/${identity.sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            {
              peer_id: identity.playerPeerId,
              content: playerMessage.text.slice(0, 8_000),
              created_at: playerMessage.created_at,
              metadata: {
                source: 'fabula',
                kind: 'player_turn',
                turn_id: command.idempotency_key,
                mode: command.mode,
                selected_item_ids: command.selected_item_ids,
              },
            },
            {
              peer_id: identity.narratorPeerId,
              content: `${narratorMessage.text}\n\n${memoryStateSummary(response.session)}`.slice(0, 16_000),
              created_at: narratorMessage.created_at,
              metadata: {
                source: 'fabula',
                kind: 'confirmed_turn',
                turn_id: command.idempotency_key,
                outcome: narratorMessage.outcome,
                session_version: response.session_version,
              },
            },
          ],
        }),
      },
      signal,
    )
    this.recordedTurns.add(recordKey)
    if (this.recordedTurns.size > 512)
      this.recordedTurns.delete(this.recordedTurns.values().next().value!)
  }

  private async prepare(
    ownerId: string,
    fabulaSessionId: string,
    signal?: AbortSignal,
  ): Promise<HonchoIdentity> {
    const cacheKey = `${ownerId}:${fabulaSessionId}`
    let pending = this.preparedSessions.get(cacheKey)
    if (!pending) {
      pending = this.prepareResources(ownerId, fabulaSessionId, signal)
      this.preparedSessions.set(cacheKey, pending)
      pending.catch(() => {
        if (this.preparedSessions.get(cacheKey) === pending)
          this.preparedSessions.delete(cacheKey)
      })
    }
    return await pending
  }

  private async prepareResources(
    ownerId: string,
    fabulaSessionId: string,
    signal?: AbortSignal,
  ): Promise<HonchoIdentity> {
    await this.ensureWorkspace(signal)
    const identity = await deriveHonchoIdentity(ownerId, fabulaSessionId)
    await Promise.all([
      this.request(
        `/v3/workspaces/${WORKSPACE_ID}/peers`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: identity.playerPeerId,
            metadata: { source: 'fabula', role: 'player' },
          }),
        },
        signal,
      ),
      this.request(
        `/v3/workspaces/${WORKSPACE_ID}/peers`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: identity.narratorPeerId,
            metadata: { source: 'fabula', role: 'narrator' },
          }),
        },
        signal,
      ),
    ])
    await this.request(
      `/v3/workspaces/${WORKSPACE_ID}/sessions`,
      {
        method: 'POST',
        body: JSON.stringify({
          id: identity.sessionId,
          metadata: {
            source: 'fabula',
            owner_peer_id: identity.playerPeerId,
          },
          configuration: {
            reasoning: { enabled: true },
            peer_card: { use: true, create: true },
            summary: {
              enabled: true,
              messages_per_short_summary: 10,
              messages_per_long_summary: 20,
            },
            dream: { enabled: true },
          },
          peers: {
            [identity.playerPeerId]: {
              observe_me: true,
              observe_others: false,
            },
            [identity.narratorPeerId]: {
              observe_me: false,
              observe_others: true,
            },
          },
        }),
      },
      signal,
    )
    return identity
  }

  private async ensureWorkspace(signal?: AbortSignal): Promise<void> {
    if (!this.workspaceReady) {
      this.workspaceReady = this.request(
        '/v3/workspaces',
        {
          method: 'POST',
          body: JSON.stringify({
            id: WORKSPACE_ID,
            metadata: { source: 'fabula' },
          }),
        },
        signal,
      ).then(() => undefined)
      this.workspaceReady.catch(() => {
        this.workspaceReady = null
      })
    }
    await this.workspaceReady
  }

  private async request(
    path: string,
    init: RequestInit,
    externalSignal?: AbortSignal,
  ): Promise<unknown> {
    const controller = new AbortController()
    let timedOut = false
    const abortFromExternal = () => controller.abort()
    if (externalSignal?.aborted)
      abortFromExternal()
    else
      externalSignal?.addEventListener('abort', abortFromExternal, { once: true })
    const timer = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, this.timeoutMs)
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
      if (this.config.apiKey)
        headers.Authorization = `Bearer ${this.config.apiKey}`
      const response = await this.fetchImpl(`${this.config.baseUrl}${path}`, {
        ...init,
        headers: { ...headers, ...(init.headers || {}) },
        signal: controller.signal,
      })
      if (!response.ok)
        throw new HonchoMemoryError('HONCHO_UPSTREAM_ERROR', 'Honcho отклонил запрос памяти.')
      return await response.json().catch(() => null)
    }
    catch (error) {
      if (error instanceof HonchoMemoryError)
        throw error
      if (controller.signal.aborted) {
        throw new HonchoMemoryError(
          timedOut ? 'HONCHO_TIMEOUT' : 'HONCHO_ABORTED',
          timedOut ? 'Honcho не ответил вовремя.' : 'Запрос к Honcho отменен.',
        )
      }
      throw new HonchoMemoryError('HONCHO_UNAVAILABLE', 'Не удалось связаться с Honcho.')
    }
    finally {
      clearTimeout(timer)
      externalSignal?.removeEventListener('abort', abortFromExternal)
    }
  }
}

let currentClient: {
  apiKey: string
  baseUrl: string
  client: HonchoMemoryClient
} | null = null

export function getHonchoMemoryClient(
  runtimeConfig: Record<string, unknown>,
): HonchoMemoryClient | null {
  const config = resolveHonchoConfig(runtimeConfig)
  if (!config.apiKey && config.baseUrl === MANAGED_HONCHO_URL)
    return null
  if (!currentClient
    || currentClient.apiKey !== config.apiKey
    || currentClient.baseUrl !== config.baseUrl) {
    currentClient = {
      ...config,
      client: new HonchoMemoryClient(config),
    }
  }
  return currentClient.client
}

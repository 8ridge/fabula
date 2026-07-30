import {
  deriveHonchoIdentity,
  HonchoMemoryClient,
} from '../server/memory/honcho'
import type {
  GameTurnCommand,
  GameTurnResponse,
} from '../shared/game'

const WORKSPACE_ID = 'fabula'
const QUEUE_TIMEOUT_MS = 120_000

interface SessionContext {
  messages?: Array<{ content?: unknown }>
  peer_representation?: unknown
  peer_card?: unknown
  summary?: { content?: unknown } | null
}

interface QueueStatus {
  total_work_units?: number
  pending_work_units?: number
  in_progress_work_units?: number
}

function localBaseUrl(): string {
  const raw = process.env.NUXT_HONCHO_BASE_URL || 'http://127.0.0.1:8010'
  const url = new URL(raw)
  if (url.protocol !== 'http:'
    || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    throw new Error('Проверка изоляции разрешена только для локального Honcho.')
  }
  return url.origin
}

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    const apiKey = process.env.NUXT_HONCHO_API_KEY
    if (apiKey)
      headers.Authorization = `Bearer ${apiKey}`
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500)
      throw new Error(`Honcho ${response.status}: ${detail}`)
    }
    return await response.json() as T
  }
  finally {
    clearTimeout(timer)
  }
}

function contextText(context: SessionContext): string {
  return JSON.stringify({
    messages: context.messages,
    summary: context.summary,
    peer_representation: context.peer_representation,
    peer_card: context.peer_card,
  })
}

function confirmedTurn(
  sessionId: string,
  marker: string,
  runId: string,
): { command: GameTurnCommand, response: GameTurnResponse } {
  const createdAt = new Date().toISOString()
  const command: GameTurnCommand = {
    schema_version: 'turn-command@1.0',
    session_id: sessionId,
    idempotency_key: `turn:${crypto.randomUUID()}`,
    expected_session_version: 0,
    mode: 'exploration',
    text: `Проверочный личный факт игрока: кодовый маяк ${marker}.`,
    selected_target_ids: [],
    selected_item_ids: [],
    selected_suggestion_id: null,
  }
  const response = {
    schema_version: 'turn-response@1.0',
    request_id: `smoke:${runId}`,
    turn_id: command.idempotency_key,
    session_id: sessionId,
    session_version: 1,
    replayed: false,
    model: 'fabula-isolation-smoke',
    fallback_used: false,
    advisory_used: true,
    session: {
      messages: [
        {
          role: 'player',
          text: command.text,
          created_at: createdAt,
        },
        {
          role: 'narrator',
          text: 'Рассказчик подтвердил получение личного факта.',
          created_at: createdAt,
          outcome: 'success',
        },
      ],
      scene: {
        title: 'Проверка памяти',
        location_name: 'Локальный контур',
        story_time: 'Сейчас',
      },
      journal: [],
      inventory: [],
    },
  } as unknown as GameTurnResponse
  return { command, response }
}

async function waitForQueue(baseUrl: string, sessionId: string): Promise<void> {
  const startedAt = Date.now()
  let observedWork = false
  while (Date.now() - startedAt < QUEUE_TIMEOUT_MS) {
    const status = await requestJson<QueueStatus>(
      baseUrl,
      `/v3/workspaces/${WORKSPACE_ID}/queue/status?session_id=${encodeURIComponent(sessionId)}`,
    )
    const total = status.total_work_units || 0
    const pending = status.pending_work_units || 0
    const active = status.in_progress_work_units || 0
    observedWork ||= total > 0
    if (observedWork && pending === 0 && active === 0)
      return
    await Bun.sleep(500)
  }
  throw new Error(`Honcho не обработал очередь сессии ${sessionId} за 120 секунд.`)
}

async function main(): Promise<void> {
  const baseUrl = localBaseUrl()
  const client = new HonchoMemoryClient({
    apiKey: process.env.NUXT_HONCHO_API_KEY || '',
    baseUrl,
  })
  const runId = crypto.randomUUID()
  const ownerA = `player:${crypto.randomUUID()}`
  const ownerB = `player:${crypto.randomUUID()}`
  const sessionA = `session:${crypto.randomUUID()}`
  const sessionB = `session:${crypto.randomUUID()}`
  const [identityA, identityB] = await Promise.all([
    deriveHonchoIdentity(ownerA, sessionA),
    deriveHonchoIdentity(ownerB, sessionB),
  ])
  if (identityA.playerPeerId === identityB.playerPeerId
    || identityA.sessionId === identityB.sessionId) {
    throw new Error('Серверные идентификаторы двух игроков пересеклись.')
  }
  if (JSON.stringify([identityA, identityB]).includes(ownerA)
    || JSON.stringify([identityA, identityB]).includes(ownerB)) {
    throw new Error('Honcho identity раскрыл исходный идентификатор владельца.')
  }

  await Promise.all([
    client.recall(ownerA, sessionA),
    client.recall(ownerB, sessionB),
  ])

  const markerA = `FABULA_ALPHA_${runId}`
  const markerB = `FABULA_BRAVO_${runId}`
  const turnA = confirmedTurn(sessionA, markerA, runId)
  const turnB = confirmedTurn(sessionB, markerB, runId)
  await Promise.all([
    client.recordTurn(ownerA, turnA.command, turnA.response),
    client.recordTurn(ownerB, turnB.command, turnB.response),
  ])

  await Promise.all([
    waitForQueue(baseUrl, identityA.sessionId),
    waitForQueue(baseUrl, identityB.sessionId),
  ])

  const queryA = new URLSearchParams({
    tokens: '1800',
    summary: 'true',
    peer_target: identityA.playerPeerId,
    peer_perspective: identityA.narratorPeerId,
    limit_to_session: 'false',
  })
  const queryB = new URLSearchParams({
    tokens: '1800',
    summary: 'true',
    peer_target: identityB.playerPeerId,
    peer_perspective: identityB.narratorPeerId,
    limit_to_session: 'false',
  })
  const [contextA, contextB, memoryA, memoryB] = await Promise.all([
    requestJson<SessionContext>(
      baseUrl,
      `/v3/workspaces/${WORKSPACE_ID}/sessions/${identityA.sessionId}/context?${queryA}`,
    ),
    requestJson<SessionContext>(
      baseUrl,
      `/v3/workspaces/${WORKSPACE_ID}/sessions/${identityB.sessionId}/context?${queryB}`,
    ),
    client.recall(ownerA, sessionA),
    client.recall(ownerB, sessionB),
  ])
  const textA = contextText(contextA)
  const textB = contextText(contextB)
  if (!textA.includes(markerA) || textA.includes(markerB))
    throw new Error('Контекст игрока А содержит неверный набор сообщений.')
  if (!textB.includes(markerB) || textB.includes(markerA))
    throw new Error('Контекст игрока Б содержит неверный набор сообщений.')
  if (!memoryA || !memoryB)
    throw new Error('Honcho не сформировал раздельные представления игроков.')
  if (JSON.stringify(memoryA).includes(markerB) || JSON.stringify(memoryB).includes(markerA))
    throw new Error('Производная память одного игрока попала к другому.')

  console.log(JSON.stringify({
    status: 'PASS',
    workspace: WORKSPACE_ID,
    players: 2,
    sessions: 2,
    context_leaks: 0,
    derived_memory_leaks: 0,
  }))
}

await main()

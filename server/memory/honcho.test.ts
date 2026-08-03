import { describe, expect, test } from 'bun:test'
import type {
  GameSessionSnapshot,
  GameTurnCommand,
  GameTurnResponse,
} from '../../shared/game'
import {
  deriveHonchoIdentity,
  HonchoMemoryClient,
  resolveHonchoConfig,
} from './honcho'

const ownerId = 'player:11111111-1111-4111-8111-111111111111'
const sessionId = 'session:22222222-2222-4222-8222-222222222222'

const command: GameTurnCommand = {
  schema_version: 'turn-command@1.0',
  session_id: sessionId,
  idempotency_key: 'turn:33333333-3333-4333-8333-333333333333',
  expected_session_version: 0,
  mode: 'action',
  text: 'Я использую аптечку.',
  selected_target_ids: [],
  selected_item_ids: ['item:kit'],
  selected_journal_entry_ids: [],
  selected_suggestion_id: null,
}

function gameResponse(): GameTurnResponse {
  const item = {
    id: 'item:kit',
    template_id: 'item-template:kit',
    name: 'Аптечка',
    category: 'medicine' as const,
    description: 'Небольшая полевая аптечка.',
    quantity: 1,
    charges: 1,
    condition: 'usable' as const,
    owner_id: 'player',
    owner_name: 'Лея',
    holder_id: 'player',
    holder_name: 'Лея',
    location_id: 'location:hall',
    location_name: 'Зал',
    slot: 'bag' as const,
    version: 0,
    provenance: {
      kind: 'starting_equipment' as const,
      source_event_id: null,
      summary: 'Начальный предмет роли.',
    },
  }
  const session: GameSessionSnapshot = {
    schema_version: 'game-session@1.0',
    id: sessionId,
    story_pack_id: 'eighth-seal',
    story_pack_version: '0.2',
    status: 'active',
    version: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:01:00.000Z',
    persona: {
      name: 'Лея',
      role_id: 'eighth-seal:engineer',
      role_label: 'Инженер',
      competence: 'Анализ',
      limitation: 'Время',
      motivation: 'Понять круг',
      background: '',
      embodiment_note: '',
      narration_density: 'balanced',
    },
    scene: {
      id: 'scene:hall',
      title: 'Зал',
      location_id: 'location:hall',
      location_name: 'Зал',
      story_time: 'Первый час',
      objective: 'Осмотреться',
      present_character_ids: [],
    },
    messages: [
      {
        id: 'message:player',
        role: 'player',
        speaker: 'Лея',
        text: command.text,
        created_at: '2026-01-01T00:00:30.000Z',
        mode: 'action',
        outcome: null,
        selected_items: [item],
        selected_journal_entries: [],
      },
      {
        id: 'message:narrator',
        role: 'narrator',
        speaker: 'Рассказчик',
        text: 'Аптечка помогает остановить кровь.',
        created_at: '2026-01-01T00:00:31.000Z',
        mode: null,
        outcome: 'success',
        selected_items: [],
        selected_journal_entries: [],
      },
    ],
    suggestions: [],
    inventory: [item],
    journal: [{
      id: 'journal:turn',
      entry_type: 'event',
      title: 'Первая помощь',
      summary: 'Лея использовала аптечку.',
      uncertainty: 'confirmed',
      source_event_ids: ['event:turn'],
      involved_entity_ids: ['player'],
      story_time: 'Первый час',
      created_at: '2026-01-01T00:00:31.000Z',
    }],
    characters: [],
    locations: [],
  }
  return {
    schema_version: 'turn-response@1.0',
    request_id: 'request:test',
    turn_id: command.idempotency_key,
    session_id: sessionId,
    session_version: 1,
    replayed: false,
    model: 'deepseek/deepseek-v4-flash',
    fallback_used: false,
    advisory_used: true,
    session,
  }
}

describe('Honcho memory client', () => {
  test('derives opaque owner-scoped peer and session identities', async () => {
    const first = await deriveHonchoIdentity(ownerId, sessionId)
    const otherOwner = await deriveHonchoIdentity(
      'player:22222222-2222-4222-8222-222222222222',
      sessionId,
    )

    expect(first.playerPeerId).toMatch(/^player-[a-f0-9]{64}$/)
    expect(first.sessionId).toMatch(/^session-[a-f0-9]{64}$/)
    expect(first.playerPeerId).not.toBe(otherOwner.playerPeerId)
    expect(first.sessionId).not.toBe(otherOwner.sessionId)
    expect(JSON.stringify(first)).not.toContain(ownerId)
    expect(JSON.stringify(first)).not.toContain(sessionId)
  })

  test('accepts managed HTTPS and local self-hosting but rejects unsafe base URLs', () => {
    expect(resolveHonchoConfig({ honchoApiKey: 'secret' })).toEqual({
      apiKey: 'secret',
      baseUrl: 'https://api.honcho.dev',
    })
    expect(resolveHonchoConfig({ honchoBaseUrl: 'http://localhost:8000' }).baseUrl)
      .toBe('http://localhost:8000')
    expect(() => resolveHonchoConfig({ honchoBaseUrl: 'http://memory.example' }))
      .toThrow('HONCHO_BASE_URL_REJECTED')
    expect(() => resolveHonchoConfig({ honchoBaseUrl: 'https://memory.example/v3' }))
      .toThrow('HONCHO_BASE_URL_REJECTED')
  })

  test('creates v3 resources and returns only bounded derived memory', async () => {
    const requests: Array<{ url: string, init: RequestInit }> = []
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init: init || {} })
      if (String(input).includes('/context?')) {
        return new Response(JSON.stringify({
          id: 'session-memory',
          messages: [],
          summary: { content: 'Игрок сохранил печать.' },
          peer_representation: 'Игрок осторожен с неизвестными артефактами.',
          peer_card: ['Предпочитает проверять происхождение предметов.'],
        }), { status: 200 })
      }
      return new Response('{}', { status: 200 })
    }) as typeof globalThis.fetch
    const client = new HonchoMemoryClient({
      apiKey: 'secret-never-log',
      baseUrl: 'https://api.honcho.dev',
    }, fetchImpl)

    const memory = await client.recall(ownerId, sessionId)

    expect(memory).toEqual({
      source: 'honcho',
      summary: 'Игрок сохранил печать.',
      peer_representation: 'Игрок осторожен с неизвестными артефактами.',
      peer_card: ['Предпочитает проверять происхождение предметов.'],
    })
    expect(requests.map(request => request.url)).toContain(
      'https://api.honcho.dev/v3/workspaces',
    )
    const identity = await deriveHonchoIdentity(ownerId, sessionId)
    expect(requests.some(request =>
      request.url.includes(`/sessions/${identity.sessionId}/context?`)))
      .toBe(true)
    expect(requests.every(request =>
      (request.init.headers as Record<string, string>).Authorization === 'Bearer secret-never-log'))
      .toBe(true)
  })

  test('records one idempotent player and narrator pair for a confirmed turn', async () => {
    const requests: Array<{ url: string, init: RequestInit }> = []
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init: init || {} })
      return new Response('{}', { status: 200 })
    }) as typeof globalThis.fetch
    const client = new HonchoMemoryClient({
      apiKey: 'secret-never-log',
      baseUrl: 'https://api.honcho.dev',
    }, fetchImpl)
    const response = gameResponse()

    await client.recordTurn(ownerId, command, response)
    const requestCount = requests.length
    await client.recordTurn(ownerId, command, response)

    expect(requests).toHaveLength(requestCount)
    const messageRequest = requests.find(request => request.url.endsWith('/messages'))
    const body = JSON.parse(String(messageRequest?.init.body)) as {
      messages: Array<{ peer_id: string, content: string, metadata: Record<string, unknown> }>
    }
    expect(body.messages).toHaveLength(2)
    const identity = await deriveHonchoIdentity(ownerId, sessionId)
    expect(body.messages[0]).toMatchObject({
      peer_id: identity.playerPeerId,
      content: command.text,
      metadata: { turn_id: command.idempotency_key },
    })
    expect(body.messages[1]?.content).toContain('Подтвержденное сервером состояние')
    expect(body.messages[1]?.content).toContain('Начальный предмет роли.')
  })
})

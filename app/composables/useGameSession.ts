import type {
  GameSessionSnapshot,
  GameSessionSummary,
  GameTurnCommand,
  GameTurnResponse,
  GetGameSessionResponse,
  ListGameSessionsResponse,
} from '#shared/game'
import type { StoryMode } from '#shared/storypacks'

interface PendingTurn {
  command: GameTurnCommand
  created_at: string
}

interface SubmitTurnInput {
  text: string
  mode: StoryMode
  selectedSuggestionId: string | null
  selectedTargetIds?: string[]
  selectedItemIds?: string[]
}

const SESSION_ID = /^session:[0-9a-f-]{36}$/i
const TURN_CLIENT_TIMEOUT_MS = 75_000

type TurnAbortReason = 'user' | 'deadline' | 'unmount' | null

function isAbortError(error: unknown): boolean {
  let current = error as { name?: string, cause?: unknown } | null
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (current.name === 'AbortError')
      return true
    current = current.cause as { name?: string, cause?: unknown } | null
  }
  return false
}

function apiMessage(error: unknown): string {
  const data = (error as { data?: { code?: string, message?: string } })?.data
  if (data?.code === 'AI_NOT_CONFIGURED')
    return 'Нейросетевой контур еще не подключен на этом сервере. История сохранена, но новый ход пока недоступен.'
  if (data?.code === 'SESSION_VERSION_CONFLICT')
    return 'История уже изменилась в другой вкладке. Свежая версия загружена; проверь текст и отправь его снова.'
  if (data?.code === 'MODEL_FALLBACK_EXHAUSTED' || data?.code === 'UPSTREAM_TIMEOUT')
    return 'Нейросети не завершили ход вовремя. Текст сохранен — можно повторить без создания дубликата.'
  if (data?.code === 'UPSTREAM_RATE_LIMITED')
    return 'OpenRouter временно ограничил запросы. Текст сохранен — повтори ход немного позже.'
  return data?.message || 'Не удалось получить продолжение. Текст сохранен — можно повторить отправку.'
}

export function useGameSession(sessionId: Ref<string | null>) {
  const session = ref<GameSessionSnapshot | null>(null)
  const startedSessions = ref<GameSessionSummary[]>([])
  const loading = ref(true)
  const sending = ref(false)
  const turnElapsedSeconds = ref(0)
  const errorMessage = ref('')
  const pendingTurn = ref<PendingTurn | null>(null)
  let activeTurnController: AbortController | null = null
  let turnElapsedTimer: ReturnType<typeof setInterval> | null = null
  let turnDeadlineTimer: ReturnType<typeof setTimeout> | null = null
  let turnAbortReason: TurnAbortReason = null

  const draftKey = computed(() => sessionId.value ? `fabula:draft:${sessionId.value}` : '')
  const pendingKey = computed(() => sessionId.value ? `fabula:pending:${sessionId.value}` : '')

  function readPending(): PendingTurn | null {
    if (!import.meta.client || !pendingKey.value)
      return null
    try {
      const raw = localStorage.getItem(pendingKey.value)
      if (!raw)
        return null
      const value = JSON.parse(raw) as PendingTurn
      return value?.command?.session_id === sessionId.value ? value : null
    }
    catch {
      return null
    }
  }

  function writePending(value: PendingTurn | null) {
    pendingTurn.value = value
    if (!import.meta.client || !pendingKey.value)
      return
    if (value)
      localStorage.setItem(pendingKey.value, JSON.stringify(value))
    else
      localStorage.removeItem(pendingKey.value)
  }

  function clearTurnTimers() {
    if (turnElapsedTimer)
      clearInterval(turnElapsedTimer)
    if (turnDeadlineTimer)
      clearTimeout(turnDeadlineTimer)
    turnElapsedTimer = null
    turnDeadlineTimer = null
  }

  function cancelTurn() {
    if (!sending.value || !activeTurnController)
      return
    turnAbortReason = 'user'
    activeTurnController.abort()
  }

  async function loadStartedSessions() {
    const response = await $fetch<ListGameSessionsResponse>('/api/game/sessions')
    startedSessions.value = response.sessions
    return response.sessions
  }

  async function load() {
    loading.value = true
    errorMessage.value = ''
    try {
      if (!sessionId.value || !SESSION_ID.test(sessionId.value)) {
        session.value = null
        await loadStartedSessions()
        return
      }
      const response = await $fetch<GetGameSessionResponse>(
        `/api/game/sessions/${encodeURIComponent(sessionId.value)}`,
      )
      session.value = response.session
      startedSessions.value = response.started_sessions
      pendingTurn.value = readPending()
    }
    catch (error) {
      session.value = null
      errorMessage.value = apiMessage(error)
    }
    finally {
      loading.value = false
    }
  }

  function buildCommand(input: SubmitTurnInput): GameTurnCommand {
    if (!session.value)
      throw new Error('Session is not loaded')
    const prior = readPending()
    const samePayload = prior
      && prior.command.session_id === session.value.id
      && prior.command.mode === input.mode
      && prior.command.text === input.text.trim()
      && prior.command.selected_suggestion_id === input.selectedSuggestionId
      && JSON.stringify(prior.command.selected_target_ids) === JSON.stringify(input.selectedTargetIds || [])
      && JSON.stringify(prior.command.selected_item_ids) === JSON.stringify(input.selectedItemIds || [])
    if (samePayload)
      return prior.command
    return {
      schema_version: 'turn-command@1.0',
      session_id: session.value.id,
      idempotency_key: `turn:${globalThis.crypto.randomUUID()}`,
      expected_session_version: session.value.version,
      mode: input.mode,
      text: input.text.trim(),
      selected_target_ids: input.selectedTargetIds || [],
      selected_item_ids: input.selectedItemIds || [],
      selected_suggestion_id: input.selectedSuggestionId,
    }
  }

  async function submit(input: SubmitTurnInput): Promise<boolean> {
    if (!session.value || sending.value || !input.text.trim())
      return false
    sending.value = true
    turnElapsedSeconds.value = 0
    errorMessage.value = ''
    const command = buildCommand(input)
    writePending({ command, created_at: new Date().toISOString() })
    const controller = new AbortController()
    activeTurnController = controller
    turnAbortReason = null
    const startedAt = Date.now()
    turnElapsedTimer = setInterval(() => {
      turnElapsedSeconds.value = Math.floor((Date.now() - startedAt) / 1000)
    }, 1000)
    turnDeadlineTimer = setTimeout(() => {
      if (activeTurnController !== controller)
        return
      turnAbortReason = 'deadline'
      controller.abort()
    }, TURN_CLIENT_TIMEOUT_MS)
    try {
      const response = await $fetch<GameTurnResponse>(
        `/api/game/sessions/${encodeURIComponent(session.value.id)}/turns`,
        {
          method: 'POST',
          body: command,
          signal: controller.signal,
        },
      )
      session.value = response.session
      writePending(null)
      if (import.meta.client && draftKey.value)
        localStorage.removeItem(draftKey.value)
      await loadStartedSessions()
      return true
    }
    catch (error) {
      if (isAbortError(error)) {
        if (turnAbortReason === 'user')
          errorMessage.value = 'Ход остановлен. Текст сохранен — повторная отправка продолжит тот же запрос без дубликата.'
        else if (turnAbortReason === 'deadline')
          errorMessage.value = 'Ход не завершился за 75 секунд и был остановлен. Текст сохранен для повтора.'
        return false
      }
      const message = apiMessage(error)
      const code = (error as { data?: { code?: string } })?.data?.code
      if (code === 'SESSION_VERSION_CONFLICT' || code === 'INVENTORY_VERSION_CONFLICT') {
        await load()
        writePending(null)
      }
      errorMessage.value = message
      return false
    }
    finally {
      if (activeTurnController === controller) {
        activeTurnController = null
        clearTurnTimers()
        sending.value = false
      }
    }
  }

  function readDraft(): string {
    if (!import.meta.client || !draftKey.value)
      return ''
    return localStorage.getItem(draftKey.value) || ''
  }

  function saveDraft(value: string) {
    if (!import.meta.client || !draftKey.value)
      return
    if (value)
      localStorage.setItem(draftKey.value, value)
    else
      localStorage.removeItem(draftKey.value)
  }

  watch(sessionId, () => {
    void load()
  })

  onScopeDispose(() => {
    turnAbortReason = 'unmount'
    activeTurnController?.abort()
    activeTurnController = null
    clearTurnTimers()
  })

  return {
    session,
    startedSessions,
    loading,
    sending,
    turnElapsedSeconds,
    errorMessage,
    pendingTurn,
    load,
    loadStartedSessions,
    submit,
    cancelTurn,
    readDraft,
    saveDraft,
  }
}

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

interface StoredTurnDraft {
  schema_version: 'turn-draft@1.0'
  session_id: string
  session_version: number
  text: string
  updated_at: string
}

interface SubmitTurnInput {
  text: string
  mode: StoryMode
  selectedSuggestionId: string | null
  selectedTargetIds?: string[]
  selectedItemIds?: string[]
  selectedJournalEntryIds?: string[]
}

const SESSION_ID = /^session:[0-9a-f-]{36}$/i
const TURN_CLIENT_TIMEOUT_MS = 65_000

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
    return 'Рассказчик сейчас недоступен на этом сервере.'
  if (data?.code === 'SESSION_VERSION_CONFLICT')
    return 'История изменилась в другой вкладке. Проверь реплику и отправь ее снова.'
  if (data?.code === 'UPSTREAM_TIMEOUT')
    return 'Рассказчик не ответил вовремя. Реплика осталась здесь — попробуй снова.'
  if (data?.code === 'MODEL_FALLBACK_EXHAUSTED')
    return 'Продолжение не сложилось. Реплика осталась здесь — попробуй снова.'
  if (data?.code === 'UPSTREAM_RATE_LIMITED')
    return 'Рассказчик перегружен. Подожди немного и повтори ход.'
  return data?.message && !data.code?.startsWith('MODEL_')
    ? data.message
    : 'История не ответила. Реплика осталась здесь — попробуй снова.'
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

  function withoutLegacyJournalInjection(value: string): string {
    const normalized = value.trim()
    const matchesGeneratedReference = session.value?.journal.some(entry =>
      normalized === `Я опираюсь на запись «${entry.title}»: ${entry.summary}`)
    return matchesGeneratedReference ? '' : value
  }

  function readPending(expectedSessionVersion?: number): PendingTurn | null {
    if (!import.meta.client || !pendingKey.value)
      return null
    try {
      const raw = localStorage.getItem(pendingKey.value)
      if (!raw)
        return null
      const value = JSON.parse(raw) as PendingTurn
      const valid = value?.command?.session_id === sessionId.value
        && (expectedSessionVersion === undefined
          || value.command.expected_session_version === expectedSessionVersion)
      if (valid) {
        return {
          ...value,
          command: {
            ...value.command,
            selected_journal_entry_ids: Array.isArray(value.command.selected_journal_entry_ids)
              ? value.command.selected_journal_entry_ids
              : [],
          },
        }
      }
      localStorage.removeItem(pendingKey.value)
      return null
    }
    catch {
      localStorage.removeItem(pendingKey.value)
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
      pendingTurn.value = readPending(response.session.version)
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
    const prior = readPending(session.value.version)
    const samePayload = prior
      && prior.command.session_id === session.value.id
      && prior.command.mode === input.mode
      && prior.command.text === input.text.trim()
      && prior.command.selected_suggestion_id === input.selectedSuggestionId
      && JSON.stringify(prior.command.selected_target_ids) === JSON.stringify(input.selectedTargetIds || [])
      && JSON.stringify(prior.command.selected_item_ids) === JSON.stringify(input.selectedItemIds || [])
      && JSON.stringify(prior.command.selected_journal_entry_ids) === JSON.stringify(input.selectedJournalEntryIds || [])
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
      selected_journal_entry_ids: input.selectedJournalEntryIds || [],
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
          errorMessage.value = 'Ход остановлен. Реплика осталась здесь.'
        else if (turnAbortReason === 'deadline')
          errorMessage.value = 'Рассказчик не ответил вовремя. Реплика осталась здесь.'
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
    if (!import.meta.client || !draftKey.value || !session.value)
      return ''
    const raw = localStorage.getItem(draftKey.value)
    if (raw) {
      try {
        const draft = JSON.parse(raw) as StoredTurnDraft
        if (
          draft?.schema_version === 'turn-draft@1.0'
          && draft.session_id === session.value.id
          && draft.session_version === session.value.version
          && typeof draft.text === 'string'
        ) {
          return withoutLegacyJournalInjection(draft.text)
        }
      }
      catch {
        // Старые строковые черновики не имеют версии истории и небезопасны для восстановления.
      }
      localStorage.removeItem(draftKey.value)
    }
    return readPending(session.value.version)?.command.text || ''
  }

  function saveDraft(value: string) {
    if (
      !import.meta.client
      || !draftKey.value
      || !session.value
      || session.value.id !== sessionId.value
    ) {
      return
    }
    if (value) {
      const draft: StoredTurnDraft = {
        schema_version: 'turn-draft@1.0',
        session_id: session.value.id,
        session_version: session.value.version,
        text: value,
        updated_at: new Date().toISOString(),
      }
      localStorage.setItem(draftKey.value, JSON.stringify(draft))
    }
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

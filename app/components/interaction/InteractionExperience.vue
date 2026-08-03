<script setup lang="ts">
import { gsap } from 'gsap'
import type { SuggestedAction } from '#shared/game'
import { normalizeStoryPackId, STORY_PACKS } from '#shared/storypacks'
import type { StoryMode } from '#shared/storypacks'
import type {
  InteractionDrawer,
  InteractionFontScale,
  InteractionQueuedTurn,
  InteractionStoryModel,
  InteractionToolComposePayload,
  InteractionTurnDraft,
  InteractionToolName,
} from '~/types/interaction-ui'
import { inventoryItemIsActive, inventoryUnavailableReason } from '~/composables/useInventoryStore'

type ComposerHandle = {
  resize: () => void
  focus: () => void
  selectEnd: () => void
}

const route = useRoute()
const router = useRouter()
const pageRoot = ref<HTMLElement | null>(null)
const chatScroll = ref<HTMLElement | null>(null)
const composer = ref<ComposerHandle | null>(null)
const sessionId = computed(() => typeof route.query.session === 'string' ? route.query.session : null)
const game = useGameSession(sessionId)

const input = ref('')
const mode = ref<StoryMode>('action')
const fontScale = ref<InteractionFontScale>('large')
const devMode = import.meta.dev
const devStoryModel = ref<InteractionStoryModel>('deepseek')
const selectedSuggestionId = ref<string | null>(null)
const selectedItemIds = ref<string[]>([])
const selectedJournalEntryIds = ref<string[]>([])
const activeTool = ref<InteractionToolName | null>(null)
const openDrawer = ref<InteractionDrawer>(null)
const toast = ref('')
const queuedTurns = ref<InteractionQueuedTurn[]>([])
const activeTurn = ref<InteractionQueuedTurn | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null
let motionContext: gsap.Context | null = null
let drainingQueue = false

const story = computed(() => game.session.value
  ? STORY_PACKS[game.session.value.story_pack_id]
  : STORY_PACKS['eighth-seal'])
const themeStyle = computed(() => ({
  '--accent': story.value.theme.accent,
  '--accent-light': story.value.theme.accentLight,
  '--accent-deep': story.value.theme.accentDeep,
  '--accent-rgb': story.value.theme.accentRgb,
  '--surface-tint': story.value.theme.surfaceTint,
  '--story-font': fontScale.value === 'normal' ? '17px' : fontScale.value === 'xlarge' ? '21px' : '19px',
}))
const selectedItems = computed(() => {
  if (!game.session.value)
    return []
  return game.session.value.inventory.filter(item => selectedItemIds.value.includes(item.id))
})
const selectedJournalEntries = computed(() => {
  if (!game.session.value)
    return []
  return game.session.value.journal.filter(entry => selectedJournalEntryIds.value.includes(entry.id))
})
const playerInventoryCount = computed(() =>
  game.session.value?.inventory.filter(item =>
    (item.owner_id === 'player' || item.holder_id === 'player')
    && inventoryItemIsActive(item)).length || 0)
const queueKey = computed(() => sessionId.value ? `fabula:turn-queue:${sessionId.value}` : '')

useHead({
  title: computed(() => game.session.value
    ? `ФАБУЛА · ${game.session.value.persona.name} · ${story.value.title}`
    : 'ФАБУЛА · История'),
})

function showToast(message: string) {
  toast.value = message
  if (toastTimer)
    clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.value = '', 2200)
}

function setMode(nextMode: StoryMode) {
  mode.value = nextMode
  selectedSuggestionId.value = null
  if (import.meta.client)
    localStorage.setItem('fabula:interaction-mode', nextMode)
  composer.value?.resize()
}

function setFontScale(nextScale: InteractionFontScale) {
  fontScale.value = nextScale
  if (import.meta.client)
    localStorage.setItem('fabula:font-scale', nextScale)
  showToast(nextScale === 'normal' ? 'Размер текста: 17 px' : nextScale === 'xlarge' ? 'Размер текста: 21 px' : 'Размер текста: 19 px')
}

function setDevStoryModel(nextModel: InteractionStoryModel) {
  if (!devMode)
    return
  devStoryModel.value = nextModel
  if (import.meta.client)
    localStorage.setItem('fabula:dev-story-model', nextModel)
  showToast(nextModel === 'aion' ? 'Сюжет: Aion 3.0 Mini' : 'Сюжет: DeepSeek V4 Flash')
}

async function chooseSuggestion(suggestion: SuggestedAction) {
  input.value = suggestion.label
  setMode(suggestion.mode)
  selectedSuggestionId.value = suggestion.id
  await nextTick()
  await submitTurn()
}

function composeFromTool(payload: InteractionToolComposePayload) {
  if (payload.journalEntryId) {
    const entryExists = game.session.value?.journal.some(entry => entry.id === payload.journalEntryId)
    if (entryExists)
      selectedJournalEntryIds.value = [payload.journalEntryId]
    selectedSuggestionId.value = null
    activeTool.value = null
    nextTick(() => composer.value?.focus())
    return
  }
  if (typeof payload.text === 'string')
    input.value = payload.text
  selectedSuggestionId.value = null
  selectedItemIds.value = payload.itemId ? [payload.itemId] : []
  activeTool.value = null
  nextTick(() => composer.value?.selectEnd())
}

function removeItem(itemId: string) {
  selectedItemIds.value = selectedItemIds.value.filter(id => id !== itemId)
}

function removeJournalEntry(entryId: string) {
  selectedJournalEntryIds.value = selectedJournalEntryIds.value.filter(id => id !== entryId)
}

function editMessage(payload: { text: string, itemIds: string[], journalEntryIds: string[] }) {
  input.value = payload.text
  selectedSuggestionId.value = null
  const currentItemIds = new Set(
    game.session.value?.inventory
      .filter(item => inventoryUnavailableReason(item) === null)
      .map(item => item.id) || [],
  )
  selectedItemIds.value = payload.itemIds.filter(itemId => currentItemIds.has(itemId))
  const currentJournalEntryIds = new Set(
    game.session.value?.journal.map(entry => entry.id) || [],
  )
  selectedJournalEntryIds.value = payload.journalEntryIds.filter(entryId =>
    currentJournalEntryIds.has(entryId))
  nextTick(() => composer.value?.selectEnd())
}

function writeQueue() {
  if (!import.meta.client || !queueKey.value)
    return
  if (queuedTurns.value.length)
    localStorage.setItem(queueKey.value, JSON.stringify(queuedTurns.value))
  else
    localStorage.removeItem(queueKey.value)
}

function readQueue() {
  queuedTurns.value = []
  if (!import.meta.client || !queueKey.value)
    return
  try {
    const value = JSON.parse(localStorage.getItem(queueKey.value) || '[]') as unknown
    if (!Array.isArray(value))
      return
    queuedTurns.value = value
      .filter((entry): entry is InteractionQueuedTurn =>
        Boolean(entry)
        && typeof entry === 'object'
        && typeof (entry as InteractionQueuedTurn).id === 'string'
        && typeof (entry as InteractionQueuedTurn).text === 'string'
        && ['action', 'speech', 'exploration'].includes((entry as InteractionQueuedTurn).mode)
        && Array.isArray((entry as InteractionQueuedTurn).selectedItemIds))
      .map(entry => ({
        ...entry,
        selectedJournalEntryIds: Array.isArray(entry.selectedJournalEntryIds)
          ? entry.selectedJournalEntryIds
          : [],
      }))
      .slice(0, 8)
  }
  catch {
    queuedTurns.value = []
  }
}

function clearComposer() {
  input.value = ''
  selectedSuggestionId.value = null
  selectedItemIds.value = []
  selectedJournalEntryIds.value = []
}

function restoreTurn(turn: InteractionTurnDraft) {
  input.value = turn.text
  mode.value = turn.mode
  selectedSuggestionId.value = turn.selectedSuggestionId
  const availableItemIds = new Set(
    game.session.value?.inventory
      .filter(item => inventoryUnavailableReason(item) === null)
      .map(item => item.id) || [],
  )
  selectedItemIds.value = turn.selectedItemIds.filter(itemId => availableItemIds.has(itemId))
  const availableJournalEntryIds = new Set(
    game.session.value?.journal.map(entry => entry.id) || [],
  )
  selectedJournalEntryIds.value = turn.selectedJournalEntryIds.filter(entryId =>
    availableJournalEntryIds.has(entryId))
  nextTick(() => composer.value?.selectEnd())
}

function removeQueuedTurn(turnId: string) {
  queuedTurns.value = queuedTurns.value.filter(turn => turn.id !== turnId)
  writeQueue()
}

function editQueuedTurn(turnId: string) {
  const turn = queuedTurns.value.find(candidate => candidate.id === turnId)
  if (!turn)
    return
  const currentText = input.value.trim()
  if (currentText) {
    queuedTurns.value = queuedTurns.value.map(candidate => candidate.id === turnId
      ? {
          id: candidate.id,
          text: currentText,
          mode: mode.value,
          selectedSuggestionId: null,
          selectedItemIds: [...selectedItemIds.value],
          selectedJournalEntryIds: [...selectedJournalEntryIds.value],
        }
      : candidate)
    writeQueue()
  }
  else
    removeQueuedTurn(turnId)
  restoreTurn(turn)
}

async function copyMessage(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Текст скопирован')
  }
  catch {
    showToast('Браузер не разрешил копирование')
  }
}

function openTool(tool: InteractionToolName) {
  openDrawer.value = null
  activeTool.value = tool
}

async function executeTurn(turn: InteractionQueuedTurn): Promise<boolean> {
  activeTurn.value = turn
  const succeeded = await game.submit({
    text: turn.text,
    mode: turn.mode,
    selectedSuggestionId: turn.selectedSuggestionId,
    selectedItemIds: turn.selectedItemIds,
    selectedJournalEntryIds: turn.selectedJournalEntryIds,
    devStoryModel: devStoryModel.value,
  })
  activeTurn.value = null
  if (!succeeded) {
    if (!input.value.trim())
      restoreTurn(turn)
    else {
      queuedTurns.value.unshift({ ...turn, selectedSuggestionId: null })
      writeQueue()
    }
  }
  return succeeded
}

async function drainTurnQueue() {
  if (drainingQueue || game.sending.value || !queuedTurns.value.length)
    return
  drainingQueue = true
  try {
    while (queuedTurns.value.length && !game.sending.value) {
      const nextTurn = queuedTurns.value.shift()!
      writeQueue()
      const succeeded = await executeTurn(nextTurn)
      if (!succeeded)
        break
      showToast('Следующий ход начался')
    }
  }
  finally {
    drainingQueue = false
  }
}

async function submitTurn() {
  if (!game.session.value)
    return
  const text = input.value.trim()
  if (!text) {
    composer.value?.focus()
    return
  }
  const turn: InteractionQueuedTurn = {
    id: `queued:${globalThis.crypto.randomUUID()}`,
    text,
    mode: mode.value,
    selectedSuggestionId: selectedSuggestionId.value,
    selectedItemIds: selectedItemIds.value,
    selectedJournalEntryIds: selectedJournalEntryIds.value,
  }
  clearComposer()
  if (game.sending.value || activeTurn.value) {
    if (queuedTurns.value.length >= 8) {
      restoreTurn(turn)
      showToast('В очереди уже восемь ходов')
      return
    }
    queuedTurns.value.push({ ...turn, selectedSuggestionId: null })
    writeQueue()
    showToast('Ход добавлен следующим')
    nextTick(() => composer.value?.focus())
    return
  }
  const succeeded = await executeTurn(turn)
  if (succeeded) {
    showToast(queuedTurns.value.length ? 'Продолжаем по очереди' : 'История продолжилась')
    await drainTurnQueue()
    nextTick(() => composer.value?.focus())
  }
  else
    composer.value?.focus()
}

function openSession(nextSessionId: string) {
  if (nextSessionId === sessionId.value) {
    openDrawer.value = null
    return
  }
  openDrawer.value = null
  return router.push({ path: '/interaction', query: { session: nextSessionId } })
}

function startNewStory() {
  return router.push('/app')
}

async function resolveInitialRoute() {
  await game.load()
  if (game.session.value || game.errorMessage.value)
    return

  const legacyStory = normalizeStoryPackId(route.query.story)
  if (legacyStory) {
    await router.replace(`/story/${legacyStory}`)
    return
  }
  const lastSession = game.startedSessions.value[0]
  if (lastSession) {
    await router.replace({ path: '/interaction', query: { session: lastSession.id } })
    return
  }
  await router.replace('/app')
}

function scrollToLatest(animate = false) {
  nextTick(() => {
    const container = chatScroll.value
    if (!container)
      return
    const elements = container.querySelectorAll<HTMLElement>('[data-interaction-message]')
    const last = elements[elements.length - 1]
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (animate && last && motionContext && !reducedMotion) {
      motionContext.add(() => {
        gsap.fromTo(last, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
      })
    }
    container.scrollTop = container.scrollHeight
  })
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
    event.preventDefault()
    composer.value?.focus()
  }
  if (event.key === 'Escape') {
    openDrawer.value = null
    activeTool.value = null
  }
}

watch(input, (value) => {
  game.saveDraft(value)
  const selected = game.session.value?.suggestions.find(item => item.id === selectedSuggestionId.value)
  if (selected && value !== selected.label)
    selectedSuggestionId.value = null
})

watch(() => game.session.value?.id, (nextId, previousId) => {
  if (!nextId || nextId === previousId)
    return
  input.value = game.readDraft()
  readQueue()
  selectedSuggestionId.value = null
  selectedItemIds.value = []
  selectedJournalEntryIds.value = []
  activeTool.value = null
  scrollToLatest()
})

watch(() => game.session.value?.messages.length, (length, previousLength) => {
  if (length && previousLength && length > previousLength)
    scrollToLatest(true)
})

watch(() => game.sending.value, (sending) => {
  if (sending)
    scrollToLatest()
})

onMounted(async () => {
  const savedMode = localStorage.getItem('fabula:interaction-mode') as StoryMode | null
  if (savedMode && ['action', 'speech', 'exploration'].includes(savedMode))
    mode.value = savedMode
  const savedFontScale = localStorage.getItem('fabula:font-scale') as InteractionFontScale | null
  if (savedFontScale && ['normal', 'large', 'xlarge'].includes(savedFontScale))
    fontScale.value = savedFontScale
  if (devMode) {
    const savedStoryModel = localStorage.getItem('fabula:dev-story-model') as InteractionStoryModel | null
    if (savedStoryModel && ['deepseek', 'aion'].includes(savedStoryModel))
      devStoryModel.value = savedStoryModel
  }
  if (pageRoot.value)
    motionContext = gsap.context(() => {}, pageRoot.value)
  window.addEventListener('keydown', onKeydown)
  await resolveInitialRoute()
  if (game.session.value) {
    input.value = game.readDraft()
    readQueue()
    scrollToLatest()
  }
})

onBeforeUnmount(() => {
  motionContext?.revert()
  window.removeEventListener('keydown', onKeydown)
  if (toastTimer)
    clearTimeout(toastTimer)
})
</script>

<template>
  <main
    ref="pageRoot"
    :style="themeStyle"
    class="fixed inset-0 overflow-hidden bg-[#090a0d] text-fabula-100 [background-image:radial-gradient(circle_at_65%_0%,rgb(var(--accent-rgb)/.06),transparent_34%)]"
  >
    <header class="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 bg-[#0b0c0f] px-3 sm:px-5">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="grid size-10 place-items-center rounded-xl border border-white/10 text-[18px] text-fabula-300 min-[900px]:hidden"
          aria-label="Открыть начатые истории"
          @click="openDrawer = 'threads'"
        >
          ☰
        </button>
        <NuxtLink to="/app" class="hidden font-display text-[17px] tracking-[.14em] text-fabula-gold-light no-underline sm:block">ФАБУЛА</NuxtLink>
      </div>

      <div class="min-w-0 text-center sm:text-left">
        <strong class="block truncate font-display text-[17px] font-normal">{{ game.session.value ? story.title : 'Загружаем историю' }}</strong>
        <span v-if="game.session.value" class="block truncate text-[11px] text-[#9b9ba6]">
          {{ game.session.value.persona.name }} · {{ game.session.value.scene.title }}
        </span>
      </div>

      <div class="flex items-center gap-1 min-[1180px]:hidden">
        <button
          v-for="tool in [
            { id: 'inventory', label: 'Инвентарь' },
            { id: 'journal', label: 'Журнал' },
            { id: 'world', label: 'Мир' },
          ]"
          :key="tool.id"
          type="button"
          class="grid size-10 place-items-center rounded-xl text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          :aria-label="tool.label"
          :title="tool.label"
          @click="openTool(tool.id as InteractionToolName)"
        >
          <InteractionToolIcon :tool="tool.id as InteractionToolName" class="size-[23px]" />
        </button>
      </div>
    </header>

    <div v-if="game.loading.value" class="grid h-[calc(100dvh-64px)] place-items-center px-6 text-center">
      <div>
        <span class="text-[22px] text-[var(--accent)]" aria-hidden="true">✦</span>
        <p class="mt-3 font-display text-[20px] text-fabula-100">Восстанавливаем ветку</p>
        <p class="mt-1 text-[14px] text-[#9b9ba6]">Загружаем сцену, журнал и предметы.</p>
      </div>
    </div>

    <div v-else-if="!game.session.value" class="grid h-[calc(100dvh-64px)] place-items-center px-6 text-center">
      <div class="max-w-[520px]">
        <h1 class="font-display text-[24px] text-fabula-100">История недоступна</h1>
        <p class="mt-2 text-[15px] leading-relaxed text-fabula-300">{{ game.errorMessage.value || 'Выбери одну из сохраненных веток или начни новую.' }}</p>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" class="min-h-11 rounded-xl bg-[var(--accent)] px-4 font-display text-[14px] text-[#101114]" @click="game.load()">Повторить</button>
          <NuxtLink to="/app" class="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 font-display text-[14px] text-fabula-300 no-underline">К историям</NuxtLink>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="grid h-[calc(100dvh-64px)] min-h-0 grid-cols-1 min-[900px]:grid-cols-[240px_minmax(0,1fr)] min-[1180px]:grid-cols-[240px_minmax(0,1fr)_84px]">
        <InteractionThreadRail
          :sessions="game.startedSessions.value"
          :current-session-id="game.session.value.id"
          :open="openDrawer === 'threads'"
          @close="openDrawer = null"
          @select-session="openSession"
          @new-story="startNewStory"
        />

        <section class="flex min-h-0 min-w-0 flex-col bg-[#101115]" aria-label="Диалог истории">
          <header class="flex shrink-0 items-center justify-between gap-4 border-b border-white/8 px-4 py-2.5 sm:px-6">
            <div class="min-w-0">
              <p class="truncate font-interface text-[10px] uppercase tracking-[.12em] text-[var(--accent-light)]">
                {{ game.session.value.scene.location_name }} · {{ game.session.value.scene.story_time }}
              </p>
              <p class="mt-0.5 truncate text-[13px] text-[#9b9ba6]">{{ game.session.value.scene.objective }}</p>
            </div>
            <button
              type="button"
              class="grid size-9 shrink-0 place-items-center rounded-xl text-[17px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              aria-label="Настройки текста"
              title="Настройки текста"
              @click="openTool('settings')"
            >
              Aa
            </button>
          </header>

          <div v-if="game.errorMessage.value" role="alert" class="flex shrink-0 items-start gap-2 border-b border-red-300/15 bg-red-300/[.045] px-4 py-2.5 text-[13px] leading-relaxed text-red-100 sm:px-6">
            <span aria-hidden="true">!</span>
            <span>{{ game.errorMessage.value }}</span>
          </div>

          <div
            ref="chatScroll"
            class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 [scrollbar-width:thin] sm:px-6"
            aria-live="polite"
          >
            <div class="mx-auto w-full max-w-[860px] space-y-3">
              <InteractionMessage
                v-for="message in game.session.value.messages"
                :key="message.id"
                :message="message"
                @copy="copyMessage"
                @edit="editMessage"
              />

              <InteractionGenerationStatus
                v-if="game.sending.value"
                :intent="game.pendingTurn.value?.command.text || input"
                :mode="game.pendingTurn.value?.command.mode || mode"
                :persona-name="game.session.value.persona.name"
                @cancel="game.cancelTurn()"
              />
            </div>
          </div>

          <InteractionComposer
            ref="composer"
            v-model="input"
            :mode="mode"
            :turn-pending="game.sending.value"
            :pending-intent="activeTurn?.text || game.pendingTurn.value?.command.text || ''"
            :queued-turns="queuedTurns"
            :suggestions="game.session.value.suggestions"
            :selected-suggestion-id="selectedSuggestionId"
            :selected-items="selectedItems"
            :selected-journal-entries="selectedJournalEntries"
            :inventory-count="playerInventoryCount"
            :journal-count="game.session.value.journal.length"
            @set-mode="setMode"
            @choose-suggestion="chooseSuggestion"
            @remove-item="removeItem"
            @remove-journal-entry="removeJournalEntry"
            @submit="submitTurn"
            @cancel="game.cancelTurn()"
            @edit-queued="editQueuedTurn"
            @remove-queued="removeQueuedTurn"
            @open-tool="openTool"
          />
        </section>

        <InteractionActionRail
          :inventory-count="playerInventoryCount"
          :journal-count="game.session.value.journal.length"
          :active-tool="activeTool"
          @open-tool="openTool"
        />
      </div>

      <button
        v-if="openDrawer"
        type="button"
        class="fixed inset-0 top-16 z-50 bg-black/70 min-[900px]:hidden"
        aria-label="Закрыть список историй"
        @click="openDrawer = null"
      />

      <InteractionToolModal
        :active-tool="activeTool"
        :session="game.session.value"
        :font-scale="fontScale"
        :dev-mode="devMode"
        :dev-story-model="devStoryModel"
        @close="activeTool = null"
        @compose="composeFromTool"
        @open-tool="openTool"
        @set-font-scale="setFontScale"
        @set-dev-story-model="setDevStoryModel"
      />
    </template>

    <div
      class="pointer-events-none fixed bottom-4 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-[rgb(var(--accent-rgb)/.4)] bg-[#17191eef] px-4 py-2 font-interface text-[11px] text-[var(--accent-light)] shadow-xl transition"
      :class="toast ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'"
      role="status"
      aria-live="polite"
    >
      {{ toast }}
    </div>
  </main>
</template>

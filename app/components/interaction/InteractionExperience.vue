<script setup lang="ts">
import { gsap } from 'gsap'
import { interactionConfig } from '~/data/interaction'
import { interactionTools } from '~/data/interaction-tools'
import type {
  AiCatalog,
  InteractionDrawer,
  InteractionFontScale,
  InteractionMessageData,
  InteractionMode,
  InteractionStoryId,
  InteractionToolName,
} from '~/types/interaction-ui'

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
const storyIds = Object.keys(interactionConfig.storyPacks) as InteractionStoryId[]
const requestedStory = String(route.query.story || 'fant') as InteractionStoryId
const storyId = ref<InteractionStoryId>(storyIds.includes(requestedStory) ? requestedStory : 'fant')
const mode = ref<InteractionMode>('action')
const fontScale = ref<InteractionFontScale>('large')
const messages = ref<InteractionMessageData[]>([...interactionConfig.storyPacks[storyId.value].messages] as InteractionMessageData[])
const input = ref('')
const turnPending = ref(false)
const activeTool = ref<InteractionToolName | null>(null)
const openDrawer = ref<InteractionDrawer>(null)
const toast = ref('')
const aiCatalog = ref<AiCatalog | null>(null)
const catalogPending = ref(false)
const sessionStates = new Map<InteractionStoryId, { sessionId: string, version: number }>()
let toastTimer: ReturnType<typeof setTimeout> | null = null
let requestController: AbortController | null = null
let motionContext: gsap.Context | null = null

const story = computed(() => interactionConfig.storyPacks[storyId.value])
type ThemeId = keyof typeof interactionConfig.themes
const themeForStory = (id: InteractionStoryId) => interactionConfig.themes[interactionConfig.storyPacks[id].themeId as ThemeId]
const theme = computed(() => themeForStory(storyId.value))
const tools = computed(() => interactionTools[storyId.value])
const themeStyle = computed(() => ({
  '--accent': theme.value.accent,
  '--accent-light': theme.value.accentLight,
  '--accent-deep': theme.value.accentDeep,
  '--accent-soft': theme.value.accentSoft,
  '--theme-glow': theme.value.glow,
  '--player-surface': theme.value.playerSurface,
}))
const modeCopy = computed(() => ({
  action: ['Опиши действие, речь или исследование', 'Что ты делаешь?'],
  speech: ['Говори от лица своего персонажа', 'Что ты говоришь?'],
  exploration: ['Опиши, что именно ты проверяешь вокруг', 'Что ты исследуешь?'],
})[mode.value])
const messageScaleClass = computed(() => ({
  normal: 'text-[.9rem]',
  large: 'text-base',
  xlarge: 'text-lg',
})[fontScale.value])

useHead({
  title: computed(() => `ФАБУЛА · ${story.value.title}`),
})

function newSession(storyKey: InteractionStoryId) {
  const state = {
    sessionId: `session:${globalThis.crypto?.randomUUID?.() || `local-${Date.now()}`}`,
    version: 0,
  }
  sessionStates.set(storyKey, state)
  return state
}

function currentSession() {
  return sessionStates.get(storyId.value) || newSession(storyId.value)
}

function showToast(message: string) {
  toast.value = message
  if (toastTimer)
    clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.value = '', 2200)
}

function resizeInput() {
  composer.value?.resize()
}

function switchStory(nextStoryId: InteractionStoryId) {
  if (turnPending.value) {
    showToast('Дождись завершения текущего хода')
    return
  }
  storyId.value = nextStoryId
  messages.value = [...interactionConfig.storyPacks[nextStoryId].messages] as InteractionMessageData[]
  openDrawer.value = null
  void router.replace({ query: { ...route.query, story: nextStoryId } })
  showToast(`Открыта история: ${interactionConfig.storyPacks[nextStoryId].title}`)
}

function setMode(nextMode: InteractionMode) {
  mode.value = nextMode
  if (import.meta.client)
    localStorage.setItem('fabula-interaction-mode', nextMode)
  resizeInput()
}

function setFontScale(nextScale: InteractionFontScale) {
  fontScale.value = nextScale
  if (import.meta.client)
    localStorage.setItem('fabula-font-scale', nextScale)
  showToast(nextScale === 'normal' ? 'Обычный размер текста' : nextScale === 'xlarge' ? 'Очень крупный размер текста' : 'Крупный размер текста')
}

function openTool(tool: InteractionToolName) {
  openDrawer.value = null
  activeTool.value = tool
  if (tool === 'models')
    void loadCatalog()
}

function closeTool() {
  activeTool.value = null
}

function compose(text: string) {
  input.value = text
  closeTool()
  resizeInput()
  composer.value?.focus()
  showToast('Добавлено в поле хода')
}

function editMessage(text: string) {
  input.value = text
  resizeInput()
  composer.value?.selectEnd()
  showToast('Ход загружен в поле ввода')
}

async function copyMessage(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('Текст сообщения скопирован')
  }
  catch {
    showToast('Браузер не разрешил копирование')
  }
}

async function loadCatalog() {
  if (catalogPending.value)
    return
  catalogPending.value = true
  try {
    aiCatalog.value = await $fetch<AiCatalog>('/api/ai/catalog')
  }
  catch {
    aiCatalog.value = null
  }
  finally {
    catalogPending.value = false
  }
}

async function fetchTurn(request: ReturnType<typeof interactionConfig.makeTurnRequest>) {
  requestController?.abort()
  requestController = new AbortController()
  const timeout = setTimeout(() => requestController?.abort(), 390_000)
  try {
    return await fetch('/api/ai/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
      signal: requestController.signal,
    })
  }
  finally {
    clearTimeout(timeout)
  }
}

async function submitTurn() {
  if (turnPending.value) {
    showToast('Предыдущий ход еще выполняется')
    return
  }
  const text = input.value.trim()
  if (!text) {
    composer.value?.focus()
    showToast('Сначала опиши свое намерение')
    return
  }

  const requestStoryId = storyId.value
  const session = currentSession()
  const request = interactionConfig.makeTurnRequest({
    text,
    mode: mode.value,
    storyId: requestStoryId,
    sessionId: session.sessionId,
    sessionVersion: session.version,
  })
  messages.value.push({
    type: 'player',
    name: 'Ты',
    meta: mode.value === 'speech' ? 'Речь · только что' : mode.value === 'exploration' ? 'Исследование · только что' : 'Действие · только что',
    text,
    foot: 'Отправлено серверному движку',
  })
  input.value = ''
  turnPending.value = true
  resizeInput()

  try {
    let response = await fetchTurn(request)
    let payload = await response.json().catch(() => null)
    if (response.status === 409 && payload?.code === 'SESSION_VERSION_CONFLICT') {
      const reset = newSession(requestStoryId)
      request.session_id = reset.sessionId
      request.expected_session_version = 0
      response = await fetchTurn(request)
      payload = await response.json().catch(() => null)
    }
    if (!response.ok || payload?.schema_version !== 'turn-response@1.0' || typeof payload?.turn?.narrative_text !== 'string')
      throw Object.assign(new Error(payload?.message || 'Сервер не вернул безопасный ход'), { code: payload?.code || 'INVALID_SERVER_RESPONSE' })
    if (storyId.value !== requestStoryId)
      throw Object.assign(new Error('История была переключена во время хода'), { code: 'STORY_CHANGED' })

    sessionStates.set(requestStoryId, { sessionId: request.session_id, version: payload.session_version })
    messages.value.push({
      type: 'narrator',
      name: 'Рассказчик',
      meta: `${payload.fallback_used ? 'Резервная модель' : 'Авторитетный preview-ход'} · ${payload.turn.resolution.outcome}`,
      text: payload.turn.narrative_text || payload.turn.resolution.summary,
      foot: `Preview-сессия v${payload.session_version} · память процесса, без production-канона`,
    })
    showToast(payload.fallback_used ? 'Ход получен через резервную модель' : 'Ход подтвержден preview-сервером')
  }
  catch (error) {
    const typedError = error as Error & { code?: string }
    const aborted = typedError.name === 'AbortError'
    const message = aborted ? 'Сервер не успел завершить ход.' : typedError.message || 'Не удалось получить ход.'
    messages.value.push({
      type: 'narrator',
      name: 'Системный контур',
      meta: 'Ход не применен',
      text: message,
      foot: `Код: ${aborted ? 'CLIENT_TIMEOUT' : typedError.code || 'NETWORK_ERROR'} · текст возвращен в поле`,
      pending: true,
    })
    input.value = text
    resizeInput()
    composer.value?.focus()
    showToast('Ход не применен')
  }
  finally {
    turnPending.value = false
    requestController = null
  }
}

function rewriteComposer() {
  const text = input.value.trim()
  if (!text) {
    showToast('Сначала напиши текст для локального варианта')
    return
  }
  input.value = text.replace(/Я /, 'Я внимательно ').replace(/спрашиваю/g, 'пытаюсь выяснить')
  if (input.value === text)
    input.value = `Иначе это звучит так: ${text.charAt(0).toLowerCase()}${text.slice(1)}`
  resizeInput()
  showToast('Локальный пример: модель не вызывалась')
}

function newScene() {
  input.value = ''
  composer.value?.focus()
  showToast('Preview: создание новой сцены пока не подключено')
}

function searchScenes() {
  composer.value?.focus()
  showToast('Поиск сцен подключится к истории сессий')
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    composer.value?.focus()
  }
  if (event.key === 'Escape') {
    openDrawer.value = null
    closeTool()
  }
}

watch(() => messages.value.length, async () => {
  await nextTick()
  const elements = chatScroll.value?.querySelectorAll<HTMLElement>('[data-interaction-message]')
  const lastMessage = elements?.[elements.length - 1]
  if (lastMessage && motionContext)
    motionContext.add(() => gsap.fromTo(lastMessage, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.42, ease: 'power2.out' }))
  chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })
})

onMounted(() => {
  const savedMode = localStorage.getItem('fabula-interaction-mode') as InteractionMode | null
  const savedFontScale = localStorage.getItem('fabula-font-scale') as InteractionFontScale | null
  if (savedMode && ['action', 'speech', 'exploration'].includes(savedMode))
    mode.value = savedMode
  if (savedFontScale && ['normal', 'large', 'xlarge'].includes(savedFontScale))
    fontScale.value = savedFontScale
  if (pageRoot.value)
    motionContext = gsap.context(() => {}, pageRoot.value)
  window.addEventListener('keydown', onKeydown)
  resizeInput()
  nextTick(() => {
    if (chatScroll.value)
      chatScroll.value.scrollTop = chatScroll.value.scrollHeight
  })
})

onBeforeUnmount(() => {
  requestController?.abort()
  motionContext?.revert()
  window.removeEventListener('keydown', onKeydown)
  if (toastTimer)
    clearTimeout(toastTimer)
})
</script>

<template>
  <main
    ref="pageRoot"
    class="fixed inset-0 overflow-hidden bg-[#0a0a0d] text-fabula-100"
    :data-story="storyId"
    :data-theme="story.themeId"
    :data-font-size="fontScale"
    :style="themeStyle"
  >
    <header class="grid h-[70px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/10 bg-[#0d0d11] px-4 min-[600px]:gap-5 min-[600px]:px-[clamp(16px,2vw,26px)]">
      <NuxtLink class="font-display text-[17px] tracking-[.12em] text-fabula-gold-light no-underline min-[600px]:text-[22px] min-[600px]:tracking-[.16em]" to="/app" aria-label="Вернуться в ФАБУЛУ">ФАБУЛА</NuxtLink>
      <div class="flex min-w-0 items-center gap-3">
        <span class="hidden font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500 min-[900px]:inline">{{ story.eyebrow }}</span>
        <strong class="truncate font-display text-[15px] font-normal min-[600px]:text-[18px]">{{ story.title }}</strong>
      </div>
      <div class="flex items-center gap-1.5 min-[600px]:gap-2">
        <span class="hidden items-center gap-2 font-interface text-[8px] text-fabula-300 min-[900px]:flex"><i class="size-1.5 rounded-full bg-[#8fcd78] shadow-[0_0_8px_#8fcd78]" />Сессия сохранена</span>
        <button type="button" class="grid size-9 place-items-center rounded-xl border border-white/10 min-[600px]:size-10 min-[761px]:hidden" aria-label="Открыть чаты" @click="openDrawer = 'threads'">☰</button>
        <button type="button" class="grid size-9 place-items-center rounded-xl border border-white/10 min-[600px]:size-10" aria-label="Открыть контур моделей" @click="openTool('models')">⌘</button>
        <button type="button" class="grid size-9 place-items-center rounded-xl border border-white/10 min-[600px]:size-10 min-[1181px]:hidden" aria-label="Открыть состояние мира" @click="openDrawer = 'details'">◈</button>
      </div>
    </header>

    <div class="grid h-[calc(100dvh-70px)] min-h-0 grid-cols-1 min-[761px]:grid-cols-[296px_minmax(0,1fr)] min-[1181px]:grid-cols-[296px_minmax(520px,1fr)_350px]">
      <InteractionThreadRail
        :story-id="storyId"
        :story-ids="storyIds"
        :open="openDrawer === 'threads'"
        @close="openDrawer = null"
        @switch-story="switchStory"
        @open-tool="openTool"
        @new-scene="newScene"
        @search="searchScenes"
      />

      <section class="flex min-h-0 min-w-0 flex-col bg-[radial-gradient(90%_45%_at_50%_0%,var(--theme-glow),transparent_70%),#101014]" aria-label="Диалог с персонажем">
        <header class="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#111116] px-[clamp(14px,3vw,28px)] py-3">
          <div class="flex min-w-0 items-center gap-3">
            <img class="size-10 shrink-0 rounded-xl border border-[var(--accent)] object-cover" src="/assets/avatar.jpg" alt="Портрет персонажа">
            <span class="min-w-0"><strong class="block truncate font-display text-[18px] font-normal">{{ story.character }}</strong><small class="flex items-center gap-1.5 truncate font-interface text-[8px] text-fabula-500"><i class="size-1.5 rounded-full bg-[#8fcd78]" />В сцене · {{ story.location }}</small></span>
          </div>
          <div class="flex items-center gap-2"><span class="flex items-center gap-1.5 rounded-full border border-[#8fcd78]/30 bg-[#8fcd78]/[.06] px-2.5 py-1.5 font-interface text-[7px] text-[#8fcd78] sm:px-3 sm:text-[8px]"><i class="size-1.5 rounded-full bg-[#8fcd78]" />{{ turnPending ? 'Ход собирается' : 'Твой ход' }}</span><button type="button" class="hidden size-9 place-items-center rounded-xl border border-white/10 sm:grid" aria-label="Открыть настройки сцены" @click="openTool('settings')">⚙</button></div>
        </header>

        <div class="flex shrink-0 items-center gap-3 border-b border-white/10 bg-[var(--accent-soft)] px-[clamp(14px,3vw,28px)] py-2.5" role="status">
          <span class="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--accent)]/50 text-[var(--accent-light)]">✦</span>
          <span class="min-w-0 flex-1"><strong class="block font-display text-[15px] font-normal">Сцена 02 · preview</strong><small class="block truncate font-interface text-[7px] text-fabula-500">Ходы живут только в памяти процесса и не записываются в production-канон</small></span>
          <button type="button" class="font-interface text-[8px] text-[var(--accent-light)]" @click="openTool('models')">Контур хода ›</button>
        </div>

        <section class="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-b border-white/10 bg-[linear-gradient(90deg,var(--accent-soft),transparent)] px-[clamp(14px,3vw,28px)] py-3 min-[700px]:grid-cols-[auto_1fr_200px]" aria-live="polite" aria-label="Сюжетный контекст">
          <span class="grid size-9 place-items-center rounded-xl border border-[var(--accent)]/50 bg-[var(--accent-soft)] text-[var(--accent-light)]">{{ theme.icon }}</span>
          <div class="min-w-0"><span class="font-interface text-[7px] uppercase tracking-[.1em] text-[var(--accent)]">{{ theme.label }}</span><strong class="block truncate font-display text-[17px] font-normal">{{ story.title }}</strong><p class="truncate text-sm text-fabula-300">{{ story.premise }}</p></div>
          <div class="hidden border-l border-white/10 pl-3 min-[700px]:block"><span class="font-interface text-[7px] text-fabula-500">СТАВКА</span><strong class="block font-display text-[14px] font-normal text-[var(--accent-light)]">{{ story.stake }}</strong></div>
        </section>

        <div ref="chatScroll" class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[clamp(14px,5vw,58px)] py-5 [scrollbar-width:thin]" :class="messageScaleClass" aria-live="polite">
          <div class="flex items-center gap-3 font-interface text-[7px] uppercase tracking-[.1em] text-fabula-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10"><span>СЕГОДНЯ · 21:14</span></div>
          <InteractionMessage
            v-for="(message, index) in messages"
            :key="message.id || `${storyId}-${index}-${message.meta}`"
            :message="message"
            @copy="copyMessage"
            @edit="editMessage"
            @variant="showToast('Локальный пример: модель не вызывалась')"
          />
          <div v-if="turnPending" class="self-start rounded-xl border border-dashed border-white/15 bg-[#131316] px-4 py-3 font-interface text-[8px] text-fabula-500">
            <span class="mr-2 tracking-[.2em] text-[var(--accent)]">● ● ●</span>Проверяю контекст и собираю ход через OpenRouter
          </div>
        </div>

        <InteractionComposer
          ref="composer"
          v-model="input"
          :mode="mode"
          :turn-pending="turnPending"
          :mode-copy="modeCopy"
          @set-mode="setMode"
          @submit="submitTurn"
          @open-tool="openTool"
          @rewrite="rewriteComposer"
          @compose="compose"
        />
      </section>

      <InteractionDetailRail
        :story="story"
        :story-id="storyId"
        :story-ids="storyIds"
        :theme="theme"
        :open="openDrawer === 'details'"
        @close="openDrawer = null"
        @switch-story="switchStory"
        @open-tool="openTool"
      />
    </div>

    <button v-if="openDrawer" type="button" class="fixed inset-0 z-50 bg-black/70 min-[1181px]:hidden" aria-label="Закрыть боковую панель" @click="openDrawer = null" />
    <InteractionToolModal
      :active-tool="activeTool"
      :story="story"
      :tools="tools"
      :ai-catalog="aiCatalog"
      :catalog-pending="catalogPending"
      :font-scale="fontScale"
      @close="closeTool"
      @compose="compose"
      @toast="showToast"
      @open-tool="openTool"
      @set-font-scale="setFontScale"
    />

    <div class="pointer-events-none fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-[var(--accent)]/45 bg-[#17171dee] px-4 py-2 font-interface text-[8px] text-[var(--accent-light)] shadow-xl transition" :class="toast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'" role="status" aria-live="polite">
      {{ toast }}
    </div>
  </main>
</template>

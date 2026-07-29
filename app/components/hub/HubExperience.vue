<script setup lang="ts">
import { gsap } from 'gsap'
import type { GameSessionSummary, ListGameSessionsResponse } from '#shared/game'
import type { HubScreenName, HubStoryId } from '~/types/hub'

const router = useRouter()
const pageRoot = ref<HTMLElement | null>(null)
const activeScreen = ref<HubScreenName>('home')
const sessions = ref<GameSessionSummary[]>([])
const loading = ref(true)
let motionContext: gsap.Context | null = null

const currentSessionId = computed(() => sessions.value[0]?.id || null)

async function loadSessions() {
  loading.value = true
  try {
    const response = await $fetch<ListGameSessionsResponse>('/api/game/sessions')
    sessions.value = response.sessions
  }
  catch {
    sessions.value = []
  }
  finally {
    loading.value = false
  }
}

function go(screen: HubScreenName) {
  activeScreen.value = screen
}

function openStory(storyId: HubStoryId) {
  return router.push(`/story/${storyId}`)
}

function openSession(sessionId: string) {
  return router.push({ path: '/interaction', query: { session: sessionId } })
}

watch(activeScreen, async () => {
  await nextTick()
  const screen = pageRoot.value?.querySelector<HTMLElement>('[data-hub-screen]')
  if (screen && motionContext)
    motionContext.add(() => gsap.fromTo(screen, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }))
})

onMounted(() => {
  if (pageRoot.value)
    motionContext = gsap.context(() => {}, pageRoot.value)
  void loadSessions()
})

onBeforeUnmount(() => motionContext?.revert())
</script>

<template>
  <main ref="pageRoot" class="fixed inset-0 overflow-hidden bg-[#0b0906] text-[#e9dfc9]">
    <HubHomeScreen
      v-if="activeScreen === 'home'"
      :sessions="sessions"
      :loading="loading"
      @open-story="openStory"
      @open-session="openSession"
    />
    <HubPacksScreen
      v-else-if="activeScreen === 'packs'"
      @open-story="openStory"
    />
    <HubProfileScreen
      v-else
      :sessions="sessions"
      :loading="loading"
      @open-session="openSession"
      @browse-packs="go('packs')"
    />

    <HubNavigation
      :active-screen="activeScreen"
      :current-session-id="currentSessionId"
      @navigate="go"
    />

    <svg class="pointer-events-none fixed inset-0 z-[2] h-full w-full opacity-[.05] mix-blend-overlay" aria-hidden="true">
      <filter id="hub-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /></filter>
      <rect width="100%" height="100%" filter="url(#hub-noise)" />
    </svg>
  </main>
</template>

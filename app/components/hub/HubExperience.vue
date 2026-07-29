<script setup lang="ts">
import { gsap } from 'gsap'
import { interactionConfig } from '~/data/interaction'
import type { HubScreenName, HubSheetView, HubStoryId, HubToolName } from '~/types/hub'

const pageRoot = ref<HTMLElement | null>(null)
const activeScreen = ref<HubScreenName>('home')
const soundEnabled = ref(false)
const selectedStoryId = ref<HubStoryId>('fant')
const readerOpen = ref(false)
const readerStep = ref(0)
const selectedChoice = ref<string | null>(null)
const sheetView = ref<HubSheetView>(null)
const drawerOpen = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
let motionContext: gsap.Context | null = null

const stories = interactionConfig.storyPacks
const selectedStory = computed(() => stories[selectedStoryId.value])
const choices = [
  'Пойти к деревне - там могут быть выжившие.',
  'Ступить на мост навстречу незнакомцу.',
  'Расспросить хранителя, кто ты такой.',
]

function showToast(message: string) {
  toastMessage.value = message
  if (toastTimer)
    clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toastMessage.value = '', 2200)
}

function go(screen: HubScreenName) {
  activeScreen.value = screen
}

function openStory(storyId: HubStoryId) {
  selectedStoryId.value = storyId
  sheetView.value = 'story'
}

function startStory() {
  sheetView.value = null
  readerStep.value = 0
  selectedChoice.value = null
  readerOpen.value = true
}

function closeReader() {
  readerOpen.value = false
  drawerOpen.value = false
}

function openTool(tool: HubToolName) {
  drawerOpen.value = false
  sheetView.value = tool
}

function openInventory() {
  sheetView.value = null
  readerOpen.value = false
  activeScreen.value = 'inventory'
}

function chooseReader(choice: string) {
  selectedChoice.value = choice
  showToast('Выбор сохранен в локальной демо-сцене')
}

watch(activeScreen, async () => {
  await nextTick()
  const screen = pageRoot.value?.querySelector<HTMLElement>('[data-hub-screen]')
  if (screen && motionContext)
    motionContext.add(() => gsap.fromTo(screen, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }))
})

watch(readerStep, async () => {
  await nextTick()
  const messages = pageRoot.value?.querySelectorAll<HTMLElement>('[data-reader-message]')
  const message = messages?.[messages.length - 1]
  if (message && motionContext)
    motionContext.add(() => gsap.fromTo(message, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }))
})

onMounted(() => {
  if (pageRoot.value)
    motionContext = gsap.context(() => {}, pageRoot.value)
})

onBeforeUnmount(() => {
  motionContext?.revert()
  if (toastTimer)
    clearTimeout(toastTimer)
})
</script>

<template>
  <main ref="pageRoot" class="fixed inset-0 overflow-hidden bg-[#0b0906] text-[#e9dfc9]">
    <HubHomeScreen v-if="activeScreen === 'home'" @open-story="openStory" />
    <HubPacksScreen v-else-if="activeScreen === 'packs'" @open-story="openStory" />
    <HubInventoryScreen v-else-if="activeScreen === 'inventory'" @toast="showToast" />
    <HubProfileScreen v-else @open-story="openStory" />

    <button
      type="button"
      class="fixed right-3 top-[max(12px,env(safe-area-inset-top))] z-[52] grid size-[34px] place-items-center rounded-[10px] border border-[#d9a94a2e] bg-black/65 text-[15px] text-fabula-gold-light backdrop-blur min-[900px]:right-[30px] min-[900px]:top-[26px]"
      :aria-label="soundEnabled ? 'Выключить звук' : 'Включить звук'"
      @click="soundEnabled = !soundEnabled"
    >
      {{ soundEnabled ? '🔊' : '🔇' }}
    </button>

    <HubNavigation v-if="!readerOpen" :active-screen="activeScreen" @navigate="go" />
    <HubReader
      v-else
      :story-id="selectedStoryId"
      :story="selectedStory"
      :step="readerStep"
      :selected-choice="selectedChoice"
      :choices="choices"
      @open-menu="drawerOpen = true"
      @open-tool="openTool"
      @advance="readerStep++"
      @choose="chooseReader"
    />

    <HubDrawer
      :open="drawerOpen"
      :story-title="selectedStory.title"
      @close="drawerOpen = false"
      @open-tool="openTool"
      @exit="closeReader"
    />
    <HubSheet
      :view="sheetView"
      :story="selectedStory"
      @close="sheetView = null"
      @start="startStory"
      @open-inventory="openInventory"
    />

    <p
      role="status"
      class="pointer-events-none fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-[#a97a2c] bg-[#1a1206ee] px-[18px] py-2.5 font-display text-[13px] text-fabula-gold-light transition"
      :class="toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'"
    >
      {{ toastMessage }}
    </p>
    <svg class="pointer-events-none fixed inset-0 z-[2] h-full w-full opacity-[.06] mix-blend-overlay" aria-hidden="true">
      <filter id="hub-noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" /></filter>
      <rect width="100%" height="100%" filter="url(#hub-noise)" />
    </svg>
  </main>
</template>

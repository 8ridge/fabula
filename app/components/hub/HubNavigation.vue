<script setup lang="ts">
import type { HubScreenName } from '~/types/hub'

const props = defineProps<{
  activeScreen: HubScreenName
  currentSessionId: string | null
}>()

const emit = defineEmits<{
  navigate: [screen: HubScreenName]
}>()

type NavigationEntry
  = | { kind: 'screen', id: HubScreenName, icon: string, label: string }
    | { kind: 'route', id: 'dialogue', icon: string, label: string, to: string }

const entries = computed<NavigationEntry[]>(() => [
  { kind: 'screen', id: 'home', icon: '✦', label: 'История' },
  { kind: 'screen', id: 'packs', icon: '▤', label: 'Паки' },
  {
    kind: 'route',
    id: 'dialogue',
    icon: '❝',
    label: 'Диалог',
    to: props.currentSessionId ? `/interaction?session=${encodeURIComponent(props.currentSessionId)}` : '/story/eighth-seal',
  },
  { kind: 'screen', id: 'profile', icon: '◇', label: 'Профиль' },
])
</script>

<template>
  <nav class="fixed inset-x-0 bottom-0 z-40 flex h-[76px] justify-around border-t border-[#d9a94a2e] bg-gradient-to-b from-[#0b080600] to-[#0b0806] px-2 pb-[max(18px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg min-[900px]:inset-y-0 min-[900px]:left-0 min-[900px]:right-auto min-[900px]:h-full min-[900px]:w-[clamp(224px,17vw,280px)] min-[900px]:flex-col min-[900px]:justify-start min-[900px]:gap-1.5 min-[900px]:border-r min-[900px]:border-t-0 min-[900px]:bg-gradient-to-b min-[900px]:from-[#140e07] min-[900px]:to-[#0b0806] min-[900px]:px-[14px] min-[900px]:pb-6 min-[900px]:pt-[92px] min-[900px]:backdrop-blur-none">
    <NuxtLink class="absolute left-6 top-[30px] hidden font-display text-[22px] tracking-[.14em] text-fabula-gold-light no-underline [text-shadow:0_0_18px_rgba(217,169,74,.35)] min-[900px]:block" to="/">ФАБУЛА</NuxtLink>
    <template v-for="entry in entries" :key="entry.id">
      <NuxtLink
        v-if="entry.kind === 'route'"
        :to="entry.to"
        class="flex min-w-0 flex-1 flex-col items-center gap-[3px] font-display text-[10px] tracking-[.06em] text-fabula-500 no-underline transition hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold min-[900px]:w-full min-[900px]:flex-none min-[900px]:flex-row min-[900px]:justify-start min-[900px]:gap-[14px] min-[900px]:rounded-xl min-[900px]:px-[18px] min-[900px]:py-[14px] min-[900px]:text-[15px] min-[900px]:tracking-[.03em]"
      >
        <span class="text-lg min-[900px]:text-xl">{{ entry.icon }}</span>{{ entry.label }}
      </NuxtLink>
      <button
        v-else
        type="button"
        class="flex min-w-0 flex-1 flex-col items-center gap-[3px] font-display text-[10px] tracking-[.06em] text-fabula-500 transition min-[900px]:w-full min-[900px]:flex-none min-[900px]:flex-row min-[900px]:justify-start min-[900px]:gap-[14px] min-[900px]:rounded-xl min-[900px]:px-[18px] min-[900px]:py-[14px] min-[900px]:text-[15px] min-[900px]:tracking-[.03em]"
        :class="activeScreen === entry.id ? 'text-fabula-100 min-[900px]:bg-white/[.07]' : ''"
        @click="emit('navigate', entry.id)"
      >
        <span class="text-lg min-[900px]:text-xl">{{ entry.icon }}</span>{{ entry.label }}
      </button>
    </template>
  </nav>
</template>

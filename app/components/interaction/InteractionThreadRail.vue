<script setup lang="ts">
import { interactionConfig } from '~/data/interaction'
import type { InteractionStoryId, InteractionToolName } from '~/types/interaction-ui'

defineProps<{
  storyId: InteractionStoryId
  storyIds: InteractionStoryId[]
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  switchStory: [storyId: InteractionStoryId]
  openTool: [tool: InteractionToolName]
  newScene: []
  search: []
}>()

const coverClasses: Record<InteractionStoryId, string> = {
  fant: "bg-[url('/assets/cover_fantasy.jpg')]",
  scifi: "bg-[url('/assets/cover_scifi.jpg')]",
  hist: "bg-[url('/assets/cover_history.jpg')]",
  post: "bg-[url('/assets/cover_modern.png')]",
}
</script>

<template>
  <aside
    class="fixed inset-y-[70px] left-0 z-60 flex w-[min(86vw,296px)] flex-col border-r border-white/10 bg-[#0d0d11] transition-transform duration-300 min-[761px]:static min-[761px]:inset-auto min-[761px]:z-auto min-[761px]:w-auto min-[761px]:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Истории и чаты"
  >
    <div class="flex items-center justify-between border-b border-white/10 p-4 font-display text-lg min-[761px]:hidden">
      <span>Твои истории</span><button type="button" class="grid size-8 place-items-center rounded-lg border border-white/10" aria-label="Закрыть список чатов" @click="emit('close')">×</button>
    </div>
    <div class="flex items-center justify-between px-5 pb-3 pt-8">
      <div><span class="font-interface text-[9px] uppercase tracking-[.11em] text-fabula-500">ЛИЧНЫЙ АРХИВ</span><h1 class="mt-1 font-display text-[24px] text-fabula-100">Твои истории</h1></div>
      <button type="button" class="grid size-9 place-items-center rounded-xl border border-[var(--accent)]/60 bg-[var(--accent-soft)] text-xl text-[var(--accent-light)]" aria-label="Начать новую сцену" @click="emit('newScene')">+</button>
    </div>
    <button type="button" class="mx-[15px] mb-5 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[.025] px-3 py-2.5 text-left font-interface text-[9px] text-fabula-500" @click="emit('search')">
      <span class="text-[var(--accent)]">⌕</span><span class="flex-1">Найти сцену</span><kbd class="rounded border border-white/10 px-1.5 py-0.5">⌘ K</kbd>
    </button>
    <div class="px-2.5">
      <div class="mb-2 flex justify-between px-2 font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500"><span>ОСНОВНЫЕ ПАКИ</span><span>4</span></div>
      <button
        v-for="id in storyIds"
        :key="id"
        type="button"
        class="mb-1 flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition"
        :class="storyId === id ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)]' : 'border-transparent hover:bg-white/[.025]'"
        @click="emit('switchStory', id)"
      >
        <span class="size-10 shrink-0 rounded-lg bg-cover bg-center" :class="coverClasses[id]" />
        <span class="min-w-0 flex-1"><strong class="block truncate font-display text-[16px] font-normal text-fabula-100">{{ interactionConfig.storyPacks[id].title }}</strong><small class="block truncate font-interface text-[8px] text-fabula-500">{{ interactionConfig.storyPacks[id].navSubtitle }}</small></span>
        <span class="text-right font-interface text-[8px] text-fabula-500"><b v-if="id === 'fant'" class="mb-1 block rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[#161006]">2</b><small>{{ id === 'fant' ? 'сейчас' : id === 'scifi' ? 'вчера' : id === 'hist' ? '22 июл' : 'новое' }}</small></span>
      </button>
    </div>
    <div class="mt-auto border-t border-white/10 p-3">
      <button type="button" class="flex w-full items-center gap-2.5 rounded-xl p-2 text-left hover:bg-white/[.03]" @click="emit('openTool', 'character')">
        <span class="size-9 overflow-hidden rounded-full border border-[var(--accent)]"><img class="h-full w-full object-cover" src="/assets/avatar.jpg" alt=""></span>
        <span class="flex-1"><strong class="block font-display text-sm font-normal">Безымянный</strong><small class="font-interface text-[8px] text-fabula-500">Бард · уровень 7</small></span><span class="text-fabula-500">•••</span>
      </button>
    </div>
  </aside>
</template>

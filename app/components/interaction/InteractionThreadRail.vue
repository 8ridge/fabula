<script setup lang="ts">
import type { GameSessionSummary } from '#shared/game'

defineProps<{
  sessions: GameSessionSummary[]
  currentSessionId: string
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  selectSession: [sessionId: string]
  newStory: []
}>()
</script>

<template>
  <aside
    class="fixed inset-y-16 left-0 z-60 flex w-[min(88vw,280px)] flex-col border-r border-white/8 bg-[#0c0d10] transition-transform duration-300 min-[900px]:static min-[900px]:inset-auto min-[900px]:z-auto min-[900px]:w-auto min-[900px]:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Начатые истории"
  >
    <header class="flex items-start justify-between gap-3 px-4 pb-3 pt-5">
      <div>
        <p class="font-interface text-[10px] uppercase tracking-[.14em] text-[#9b9ba6]">Личный архив</p>
        <h2 class="mt-1 font-display text-[21px] text-fabula-100">Начатые истории</h2>
      </div>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-xl border border-white/10 text-[18px] text-fabula-300 min-[900px]:hidden"
        aria-label="Закрыть список историй"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <div class="min-h-0 flex-1 overflow-y-auto px-2.5 pb-3 [scrollbar-width:thin]">
      <button
        v-for="session in sessions"
        :key="session.id"
        type="button"
        class="mb-1.5 flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        :class="currentSessionId === session.id
          ? 'border-[rgb(var(--accent-rgb)/.45)] bg-[rgb(var(--accent-rgb)/.08)]'
          : 'border-transparent hover:border-white/8 hover:bg-white/[.025]'"
        @click="emit('selectSession', session.id)"
      >
        <img :src="session.story_cover" alt="" class="h-12 w-10 shrink-0 rounded-lg object-cover">
        <span class="min-w-0 flex-1">
          <strong class="block truncate font-display text-[16px] font-normal text-fabula-100">{{ session.story_title }}</strong>
          <span class="mt-0.5 block truncate text-[11px] text-[#9b9ba6]">{{ session.persona_name }} · {{ session.scene_title }}</span>
        </span>
        <span v-if="currentSessionId === session.id" class="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-label="Текущая история" />
      </button>

      <p v-if="!sessions.length" class="px-2 py-4 text-[13px] leading-relaxed text-[#9b9ba6]">
        Начатых историй пока нет.
      </p>
    </div>

    <footer class="border-t border-white/8 p-3">
      <button
        type="button"
        class="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 font-display text-[14px] text-fabula-300 transition hover:border-[rgb(var(--accent-rgb)/.45)] hover:text-[var(--accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        @click="emit('newStory')"
      >
        <span aria-hidden="true">＋</span>
        Новая история
      </button>
    </footer>
  </aside>
</template>

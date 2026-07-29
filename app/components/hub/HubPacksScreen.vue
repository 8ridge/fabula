<script setup lang="ts">
import type { HubStoryId } from '~/types/hub'

const emit = defineEmits<{
  openStory: [storyId: HubStoryId]
}>()

const packs: Array<{
  id: HubStoryId
  cover: string
  genre: string
  glyph: string
  title: string
  count: string
  tagClass: string
  titleClass: string
}> = [
  { id: 'fant', cover: '/assets/cover_fantasy.jpg', genre: 'Фэнтези', glyph: '⚔', title: 'Пепельные земли', count: '12 историй', tagClass: 'border-[#a97a2c] text-fabula-gold-light', titleClass: 'font-display text-fabula-gold-light' },
  { id: 'scifi', cover: '/assets/cover_scifi.jpg', genre: 'Sci-Fi', glyph: '✧', title: 'Кассандра', count: '9 историй', tagClass: 'border-fabula-scifi/40 text-fabula-scifi font-interface', titleClass: 'font-interface font-bold uppercase text-fabula-scifi [text-shadow:0_0_12px_rgba(84,230,208,.4)]' },
  { id: 'hist', cover: '/assets/cover_history.jpg', genre: 'История', glyph: '⚜', title: 'Восстание Спартака', count: '7 историй', tagClass: 'border-fabula-history/40 text-fabula-history', titleClass: 'font-display text-fabula-history' },
  { id: 'post', cover: '/assets/cover_modern.png', genre: 'Современность', glyph: '◒', title: 'Линия разрыва', count: '6 историй', tagClass: 'border-fabula-post/40 text-fabula-post', titleClass: 'font-interface font-bold uppercase text-fabula-post' },
]

const filters = ['Все', 'Фэнтези', 'Sci-Fi', 'История', 'Современность']
const activeFilter = ref(filters[0])
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[radial-gradient(120%_100%_at_50%_0%,#241a0c,#14100a_55%,#0b0806)]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="Паки историй" action="⚲" />

      <div class="mx-auto mb-[14px] flex max-w-[1120px] items-center gap-2.5 rounded-xl border border-[#d9a94a2e] bg-white/[.03] px-[14px] py-[11px] text-[15px] text-[#8a7c60]">
        <span>⚲</span><span>Найти историю…</span>
      </div>
      <div class="mx-auto mb-4 flex max-w-[1120px] gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        <button
          v-for="filter in filters"
          :key="filter"
          type="button"
          class="shrink-0 rounded-full border px-[15px] py-2 font-display text-[13px]"
          :class="activeFilter === filter ? 'border-transparent bg-gradient-to-b from-fabula-gold-light to-[#8a6122] text-[#12100a]' : 'border-[#d9a94a2e] bg-white/[.03] text-[#b6a88a]'"
          @click="activeFilter = filter"
        >
          {{ filter }}
        </button>
      </div>

      <button
        type="button"
        class="relative mx-auto mb-[18px] flex min-h-[150px] w-full max-w-[1120px] flex-col justify-end overflow-hidden rounded-2xl p-[18px] text-left"
        @click="emit('openStory', 'fant')"
      >
        <img class="absolute inset-0 h-full w-full object-cover" src="/assets/cover_fantasy.jpg" alt="">
        <span class="absolute inset-0 bg-gradient-to-t from-[#0b0806f2] via-[#0b080640] to-[#0b080610]" />
        <span class="absolute left-[14px] top-[14px] z-[2] rounded-full bg-gradient-to-b from-fabula-gold-light to-[#8a6122] px-[11px] py-[5px] font-display text-[10px] uppercase tracking-[.16em] text-[#1a1206]">Новинка недели</span>
        <strong class="relative z-[2] font-display text-[23px] leading-[1.05] text-fabula-gold-light">Пепельные земли</strong>
        <span class="relative z-[2] mt-1 text-sm text-[#b6a88a]">Темное фэнтези · 8 глав · рейтинг ★ 4.8</span>
      </button>

      <div class="mx-auto mb-3 mt-1 flex max-w-[1120px] items-center justify-between">
        <span class="font-display text-[13px] uppercase tracking-[.14em] text-[#e9dfc9]">Архижанры</span>
        <span class="font-display text-xs text-fabula-gold">все →</span>
      </div>

      <div class="mx-auto grid max-w-[1120px] grid-cols-2 gap-[13px] min-[900px]:grid-cols-4">
        <button
          v-for="pack in packs"
          :key="pack.id"
          type="button"
          class="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-[#d9a94a2e] p-3 text-left shadow-[0_12px_24px_-14px_#000] transition active:scale-[.97]"
          @click="emit('openStory', pack.id)"
        >
          <img class="absolute inset-0 h-full w-full object-cover" :src="pack.cover" alt="">
          <span class="absolute inset-0 bg-gradient-to-t from-[#0b0806f0] via-[#0b080630] to-[#0b080610]" />
          <span class="absolute left-2.5 top-2.5 z-[2] rounded-full border bg-black/50 px-2 py-[3px] font-display text-[9px] uppercase tracking-[.1em]" :class="pack.tagClass">{{ pack.genre }}</span>
          <span class="absolute right-3 top-3 z-[2] text-[19px] text-white/25">{{ pack.glyph }}</span>
          <span class="absolute inset-x-3 bottom-8 z-[2] text-base leading-[1.05]" :class="pack.titleClass">{{ pack.title }}</span>
          <span class="absolute inset-x-3 bottom-3 z-[2] text-[13px] text-[#8a7c60]">{{ pack.count }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

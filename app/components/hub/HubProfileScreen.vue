<script setup lang="ts">
import type { HubStoryId } from '~/types/hub'

const emit = defineEmits<{
  openStory: [storyId: HubStoryId]
}>()

const activeStories: Array<{ id: HubStoryId, title: string, cover: string, chapter: string, progress: string, width: string }> = [
  { id: 'fant', title: 'Королевство Пепельных земель', cover: '/assets/cover_fantasy.jpg', chapter: 'Глава 5 · 62%', progress: '62', width: 'w-[62%]' },
  { id: 'scifi', title: 'Станция «Кассандра»', cover: '/assets/cover_scifi.jpg', chapter: 'Глава 2 · 28%', progress: '28', width: 'w-[28%]' },
]

const settings = [
  ['☙', 'Подписка и грейды'],
  ['♪', 'Звук и музыка'],
  ['✦', 'Оформление'],
  ['⤓', 'Установить приложение'],
]
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[radial-gradient(120%_100%_at_50%_0%,#241a0c,#14100a_55%,#0b0806)]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="Профиль" action="⚙" />

      <div class="mx-auto flex max-w-[1120px] flex-col items-center pb-4 pt-1.5 text-center">
        <div class="mb-3 size-[92px] overflow-hidden rounded-full border-2 border-fabula-gold bg-[radial-gradient(circle_at_50%_30%,#6a5230,#1c130a)] shadow-[0_0_0_5px_#0a0704,0_0_22px_-2px_#d9a94a]">
          <img class="h-full w-full object-cover" src="/assets/avatar.jpg" alt="Безымянный">
        </div>
        <h2 class="font-display text-[25px] leading-none text-fabula-gold-light">Безымянный</h2>
        <p class="mt-2 rounded-full border border-[#a97a2c] bg-fabula-gold/[.06] px-3 py-1 font-display text-[11px] uppercase tracking-[.16em] text-fabula-gold">⚜ Подписка · Бард</p>
        <div class="w-full">
          <div class="mb-1 mt-[14px] flex justify-between font-display text-xs text-[#8a7c60]"><span>Уровень 7</span><span>1 840 / 2 800 XP</span></div>
          <div class="h-[9px] overflow-hidden rounded-full border border-[#d9a94a2e] bg-[#0e0a06]"><span class="block h-full w-[64%] rounded-full bg-gradient-to-r from-[#8a6122] to-fabula-gold-light shadow-[0_0_10px_#d9a94a]" /></div>
        </div>
      </div>

      <div class="mx-auto my-[18px] grid max-w-[1120px] grid-cols-3 gap-2.5">
        <div v-for="stat in [['12', 'историй'], ['34', 'часа'], ['8', 'достижений']]" :key="stat[1]" class="rounded-xl border border-[#d9a94a2e] bg-white/[.025] px-1.5 py-[14px] text-center">
          <strong class="block font-display text-[22px] text-fabula-gold-light">{{ stat[0] }}</strong>
          <span class="font-display text-[10px] uppercase tracking-[.08em] text-[#8a7c60]">{{ stat[1] }}</span>
        </div>
      </div>

      <p class="mx-auto mb-2.5 mt-1.5 max-w-[1120px] font-display text-xs uppercase tracking-[.14em] text-[#e9dfc9]">Активные истории</p>
      <button
        v-for="story in activeStories"
        :key="story.id"
        type="button"
        class="mx-auto mb-2.5 flex w-full max-w-[1120px] items-center gap-3 rounded-xl border border-[#d9a94a2e] bg-white/[.02] p-3 text-left"
        @click="emit('openStory', story.id)"
      >
        <img class="h-14 w-11 shrink-0 rounded-[7px] object-cover" :src="story.cover" alt="">
        <span class="flex-1">
          <strong class="block font-display text-sm font-normal text-[#e9dfc9]">{{ story.title }}</strong>
          <span class="mt-1.5 block h-[5px] overflow-hidden rounded-full bg-[#0e0a06]"><i class="block h-full bg-gradient-to-r from-[#8a6122] to-fabula-gold-light" :class="story.width" /></span>
          <small class="mt-1 block font-display text-xs text-fabula-gold">{{ story.chapter }}</small>
        </span>
      </button>

      <p class="mx-auto mb-2.5 mt-4 max-w-[1120px] font-display text-xs uppercase tracking-[.14em] text-[#e9dfc9]">Настройки</p>
      <div v-for="setting in settings" :key="setting[1]" class="mx-auto flex max-w-[1120px] items-center justify-between border-b border-white/[.05] px-1 py-[14px] text-base text-[#b6a88a]">
        <span class="flex items-center gap-3"><i class="w-5 text-center not-italic text-fabula-gold">{{ setting[0] }}</i>{{ setting[1] }}</span><span class="text-[#8a7c60]">›</span>
      </div>
      <NuxtLink class="mx-auto flex max-w-[1120px] items-center justify-between px-1 py-[14px] text-base text-[#b6a88a] no-underline" to="/">
        <span class="flex items-center gap-3"><i class="w-5 text-center not-italic text-fabula-gold">⌂</i>Вернуться на сайт</span><span class="text-[#8a7c60]">›</span>
      </NuxtLink>
    </div>
  </section>
</template>

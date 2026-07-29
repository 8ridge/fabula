<script setup lang="ts">
import type { HubSheetView, HubStory } from '~/types/hub'

const props = defineProps<{
  view: HubSheetView
  story: HubStory
}>()

const emit = defineEmits<{
  close: []
  start: []
  openInventory: []
}>()

const labels = {
  inventory: 'Инвентарь',
  journal: 'Журнал',
  check: 'Проверка',
  character: 'Персонаж',
  settings: 'Настройки',
}

const toolTitle = computed(() => props.view && props.view !== 'story' ? labels[props.view] : '')
</script>

<template>
  <button
    type="button"
    aria-label="Закрыть панель"
    class="fixed inset-0 z-80 bg-black transition"
    :class="view ? 'visible opacity-60' : 'invisible opacity-0'"
    @click="emit('close')"
  />
  <section
    class="fixed inset-x-0 bottom-0 z-90 flex max-h-[88dvh] flex-col rounded-t-[22px] border-t border-[#a97a2c] bg-[radial-gradient(#ffffff06_.5px,transparent_.5px)_0_0/3px_3px,linear-gradient(#1a1207,#100b05)] pb-[max(8px,env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-10px_#000] transition-all duration-300 min-[900px]:bottom-auto min-[900px]:left-1/2 min-[900px]:right-auto min-[900px]:top-1/2 min-[900px]:w-[min(560px,92vw)] min-[900px]:-translate-x-1/2 min-[900px]:rounded-[22px] min-[900px]:border"
    :class="view
      ? 'translate-y-0 visible opacity-100 min-[900px]:-translate-y-1/2'
      : 'translate-y-full invisible opacity-0 min-[900px]:-translate-y-[44%]'"
    :aria-hidden="!view"
    :inert="!view"
  >
    <button type="button" class="mx-auto my-2.5 h-[5px] w-11 shrink-0 rounded-full bg-white/20 min-[900px]:hidden" aria-label="Закрыть панель" @click="emit('close')" />
    <div class="overflow-y-auto px-4 pb-[18px] pt-1.5 [scrollbar-width:none] min-[900px]:pt-5">
      <template v-if="view === 'story'">
        <div class="relative mb-[14px] h-[150px] overflow-hidden rounded-[14px] border border-[#d9a94a2e]">
          <img class="h-full w-full object-cover" :src="story.cover" :alt="story.title">
          <span class="absolute left-2.5 top-2.5 rounded-full border border-[#a97a2c] bg-black/60 px-3 py-[5px] text-[11px] tracking-[.04em]">{{ story.eyebrow }}</span>
        </div>
        <h2 class="mb-2 font-display text-[26px] leading-[1.05] text-fabula-gold-light">{{ story.title }}</h2>
        <p class="mb-4 text-base leading-[1.4] text-[#b6a88a]">{{ story.premise }}</p>
        <div class="mb-[14px] grid grid-cols-3 gap-2.5">
          <div v-for="entry in [['Роль', story.role], ['Локация', story.location], ['Ставка', story.stake]]" :key="entry[0]" class="rounded-xl border border-[#d9a94a2e] bg-white/[.025] px-1.5 py-2.5 text-center">
            <span class="mb-1 block font-display text-[9px] uppercase tracking-[.06em] text-[#8a7c60]">{{ entry[0] }}</span>
            <strong class="font-display text-[13px] font-normal text-[#e9dfc9]">{{ entry[1] }}</strong>
          </div>
        </div>
        <div class="mb-[18px] flex flex-wrap gap-[7px]">
          <span v-for="state in story.state" :key="state" class="rounded-full border border-[#a97a2c] bg-fabula-gold/[.05] px-[11px] py-1 text-[13px] text-fabula-gold">#{{ state }}</span>
        </div>
        <button type="button" class="w-full rounded-[14px] bg-gradient-to-b from-fabula-gold-light to-[#8a6122] p-[15px] font-display text-sm uppercase tracking-[.1em] text-[#1a1206] shadow-[inset_0_1px_0_rgba(255,246,222,.45),inset_0_-3px_8px_rgba(90,60,15,.55),0_10px_26px_-10px_rgba(217,169,74,.5)]" @click="emit('start')">
          Начать историю ⚔
        </button>
      </template>
      <template v-else-if="view">
        <h2 class="mb-[14px] font-display text-[22px] text-fabula-gold-light">{{ toolTitle }}</h2>
        <p class="mb-4 text-base leading-[1.4] text-[#b6a88a]">Инструмент открыт для текущей истории "{{ story.title }}".</p>
        <button v-if="view === 'inventory'" type="button" class="w-full rounded-[14px] bg-gradient-to-b from-fabula-gold-light to-[#8a6122] p-[15px] font-display text-sm uppercase tracking-[.1em] text-[#1a1206]" @click="emit('openInventory')">Открыть инвентарь</button>
        <button v-else type="button" class="w-full rounded-[14px] border border-[#a97a2c] bg-fabula-gold/[.06] p-[15px] font-display text-sm uppercase tracking-[.1em] text-fabula-gold-light" @click="emit('close')">Готово</button>
      </template>
    </div>
  </section>
</template>

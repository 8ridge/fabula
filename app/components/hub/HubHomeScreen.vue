<script setup lang="ts">
import type { HubStoryId } from '~/types/hub'

const emit = defineEmits<{
  openStory: [storyId: HubStoryId]
}>()

const chips = ['Темное фэнтези', 'Лоу-фэнтези', 'Стимпанк']
const activeChip = ref(chips[0])
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="ФАБУЛА" action="☰" brand />

      <article class="relative mx-auto mb-4 flex min-h-[330px] max-w-[1120px] flex-col justify-end overflow-hidden rounded-[20px] border border-[#a97a2c] p-5 min-[900px]:mb-[22px] min-[900px]:min-h-[56vh] min-[900px]:rounded-3xl">
        <img class="absolute inset-0 h-full w-full object-cover" src="/assets/hero_fantasy.jpg" alt="">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent shadow-[inset_0_-60px_60px_-20px_#000,inset_0_0_80px_10px_#0007]" />
        <span class="absolute left-[9px] top-[7px] z-[2] font-display text-[13px] text-fabula-gold [text-shadow:0_0_8px_rgba(217,169,74,.55)]">⚜</span>
        <span class="absolute bottom-[7px] right-[9px] z-[2] font-display text-[13px] text-fabula-gold [text-shadow:0_0_8px_rgba(217,169,74,.55)]">⚜</span>
        <div class="relative z-[2]">
          <p class="mb-2 flex items-center gap-2 font-display text-[10px] uppercase tracking-[.3em] text-fabula-gold before:size-[5px] before:rounded-full before:bg-fabula-gold">
            Пак · Фэнтези
          </p>
          <h2 class="my-3 bg-gradient-to-b from-[#fff8ea] via-fabula-gold-light to-[#8a6122] bg-clip-text font-display text-[33px] leading-[1.04] text-transparent [filter:drop-shadow(0_2px_10px_#000a)]">
            Королевство<br>Пепельных земель
          </h2>
          <p class="max-w-[32ch] text-base leading-[1.4] text-[#e9dfc9] [text-shadow:0_1px_6px_#000a]">
            Ты очнулся в руинах, не помня имени. На горизонте горит Темная Цитадель.
          </p>
        </div>
      </article>

      <div class="mx-auto mb-3 flex max-w-[640px] gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          v-for="chip in chips"
          :key="chip"
          type="button"
          class="shrink-0 rounded-full border px-[15px] py-2 font-display text-[13px] tracking-[.03em] transition"
          :class="activeChip === chip
            ? 'border-transparent bg-gradient-to-b from-fabula-gold-light to-[#8a6122] text-[#12100a] shadow-[0_6px_18px_-6px_rgba(217,169,74,.6)]'
            : 'border-[#d9a94a2e] bg-white/[.03] text-[#b6a88a]'"
          @click="activeChip = chip"
        >
          {{ chip }}
        </button>
      </div>

      <button
        type="button"
        class="mx-auto block w-full max-w-[640px] rounded-[14px] bg-gradient-to-b from-white via-[#f0f0f4] to-[#dcdce4] px-[18px] py-[18px] font-display text-[15px] uppercase tracking-[.14em] text-[#08080a] shadow-[inset_0_1px_0_rgba(255,255,255,.95),inset_0_-2px_7px_rgba(0,0,0,.16),0_8px_22px_-10px_rgba(0,0,0,.6)] transition hover:-translate-y-0.5"
        @click="emit('openStory', 'fant')"
      >
        Начать историю ⚔
      </button>
      <p class="mx-auto mt-3 max-w-[640px] text-center font-display text-xs tracking-[.05em] text-[#8a7c60]">
        ~15 мин на главу · выбор решает все
      </p>
    </div>
  </section>
</template>

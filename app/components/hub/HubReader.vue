<script setup lang="ts">
import type { HubStory, HubStoryId, HubToolName } from '~/types/hub'

const props = defineProps<{
  storyId: HubStoryId
  story: HubStory
  step: number
  selectedChoice: string | null
  choices: string[]
}>()

const emit = defineEmits<{
  openMenu: []
  openTool: [tool: HubToolName]
  advance: []
  choose: [choice: string]
}>()

const visibleMessages = computed(() => props.story.messages.slice(0, props.step + 1))
</script>

<template>
  <section class="absolute inset-0 z-[70] flex flex-col overflow-hidden bg-[radial-gradient(120%_100%_at_50%_0%,#241a0c,#14100a_55%,#0b0806)]">
    <header class="relative z-10 mx-auto flex w-full max-w-[760px] items-center justify-between px-5 pb-2.5 pt-[max(18px,env(safe-area-inset-top))] min-[900px]:pt-7">
      <button type="button" class="grid size-9 place-items-center rounded-[11px] border border-[#d9a94a2e] bg-black/40 text-[17px] text-[#e9dfc9]" aria-label="Открыть меню истории" @click="emit('openMenu')">☰</button>
      <h1 class="flex-1 text-center font-display text-[13px] uppercase tracking-[.1em] text-fabula-gold">{{ story.title }}</h1>
      <span class="size-9" />
    </header>

    <div class="relative z-10 mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-[14px] overflow-y-auto px-[18px] py-3 [scrollbar-width:none]" aria-live="polite">
      <article
        v-for="(message, index) in visibleMessages"
        :key="`${storyId}-${index}`"
        data-reader-message
        class="max-w-[94%]"
        :class="message.type === 'player'
          ? 'self-end rounded-[16px_16px_5px_16px] bg-gradient-to-b from-fabula-gold-light to-[#8a6122] px-4 py-3 font-display text-[15px] leading-[1.35] text-[#1a1206] shadow-[0_8px_20px_-12px_rgba(217,169,74,.5)]'
          : 'self-start rounded-[5px_16px_16px_16px] border border-[#d9a94a2e] bg-[radial-gradient(#ffffff07_.5px,transparent_.5px)_0_0/3px_3px,linear-gradient(#1a130a,#130d06)] px-4 py-[14px] shadow-[0_8px_22px_-16px_#000]'"
      >
        <h2 v-if="index === 0 && message.type !== 'player'" class="mb-2 font-display text-[22px] leading-[1.08] text-fabula-gold-light">{{ story.title }}</h2>
        <p :class="message.type === 'player' ? '' : 'text-[17px] leading-[1.5] text-[#e9dfc9]'">{{ message.text }}</p>
      </article>
      <article v-if="selectedChoice" data-reader-message class="max-w-[82%] self-end rounded-[16px_16px_5px_16px] bg-gradient-to-b from-fabula-gold-light to-[#8a6122] px-4 py-3 font-display text-[15px] leading-[1.35] text-[#1a1206]">
        {{ selectedChoice }}
      </article>
    </div>

    <footer class="relative z-10 mx-auto flex w-full max-w-[760px] flex-col gap-[9px] border-t border-[#d9a94a2e] bg-gradient-to-b from-transparent to-[#0b0806] px-[18px] pb-[max(16px,env(safe-area-inset-bottom))] pt-2.5">
      <button
        v-if="step < story.messages.length - 1"
        type="button"
        class="rounded-[14px] border border-[#a97a2c] bg-fabula-gold/[.07] p-[14px] font-display text-sm uppercase tracking-[.1em] text-fabula-gold-light transition hover:bg-fabula-gold/[.13]"
        @click="emit('advance')"
      >
        Продолжить ↓
      </button>
      <template v-else-if="!selectedChoice">
        <p class="text-center font-display text-[11px] uppercase tracking-[.14em] text-fabula-gold">Что ты сделаешь?</p>
        <button
          v-for="choice in choices"
          :key="choice"
          type="button"
          class="rounded-xl border border-[#a97a2c] bg-fabula-gold/[.05] px-4 py-[14px] text-left text-[17px] text-[#e9dfc9] transition hover:translate-x-[3px] hover:bg-fabula-gold/[.11]"
          @click="emit('choose', choice)"
        >
          {{ choice }}
        </button>
      </template>
      <NuxtLink
        v-else
        class="rounded-[14px] border border-[#a97a2c] bg-fabula-gold/[.07] p-[14px] text-center font-display text-sm uppercase tracking-[.1em] text-fabula-gold-light no-underline"
        :to="`/interaction?story=${storyId}`"
      >
        Продолжить в сцене →
      </NuxtLink>
      <div class="flex justify-center gap-2 pt-1">
        <button v-for="tool in [{ id: 'inventory', icon: '☙', label: 'Инвентарь' }, { id: 'journal', icon: '✒', label: 'Журнал' }, { id: 'check', icon: '⚄', label: 'Проверка' }]" :key="tool.id" type="button" class="grid size-9 place-items-center rounded-[10px] border border-[#d9a94a2e] bg-white/[.025] text-fabula-gold" :title="tool.label" @click="emit('openTool', tool.id as HubToolName)">
          {{ tool.icon }}
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { interactionConfig } from '~/data/interaction'
import type { InteractionStory, InteractionStoryId, InteractionTheme, InteractionToolName } from '~/types/interaction-ui'

defineProps<{
  story: InteractionStory
  storyId: InteractionStoryId
  storyIds: InteractionStoryId[]
  theme: InteractionTheme
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  switchStory: [storyId: InteractionStoryId]
  openTool: [tool: InteractionToolName]
}>()

type ThemeId = keyof typeof interactionConfig.themes
const themeForStory = (id: InteractionStoryId) => interactionConfig.themes[interactionConfig.storyPacks[id].themeId as ThemeId]
</script>

<template>
  <aside
    class="fixed inset-y-[70px] right-0 z-60 w-[min(90vw,350px)] overflow-y-auto border-l border-white/10 bg-[#0d0d11] p-5 transition-transform duration-300 [scrollbar-width:thin] min-[1181px]:static min-[1181px]:inset-auto min-[1181px]:z-auto min-[1181px]:w-auto min-[1181px]:translate-x-0"
    :class="open ? 'translate-x-0' : 'translate-x-full'"
    aria-label="Состояние сцены и инструменты"
  >
    <div class="mb-4 flex items-center justify-between font-display text-lg min-[1181px]:hidden">
      <span>Состояние сцены</span><button type="button" class="grid size-8 place-items-center rounded-lg border border-white/10" aria-label="Закрыть состояние сцены" @click="emit('close')">×</button>
    </div>
    <header class="mb-5 flex items-center justify-between">
      <span><small class="block font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500">ПАНЕЛЬ СЦЕНЫ</small><strong class="font-display text-[23px] font-normal">Состояние мира</strong></span>
      <button type="button" class="grid size-9 place-items-center rounded-xl border border-white/10" aria-label="Настроить панель" @click="emit('openTool', 'settings')">⚙</button>
    </header>
    <div class="mb-5 grid grid-cols-4 border-b border-white/10 pb-5" role="toolbar" aria-label="Инструменты сцены">
      <button v-for="entry in [{ id: 'character', icon: '♞', label: 'Персонаж' }, { id: 'inventory', icon: '☙', label: 'Инвентарь' }, { id: 'journal', icon: '✒', label: 'Журнал' }, { id: 'models', icon: '⌘', label: 'Модели' }]" :key="entry.id" type="button" class="flex flex-col items-center gap-1 font-interface text-[7px] text-fabula-300" @click="emit('openTool', entry.id as InteractionToolName)"><span class="text-lg text-fabula-100">{{ entry.icon }}</span>{{ entry.label }}</button>
    </div>

    <section class="mb-[18px] rounded-[15px] border border-[var(--accent)]/35 bg-[linear-gradient(145deg,var(--accent-soft),transparent_70%)] p-[15px]">
      <div class="mb-3 flex justify-between font-interface text-[8px] uppercase tracking-[.08em] text-fabula-500"><span>АРХИЖАНР</span><span class="text-[var(--accent-light)]">{{ theme.label }}</span></div>
      <div class="grid grid-cols-2 gap-2" role="tablist" aria-label="Темы оформления">
        <button v-for="id in storyIds" :key="id" type="button" class="flex items-center gap-2 rounded-xl border p-2.5 text-left" :class="storyId === id ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-light)]' : 'border-white/10 bg-black/10 text-fabula-300'" role="tab" :aria-selected="storyId === id" @click="emit('switchStory', id)"><span class="grid size-7 place-items-center rounded-lg bg-white/[.04]">{{ themeForStory(id).icon }}</span><small class="font-interface text-[7px]">{{ themeForStory(id).label }}</small></button>
      </div>
    </section>

    <section class="mb-[18px] rounded-[15px] border border-white/10 bg-[#121216] p-[15px]">
      <div class="mb-3 flex justify-between font-interface text-[8px] uppercase tracking-[.08em] text-fabula-500"><span>ЯДРО ПАКА</span><span class="text-[var(--accent-light)]">В СЦЕНЕ</span></div>
      <p class="text-[15px] leading-[1.45] text-fabula-300">{{ story.premise }}</p>
      <div class="mt-3 border-t border-white/10 pt-3"><span class="block font-interface text-[7px] text-fabula-500">Твоя цель</span><strong class="font-display text-[16px] font-normal text-[var(--accent-light)]">{{ story.objective }}</strong></div>
    </section>

    <section class="mb-[18px] rounded-[15px] border border-[var(--accent)]/30 bg-[linear-gradient(145deg,var(--accent-soft),#121216_70%)] p-[15px]">
      <div class="flex items-center gap-2.5"><img class="size-10 rounded-xl border border-[var(--accent)] object-cover" src="/assets/avatar.jpg" alt=""><span class="min-w-0 flex-1"><strong class="block truncate font-display text-[16px] font-normal">{{ story.character }}</strong><small class="font-interface text-[7px] text-fabula-500">{{ story.presenceRole || story.role }} · рядом</small></span><span class="rounded-full border border-[#8fcd78]/40 px-2 py-1 font-interface text-[7px] text-[#8fcd78]">в сцене</span></div>
      <div class="mt-3 grid grid-cols-2 gap-3"><span><small class="block font-interface text-[7px] text-fabula-500">Отношение</small><b class="font-display font-normal text-[var(--accent-light)]">{{ story.relation }}</b></span><span><small class="block font-interface text-[7px] text-fabula-500">Знает</small><b class="font-display font-normal text-[var(--accent-light)]">{{ story.knowledge }}</b></span></div>
      <div class="my-3 h-1 overflow-hidden rounded-full bg-white/10"><i class="block h-full w-[42%] bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent-light)]" /></div>
      <p class="text-sm leading-relaxed text-fabula-300">{{ story.presence }}</p>
    </section>

    <section class="mb-[18px] rounded-[15px] border border-white/10 bg-[#121216] p-[15px]">
      <div class="mb-2 flex justify-between font-interface text-[8px] uppercase tracking-[.08em] text-fabula-500"><span>СЕЙЧАС В МИРЕ</span><button type="button" class="text-[var(--accent)]" aria-label="Открыть журнал" @click="emit('openTool', 'journal')">→</button></div>
      <div v-for="(state, index) in story.state" :key="state" class="flex gap-2.5 border-t border-white/[.07] py-3 first:border-0">
        <span class="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-light)]">{{ ['◷', '⌁', '!'][index] }}</span>
        <span><strong class="block font-display text-sm font-normal">{{ state }}</strong><small class="font-interface text-[7px] text-fabula-500">{{ ['Сцена развивается в реальном времени', 'Условия меняют возможные действия', 'Открытое последствие'][index] }}</small></span>
      </div>
    </section>

    <section class="rounded-[15px] border border-white/10 bg-[#121216] p-[15px]">
      <div class="mb-2 flex justify-between font-interface text-[8px] uppercase tracking-[.08em] text-fabula-500"><span>КОНТУР ИИ</span><span class="rounded border border-white/10 px-1.5 py-0.5">SERVER</span></div>
      <div v-for="(stage, index) in [['Авторитетный ход', 'DeepSeek · ожидает действие'], ['План сцены', 'Nemotron · advisory'], ['Рассказчик', 'Aion · блокировка ZDR'], ['Fallback', 'Mistral · armed']]" :key="stage[0]" class="flex items-center gap-2 border-t border-white/[.07] py-2.5">
        <i class="size-1.5 rounded-full" :class="index === 0 ? 'bg-[#8fcd78] shadow-[0_0_8px_#8fcd78]' : 'bg-fabula-500'" />
        <span class="flex-1"><strong class="block font-display text-sm font-normal">{{ stage[0] }}</strong><small class="font-interface text-[7px] text-fabula-500">{{ stage[1] }}</small></span><b class="font-interface text-[8px] text-fabula-500">0{{ index + 1 }}</b>
      </div>
      <button type="button" class="mt-2 flex w-full justify-between rounded-lg border border-white/10 px-3 py-2 font-interface text-[8px] text-fabula-300" @click="emit('openTool', 'models')">Показать все 15 промтов <b>→</b></button>
    </section>
    <div class="mt-4 flex items-center gap-2 font-interface text-[7px] text-fabula-500"><span class="size-1.5 rounded-full bg-[#8fcd78]" />Состояние принадлежит сессии</div>
  </aside>
</template>

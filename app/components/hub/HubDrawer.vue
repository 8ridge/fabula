<script setup lang="ts">
import type { HubToolName } from '~/types/hub'

defineProps<{
  open: boolean
  storyTitle: string
}>()

const emit = defineEmits<{
  close: []
  openTool: [tool: HubToolName]
  exit: []
}>()

const tools: Array<{ id: HubToolName, icon: string, label: string }> = [
  { id: 'inventory', icon: '☙', label: 'Инвентарь' },
  { id: 'journal', icon: '✒', label: 'Журнал' },
  { id: 'check', icon: '⚄', label: 'Бросить проверку' },
  { id: 'character', icon: '♞', label: 'Персонаж' },
  { id: 'settings', icon: '⚙', label: 'Настройки сценария' },
]
</script>

<template>
  <button
    type="button"
    aria-label="Закрыть меню"
    class="fixed inset-0 z-[94] bg-black transition"
    :class="open ? 'visible opacity-60' : 'invisible opacity-0'"
    @click="emit('close')"
  />
  <aside
    class="fixed inset-y-0 left-0 z-[95] flex w-[76%] max-w-[318px] flex-col border-r border-[#a97a2c] bg-gradient-to-br from-[#1a1207] to-[#0c0803] pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] shadow-[20px_0_60px_-10px_#000] transition-transform duration-300 min-[900px]:w-[300px]"
    :class="open ? 'translate-x-0' : '-translate-x-[102%]'"
    :aria-hidden="!open"
    :inert="!open"
  >
    <div class="mb-2 border-b border-[#d9a94a2e] px-6 pb-4 pt-1">
      <h2 class="font-display text-[21px] text-fabula-gold-light">{{ storyTitle }}</h2>
      <p class="mt-[3px] font-display text-xs tracking-[.06em] text-[#8a7c60]">Меню сценария</p>
    </div>
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="flex items-center gap-[14px] px-6 py-[15px] text-left text-[17px] text-[#b6a88a] transition hover:bg-fabula-gold/[.06] hover:text-[#e9dfc9]"
      @click="emit('openTool', tool.id)"
    >
      <span class="w-[22px] text-center text-lg text-fabula-gold">{{ tool.icon }}</span>{{ tool.label }}
    </button>
    <button type="button" class="mt-auto flex items-center gap-[14px] px-6 py-[15px] text-left text-[17px] text-[#a8402c]" @click="emit('exit')">
      <span class="w-[22px] text-center text-lg">✕</span>Выйти из истории
    </button>
  </aside>
</template>

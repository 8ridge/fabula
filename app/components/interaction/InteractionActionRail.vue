<script setup lang="ts">
import type { InteractionToolName } from '~/types/interaction-ui'

defineProps<{
  inventoryCount: number
  journalCount: number
  activeTool: InteractionToolName | null
}>()

const emit = defineEmits<{
  openTool: [tool: InteractionToolName]
}>()

const tools: Array<{ id: InteractionToolName, label: string, shortLabel: string }> = [
  { id: 'inventory', label: 'Инвентарь', shortLabel: 'Вещи' },
  { id: 'journal', label: 'Журнал', shortLabel: 'Журнал' },
  { id: 'character', label: 'Персонажи', shortLabel: 'Люди' },
  { id: 'world', label: 'Мир', shortLabel: 'Мир' },
  { id: 'settings', label: 'Настройки', shortLabel: 'Текст' },
]
</script>

<template>
  <aside class="hidden flex-col items-center gap-1.5 border-l border-white/8 bg-[#0c0d10] py-3 min-[1180px]:flex" aria-label="Инструменты истории">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="relative flex h-14 w-[68px] flex-col items-center justify-center gap-0.5 rounded-xl border text-[var(--accent-light)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      :class="activeTool === tool.id
        ? 'border-[rgb(var(--accent-rgb)/.46)] bg-[rgb(var(--accent-rgb)/.14)] shadow-[0_0_24px_rgb(var(--accent-rgb)/.08)]'
        : 'border-transparent text-[#aaaab4] hover:border-white/10 hover:bg-white/5 hover:text-fabula-100'"
      :aria-label="tool.label"
      :title="tool.label"
      @click="emit('openTool', tool.id)"
    >
      <InteractionToolIcon :tool="tool.id" class="size-[23px]" />
      <span class="font-interface text-[9px] leading-none">{{ tool.shortLabel }}</span>
      <span
        v-if="tool.id === 'inventory' && inventoryCount"
        class="absolute right-1 top-1 min-w-[18px] rounded-full bg-[var(--accent)] px-1 font-interface text-[10px] font-semibold leading-[18px] text-[#101114]"
      >
        {{ inventoryCount }}
      </span>
      <span
        v-else-if="tool.id === 'journal' && journalCount"
        class="absolute right-1 top-1 min-w-[18px] rounded-full bg-[var(--accent)] px-1 font-interface text-[10px] font-semibold leading-[18px] text-[#101114]"
      >
        {{ journalCount }}
      </span>
    </button>
  </aside>
</template>

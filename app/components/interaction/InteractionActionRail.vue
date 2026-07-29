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

const tools: Array<{ id: InteractionToolName, icon: string, label: string }> = [
  { id: 'inventory', icon: '◫', label: 'Инвентарь' },
  { id: 'journal', icon: '✒', label: 'Журнал' },
  { id: 'character', icon: '♙', label: 'Персонажи' },
  { id: 'world', icon: '⌖', label: 'Мир' },
  { id: 'settings', icon: '⚙', label: 'Настройки' },
]
</script>

<template>
  <aside class="hidden flex-col items-center border-l border-white/8 bg-[#0c0d10] py-3 min-[1180px]:flex" aria-label="Инструменты истории">
    <button
      v-for="tool in tools"
      :key="tool.id"
      type="button"
      class="relative mb-1 grid size-11 place-items-center rounded-xl text-[19px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      :class="activeTool === tool.id
        ? 'bg-[rgb(var(--accent-rgb)/.14)] text-[var(--accent-light)]'
        : 'text-[#9b9ba6] hover:bg-white/5 hover:text-fabula-100'"
      :aria-label="tool.label"
      :title="tool.label"
      @click="emit('openTool', tool.id)"
    >
      {{ tool.icon }}
      <span
        v-if="tool.id === 'inventory' && inventoryCount"
        class="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[var(--accent)] px-1 font-interface text-[10px] leading-4 text-[#101114]"
      >
        {{ inventoryCount }}
      </span>
      <span
        v-else-if="tool.id === 'journal' && journalCount"
        class="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[var(--accent)] px-1 font-interface text-[10px] leading-4 text-[#101114]"
      >
        {{ journalCount }}
      </span>
    </button>
  </aside>
</template>

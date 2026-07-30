<script setup lang="ts">
import type { InteractionMessageData } from '~/types/interaction-ui'
import { inventoryConditionMeta } from '~/types/inventory'
import { projectInventoryItem } from '~/composables/useInventoryStore'

const props = defineProps<{
  message: InteractionMessageData
}>()

const emit = defineEmits<{
  copy: [text: string]
  edit: [payload: { text: string, itemIds: string[] }]
}>()

const selectedItemViews = computed(() =>
  (props.message.selected_items || []).map(projectInventoryItem),
)

const modeLabels = {
  action: 'Действие',
  speech: 'Речь',
  exploration: 'Исследование',
}

const outcomeLabels = {
  success: 'Успех',
  partial_success: 'Успех с ценой',
  failure: 'Неудача',
  impossible: 'Невозможно',
}
</script>

<template>
  <article
    data-interaction-message
    class="w-full max-w-[760px]"
    :class="message.role === 'player'
      ? 'ml-auto border-l-2 border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.065)] px-4 py-3'
      : 'mr-auto py-2'"
  >
    <header class="mb-1.5 flex items-center gap-2">
      <span
        class="grid size-7 shrink-0 place-items-center rounded-full border font-display text-[13px]"
        :class="message.role === 'player'
          ? 'border-[rgb(var(--accent-rgb)/.45)] bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]'
          : 'border-white/12 bg-white/[.035] text-fabula-300'"
        aria-hidden="true"
      >
        {{ message.role === 'player' ? 'Ты' : message.role === 'character' ? '◌' : '✦' }}
      </span>
      <strong class="font-display text-[16px] font-normal text-fabula-100">{{ message.speaker }}</strong>
      <span class="font-interface text-[10px] text-[#9b9ba6]">
        {{ message.mode ? modeLabels[message.mode] : message.outcome ? outcomeLabels[message.outcome] : '' }}
      </span>
    </header>

    <p class="whitespace-pre-line font-story text-[var(--story-font)] leading-[1.55] text-fabula-100">
      {{ message.text }}
    </p>

    <div v-if="selectedItemViews.length" class="mt-2 flex flex-wrap gap-2" aria-label="Предметы этого хода">
      <span
        v-for="item in selectedItemViews"
        :key="item.id"
        class="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-[rgb(var(--accent-rgb)/.38)] bg-[#111319] p-1 pr-2"
      >
        <InventoryItemIcon :item="item" size="slot" class="ring-1 ring-white/10" />
        <span class="min-w-0">
          <strong class="block truncate text-[11px] font-semibold leading-tight text-fabula-100">{{ item.name }}</strong>
          <span class="mt-0.5 flex items-center gap-1.5 text-[9px] leading-none text-fabula-300">
            <span class="rounded-md border px-1.5 py-0.5" :class="inventoryConditionMeta[item.condition].className">
              {{ item.conditionLabel }}
            </span>
            <span>{{ item.amountLabel }}</span>
          </span>
        </span>
      </span>
    </div>

    <footer class="mt-1.5 flex justify-end">
      <button
        v-if="message.role === 'player'"
        type="button"
        class="rounded-lg px-2 py-1 font-interface text-[10px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100"
        @click="emit('edit', {
          text: message.text,
          itemIds: (message.selected_items || []).map(item => item.id),
        })"
      >
        Изменить
      </button>
      <button
        v-else
        type="button"
        class="rounded-lg px-2 py-1 font-interface text-[10px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100"
        @click="emit('copy', message.text)"
      >
        Копировать
      </button>
    </footer>
  </article>
</template>

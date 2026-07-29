<script setup lang="ts">
import type { InteractionMessageData } from '~/types/interaction-ui'

defineProps<{
  message: InteractionMessageData
}>()

const emit = defineEmits<{
  copy: [text: string]
  edit: [text: string]
}>()

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

    <footer class="mt-1.5 flex justify-end">
      <button
        v-if="message.role === 'player'"
        type="button"
        class="rounded-lg px-2 py-1 font-interface text-[10px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100"
        @click="emit('edit', message.text)"
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

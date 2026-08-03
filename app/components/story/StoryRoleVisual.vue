<script setup lang="ts">
import type { StoryRoleVisual } from '#shared/storypacks'

defineProps<{
  kind?: StoryRoleVisual
  label: string
  selected?: boolean
  large?: boolean
}>()
</script>

<template>
  <span
    aria-hidden="true"
    class="grid shrink-0 place-items-center rounded-xl border transition"
    :class="[
      large ? 'size-16' : 'size-11',
      selected
        ? 'border-[var(--pack-accent)] bg-[rgb(var(--pack-accent-rgb)/.14)] text-[var(--pack-accent-light)]'
        : 'border-white/10 bg-white/[.035] text-fabula-300',
    ]"
  >
    <svg v-if="kind === 'medical'" viewBox="0 0 24 24" fill="none" class="size-6" stroke="currentColor" stroke-width="1.8">
      <path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4Z" />
    </svg>
    <svg v-else-if="kind === 'utility'" viewBox="0 0 24 24" fill="none" class="size-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
      <path d="m14.5 5.5-9 9a3 3 0 0 0 4 4l9-9" />
      <path d="M14 5a4 4 0 0 1 5-1l-3 3 1 2 3-3a4 4 0 0 1-5 5" />
    </svg>
    <svg v-else-if="kind === 'courier'" viewBox="0 0 24 24" fill="none" class="size-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
    <svg v-else-if="kind === 'officer'" viewBox="0 0 24 24" fill="none" class="size-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
      <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
    </svg>
    <svg v-else-if="kind === 'free'" viewBox="0 0 24 24" fill="none" class="size-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8">
      <path d="m4 20 4.2-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" />
      <path d="m13.8 7.4 3 3" />
    </svg>
    <span v-else class="font-display text-[17px] uppercase">{{ label.slice(0, 1) }}</span>
  </span>
</template>

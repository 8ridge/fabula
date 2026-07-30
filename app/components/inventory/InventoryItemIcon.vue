<script setup lang="ts">
import { ref, watch } from 'vue'
import type { InventoryItemView } from '~/types/inventory'

const props = withDefaults(defineProps<{
  item: InventoryItemView
  size?: 'slot' | 'card' | 'detail'
}>(), {
  size: 'card',
})

const imageFailed = ref(false)

const sizeClasses = {
  slot: 'size-9 rounded-lg text-lg',
  card: 'aspect-[1.28/1] w-full text-4xl',
  detail: 'min-h-52 w-full rounded-2xl text-7xl',
} as const

watch(
  () => [props.item.id, props.item.visual.assetUrl],
  () => {
    imageFailed.value = false
  },
)
</script>

<template>
  <span
    aria-hidden="true"
    :class="sizeClasses[size]"
    class="relative grid shrink-0 place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_42%,rgb(var(--accent-rgb)/.17),transparent_46%),linear-gradient(135deg,#222027,#111217)]"
  >
    <img
      v-if="item.visual.assetUrl && item.visual.status !== 'pending' && !imageFailed"
      :src="item.visual.assetUrl"
      alt=""
      class="absolute inset-0 h-full w-full object-cover"
      @error="imageFailed = true"
    >
    <span
      v-else
      class="relative z-[1] font-display text-[var(--accent-light)] drop-shadow-[0_5px_9px_rgba(0,0,0,.7)]"
    >
      {{ item.visual.symbol }}
    </span>
    <span class="pointer-events-none absolute inset-[14%] rotate-45 border border-[rgb(var(--accent-rgb)/.18)]" />
  </span>
</template>

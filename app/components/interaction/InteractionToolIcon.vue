<script setup lang="ts">
import type { InteractionToolName } from '~/types/interaction-ui'

defineProps<{
  tool: InteractionToolName
}>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="tool === 'inventory'">
      <path d="M6 8.5A4.5 4.5 0 0 1 10.5 4h3A4.5 4.5 0 0 1 18 8.5" />
      <path d="M5 8.5h14a2 2 0 0 1 2 2V20H3v-9.5a2 2 0 0 1 2-2Z" />
      <path d="M8 4V2.75h8V4M7.5 13h9M8.5 17h7" />
    </template>
    <template v-else-if="tool === 'journal'">
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v17H5.5A2.5 2.5 0 0 0 3 22.5Z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H13v17h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      <path d="M6 7h2.5M15.5 7H18" />
    </template>
    <template v-else-if="tool === 'character'">
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2M8 20h8" />
    </template>
    <template v-else-if="tool === 'world'">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
    </template>
    <template v-else>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </template>
  </svg>
</template>

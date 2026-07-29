<script setup lang="ts">
defineProps<{
  title: string
  action?: string
  brand?: boolean
}>()
</script>

<template>
  <header class="sticky top-0 z-20 mx-auto flex w-full max-w-[1120px] items-center justify-between bg-gradient-to-b from-[#0b0906ee] to-transparent py-4 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-[3px] min-[900px]:pt-8">
    <h1
      class="font-display text-[21px] text-fabula-100"
      :class="brand ? 'text-[19px] tracking-[.18em]' : 'tracking-[.22em]'"
    >
      {{ title }}
    </h1>
    <span v-if="action" class="grid min-h-9 min-w-9 place-items-center rounded-[11px] border border-white/10 bg-white/[.03] px-2 font-display text-[15px] text-fabula-300">
      {{ action }}
    </span>
  </header>
</template>

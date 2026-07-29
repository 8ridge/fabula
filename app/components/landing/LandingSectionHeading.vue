<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle: string
  spacious?: boolean
}>(), {
  spacious: false,
})
</script>

<template>
  <header
    data-reveal
    class="mx-auto text-center"
    :class="spacious ? 'mb-[clamp(38px,5vw,62px)] mt-[74px]' : 'mb-[clamp(38px,5vw,62px)]'"
  >
    <h2 class="mb-3.5 font-display text-[clamp(29px,4vw,46px)] leading-[1.1] text-fabula-100">
      {{ title }}
    </h2>
    <p class="mx-auto max-w-[56ch] text-[clamp(16px,1.6vw,18px)] text-fabula-300">
      {{ subtitle }}
    </p>
  </header>
</template>

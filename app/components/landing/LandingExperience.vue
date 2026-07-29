<script setup lang="ts">
const pageRoot = ref<HTMLElement | null>(null)
const featureStep = ref(0)
let featureTimer: ReturnType<typeof setInterval> | null = null

useLandingMotion(pageRoot)

onMounted(() => {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    featureTimer = setInterval(() => featureStep.value++, 2200)
})

onBeforeUnmount(() => {
  if (featureTimer)
    clearInterval(featureTimer)
})
</script>

<template>
  <div ref="pageRoot" class="min-h-screen overflow-x-hidden bg-fabula-950 font-story leading-normal text-fabula-100">
    <LandingHero />
    <LandingHow />
    <LandingWorlds />
    <LandingFeatures :feature-step="featureStep" />
    <LandingStoryProof />
    <LandingPricing />
    <LandingClosing />
  </div>
</template>

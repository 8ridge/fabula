<script setup>
useHead({
  link: [
    { rel: 'stylesheet', href: '/assets/fonts/fonts.css' },
  ],
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtPwaManifest />
  <NuxtPage />
</template>

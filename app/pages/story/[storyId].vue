<script setup lang="ts">
import { normalizeStoryPackId, STORY_PACKS } from '#shared/storypacks'

const route = useRoute()
const storyPackId = computed(() => normalizeStoryPackId(route.params.storyId))
const storyPack = computed(() => storyPackId.value ? STORY_PACKS[storyPackId.value] : null)

if (!storyPack.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'StoryPack не найден',
  })
}

useSeoMeta({
  title: () => `${storyPack.value?.title} — Fabula`,
  description: () => storyPack.value?.logline || 'Войти в историю Fabula',
})
</script>

<template>
  <StorySetupExperience v-if="storyPack" :story-pack="storyPack" />
</template>

<script setup lang="ts">
import { STORY_PACK_LIST } from '#shared/storypacks'
import type { HubStoryId } from '~/types/hub'

const emit = defineEmits<{
  openStory: [storyId: HubStoryId]
}>()

const query = ref('')
const filteredPacks = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase('ru')
  if (!needle)
    return STORY_PACK_LIST
  return STORY_PACK_LIST.filter((pack) => {
    const text = [
      pack.title,
      pack.shortTitle,
      pack.genre,
      pack.logline,
      ...pack.systemFocus,
    ].join(' ').toLocaleLowerCase('ru')
    return text.includes(needle)
  })
})
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[#0b0906]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="Четыре мира" />

      <div class="mx-auto max-w-[1120px]">
        <header class="mb-6 max-w-[720px]">
          <p class="font-interface text-[10px] uppercase tracking-[.18em] text-fabula-gold">StoryPack · версия 0.2</p>
          <h1 class="mt-2 font-display text-[24px] text-fabula-100">Выбери мир, а не готовый ответ</h1>
          <p class="mt-2 text-[15px] leading-relaxed text-fabula-500">
            Каждый пак закрепляет собственный канон, причинность, роли и правила. Внутри него ты создаешь отдельную личную ветку.
          </p>
        </header>

        <label class="mb-5 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.025] px-4 text-fabula-500 transition focus-within:border-fabula-gold/55">
          <span aria-hidden="true">⌕</span>
          <span class="sr-only">Найти StoryPack</span>
          <input
            v-model="query"
            type="search"
            autocomplete="off"
            placeholder="Название, жанр или игровая система"
            class="w-full bg-transparent text-[15px] text-fabula-100 outline-none placeholder:text-fabula-500"
          >
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <article
            v-for="pack in filteredPacks"
            :key="pack.id"
            class="group relative min-h-[360px] overflow-hidden rounded-3xl border border-white/10"
            :style="{ '--card-accent': pack.theme.accent, '--card-accent-light': pack.theme.accentLight }"
          >
            <img :src="pack.cover" :alt="pack.title" class="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]">
            <div class="absolute inset-0 bg-gradient-to-t from-[#080706] via-[#080706b8] to-[#08070626]" />
            <div class="relative flex min-h-[360px] flex-col justify-end p-5 sm:p-6">
              <div class="mb-auto flex items-center justify-between gap-3">
                <span class="rounded-full border border-white/15 bg-black/35 px-3 py-1.5 font-interface text-[10px] uppercase tracking-[.12em] text-[var(--card-accent-light)]">
                  {{ pack.genre }}
                </span>
                <span class="text-[20px] text-[var(--card-accent)]" aria-hidden="true">{{ pack.theme.icon }}</span>
              </div>
              <p class="font-interface text-[10px] uppercase tracking-[.14em] text-[var(--card-accent-light)]">{{ pack.season }}</p>
              <h2 class="mt-2 font-display text-[23px] leading-tight text-white">{{ pack.title }}</h2>
              <p class="mt-3 text-[15px] leading-relaxed text-fabula-300">{{ pack.logline }}</p>
              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="focus in pack.systemFocus"
                  :key="focus"
                  class="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] text-fabula-300"
                >
                  {{ focus }}
                </span>
              </div>
              <button
                type="button"
                class="mt-5 min-h-11 w-full rounded-xl bg-[var(--card-accent)] px-4 font-display text-[14px] uppercase tracking-[.09em] text-[#0b0906] transition hover:bg-[var(--card-accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--card-accent-light)]"
                @click="emit('openStory', pack.id)"
              >
                Создать свою ветку
              </button>
            </div>
          </article>
        </div>

        <p v-if="!filteredPacks.length" class="rounded-2xl border border-white/8 bg-white/[.02] p-6 text-center text-[15px] text-fabula-500">
          Среди четырех утвержденных StoryPack ничего не найдено.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GameSessionSummary } from '#shared/game'

defineProps<{
  sessions: GameSessionSummary[]
  loading: boolean
}>()

const emit = defineEmits<{
  openSession: [sessionId: string]
  browsePacks: []
}>()
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[#0b0906]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="Мои истории" />

      <div class="mx-auto max-w-[920px]">
        <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="font-interface text-[10px] uppercase tracking-[.18em] text-fabula-gold">Сохраненные ветки</p>
            <h1 class="mt-2 font-display text-[24px] text-fabula-100">Вернуться в свой канон</h1>
            <p class="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-fabula-500">
              Здесь нет демонстрационных историй: список собирается из сессий, которые ты действительно начал на этом устройстве.
            </p>
          </div>
          <button
            type="button"
            class="min-h-11 rounded-xl border border-fabula-gold/45 px-4 font-display text-[14px] text-fabula-gold transition hover:bg-fabula-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold"
            @click="emit('browsePacks')"
          >
            Новая история
          </button>
        </header>

        <p v-if="loading" class="rounded-2xl border border-white/8 bg-white/[.02] p-6 text-[15px] text-fabula-500">
          Загружаем сохраненные ветки…
        </p>

        <div v-else-if="sessions.length" class="grid gap-3">
          <button
            v-for="session in sessions"
            :key="session.id"
            type="button"
            class="group grid w-full grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/8 bg-white/[.025] p-3 text-left transition hover:border-fabula-gold/35 hover:bg-white/[.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold sm:p-4"
            @click="emit('openSession', session.id)"
          >
            <img :src="session.story_cover" alt="" class="h-[88px] w-[72px] rounded-xl object-cover">
            <span class="min-w-0">
              <span class="block truncate font-interface text-[10px] uppercase tracking-[.12em] text-fabula-gold">{{ session.role_label }}</span>
              <strong class="mt-1 block truncate font-display text-[19px] font-normal text-fabula-100">{{ session.story_title }}</strong>
              <span class="mt-1 block truncate text-[13px] text-fabula-500">{{ session.persona_name }} · {{ session.scene_title }}</span>
              <span class="mt-2 line-clamp-2 text-[13px] leading-relaxed text-fabula-300">{{ session.last_excerpt }}</span>
            </span>
            <span class="text-[20px] text-fabula-gold transition group-hover:translate-x-1" aria-hidden="true">→</span>
          </button>
        </div>

        <div v-else class="rounded-3xl border border-dashed border-white/12 bg-white/[.02] p-8 text-center">
          <span class="text-[22px] text-fabula-gold" aria-hidden="true">✦</span>
          <h2 class="mt-3 font-display text-[21px] text-fabula-100">Пока нет начатых историй</h2>
          <p class="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-fabula-500">
            Выбери один из четырех StoryPack, создай воплощение и начни личную ветку.
          </p>
          <button
            type="button"
            class="mt-5 min-h-11 rounded-xl bg-fabula-gold px-5 font-display text-[14px] uppercase tracking-[.09em] text-[#151006] hover:bg-fabula-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold-light"
            @click="emit('browsePacks')"
          >
            Выбрать мир
          </button>
        </div>

        <NuxtLink
          to="/"
          class="mt-6 inline-flex min-h-10 items-center rounded-xl px-3 font-display text-[14px] text-fabula-500 no-underline transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold"
        >
          ← Вернуться на лендинг
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

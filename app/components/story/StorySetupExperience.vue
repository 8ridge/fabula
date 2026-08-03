<script setup lang="ts">
import type {
  GameSessionSummary,
  ListGameSessionsResponse,
} from '#shared/game'
import type { StoryPack } from '#shared/storypacks'

const props = defineProps<{
  storyPack: StoryPack
}>()

const router = useRouter()
const startedSessions = ref<GameSessionSummary[]>([])
const loadingSessions = ref(true)
const setupOpen = ref(false)
const setupTrigger = ref<HTMLButtonElement | null>(null)

const packSessions = computed(() => startedSessions.value.filter(session => session.story_pack_id === props.storyPack.id))
const themeStyle = computed(() => ({
  '--pack-accent': props.storyPack.theme.accent,
  '--pack-accent-light': props.storyPack.theme.accentLight,
  '--pack-accent-deep': props.storyPack.theme.accentDeep,
  '--pack-accent-rgb': props.storyPack.theme.accentRgb,
  '--pack-surface': props.storyPack.theme.surfaceTint,
}))

onMounted(async () => {
  try {
    const response = await $fetch<ListGameSessionsResponse>('/api/game/sessions')
    startedSessions.value = response.sessions
  }
  catch {
    startedSessions.value = []
  }
  finally {
    loadingSessions.value = false
  }
})

function continueSession(sessionId: string) {
  return router.push({ path: '/interaction', query: { session: sessionId } })
}

function openSetup() {
  setupOpen.value = true
}

function closeSetup() {
  setupOpen.value = false
  nextTick(() => setupTrigger.value?.focus())
}
</script>

<template>
  <main
    :style="themeStyle"
    class="min-h-dvh bg-[#09090b] text-fabula-100 [background-image:radial-gradient(circle_at_75%_0%,rgb(var(--pack-accent-rgb)/.12),transparent_34%)]"
  >
    <header class="sticky top-0 z-30 border-b border-white/8 bg-[#09090be8] backdrop-blur-xl">
      <div class="mx-auto flex h-16 w-[min(1180px,92vw)] items-center justify-between gap-4">
        <NuxtLink
          to="/app"
          class="inline-flex min-h-10 items-center gap-2 rounded-full px-3 font-display text-[14px] text-fabula-300 no-underline transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
        >
          <span aria-hidden="true">←</span>
          <span>Все истории</span>
        </NuxtLink>
        <NuxtLink to="/" class="font-display text-[15px] tracking-[.24em] text-fabula-100 no-underline">
          ФАБУЛА
        </NuxtLink>
      </div>
    </header>

    <div class="mx-auto grid w-[min(1180px,92vw)] gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.72fr)] lg:py-12">
      <section class="min-w-0">
        <div class="relative mb-7 min-h-[300px] overflow-hidden rounded-3xl border border-white/10">
          <img :src="storyPack.cover" :alt="storyPack.title" class="absolute inset-0 h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b99] to-transparent" />
          <div class="relative flex min-h-[300px] flex-col justify-end p-6 sm:p-8">
            <p class="mb-3 font-interface text-[10px] uppercase tracking-[.2em] text-[var(--pack-accent-light)]">
              {{ storyPack.eyebrow }} · {{ storyPack.rating }}
            </p>
            <h1 class="max-w-[22ch] font-display text-[clamp(22px,3vw,24px)] leading-tight text-white">
              {{ storyPack.title }}
            </h1>
            <p class="mt-3 max-w-[62ch] text-[clamp(16px,2vw,18px)] leading-relaxed text-fabula-100">
              {{ storyPack.logline }}
            </p>
          </div>
        </div>

        <div class="mb-8 grid gap-3 sm:grid-cols-2">
          <article class="rounded-2xl border border-white/8 bg-white/[.025] p-5">
            <p class="mb-2 font-interface text-[10px] uppercase tracking-[.16em] text-[var(--pack-accent)]">Кем ты станешь</p>
            <p class="text-[16px] leading-relaxed text-fabula-300">{{ storyPack.entryFantasy }}</p>
          </article>
          <article class="rounded-2xl border border-white/8 bg-white/[.025] p-5">
            <p class="mb-2 font-interface text-[10px] uppercase tracking-[.16em] text-[var(--pack-accent)]">Что обещает мир</p>
            <p class="text-[16px] leading-relaxed text-fabula-300">{{ storyPack.promise }}</p>
          </article>
        </div>

        <section v-if="packSessions.length" class="mb-8" aria-labelledby="continue-title">
          <div class="mb-3 flex items-end justify-between gap-4">
            <div>
              <p class="font-interface text-[10px] uppercase tracking-[.16em] text-fabula-500">Твои ветки</p>
              <h2 id="continue-title" class="mt-1 font-display text-[21px] text-fabula-100">Продолжить историю</h2>
            </div>
            <span class="text-[13px] text-fabula-500">{{ packSessions.length }}</span>
          </div>
          <div class="grid gap-2.5">
            <button
              v-for="session in packSessions"
              :key="session.id"
              type="button"
              class="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/[.025] p-4 text-left transition hover:border-[rgb(var(--pack-accent-rgb)/.5)] hover:bg-white/[.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
              @click="continueSession(session.id)"
            >
              <img :src="session.story_cover" alt="" class="size-14 rounded-xl object-cover">
              <span class="min-w-0 flex-1">
                <strong class="block truncate font-display text-[17px] font-normal text-fabula-100">{{ session.persona_name }}</strong>
                <span class="mt-1 block truncate text-[13px] text-fabula-500">{{ session.role_label }} · {{ session.scene_title }}</span>
              </span>
              <span class="text-[18px] text-[var(--pack-accent)] transition group-hover:translate-x-1" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </section>

      <aside class="lg:sticky lg:top-24 lg:self-start">
        <section class="overflow-hidden rounded-3xl border border-white/10 bg-[#111114] shadow-2xl">
          <div class="border-b border-white/8 bg-[rgb(var(--pack-accent-rgb)/.07)] p-6 sm:p-7">
            <p class="font-interface text-[10px] uppercase tracking-[.18em] text-[var(--pack-accent)]">Новая личная ветка</p>
            <h2 class="mt-2 font-display text-[26px] leading-tight text-fabula-100">Создай своего героя</h2>
            <p class="mt-3 text-[15px] leading-relaxed text-fabula-500">Кем ты был вчера? Что умеешь лучше других? Ради чего готов шагнуть в неизвестность?</p>
          </div>

          <ol class="grid gap-0 px-6 py-2 sm:px-7" aria-label="Этапы настройки героя">
            <li class="flex gap-4 border-b border-white/8 py-4">
              <span class="grid size-8 shrink-0 place-items-center rounded-full border border-[rgb(var(--pack-accent-rgb)/.5)] font-interface text-[11px] text-[var(--pack-accent-light)]">1</span>
              <span><strong class="block font-display text-[15px] font-normal text-fabula-100">Кто ты</strong><span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">Профессия и вещь, которая осталась при тебе</span></span>
            </li>
            <li class="flex gap-4 border-b border-white/8 py-4">
              <span class="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 font-interface text-[11px] text-fabula-400">2</span>
              <span><strong class="block font-display text-[15px] font-normal text-fabula-100">Что ты умеешь</strong><span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">Навык, который может спасти тебя и других</span></span>
            </li>
            <li class="flex gap-4 py-4">
              <span class="grid size-8 shrink-0 place-items-center rounded-full border border-white/15 font-interface text-[11px] text-fabula-400">3</span>
              <span><strong class="block font-display text-[15px] font-normal text-fabula-100">Ради чего идешь дальше</strong><span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">Цель и прошлое, которое не отпускает</span></span>
            </li>
          </ol>

          <div class="px-6 pb-6 sm:px-7 sm:pb-7">
            <button
              ref="setupTrigger"
              type="button"
              class="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--pack-accent)] px-5 font-display text-[14px] uppercase tracking-[.08em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)]"
              @click="openSetup"
            >
              Настроить героя
            </button>
            <p class="mt-3 text-center text-[11px] leading-relaxed text-fabula-500">Выбери, кем ты станешь, и начни свою ветку.</p>
          </div>
        </section>

        <p v-if="loadingSessions" class="mt-3 text-center text-[12px] text-fabula-500">Проверяем начатые истории…</p>
      </aside>
    </div>

    <StoryPersonaSetupModal
      v-if="setupOpen"
      :story-pack="storyPack"
      @close="closeSetup"
    />
  </main>
</template>

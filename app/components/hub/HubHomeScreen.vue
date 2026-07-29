<script setup lang="ts">
import type { GameSessionSummary } from '#shared/game'
import { STORY_PACKS } from '#shared/storypacks'
import type { HubStoryId } from '~/types/hub'

defineProps<{
  sessions: GameSessionSummary[]
  loading: boolean
}>()

const emit = defineEmits<{
  openStory: [storyId: HubStoryId]
  openSession: [sessionId: string]
}>()

const featured = STORY_PACKS['eighth-seal']
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[#0b0906]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="ФАБУЛА" brand />

      <div class="mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.7fr)]">
        <article class="relative flex min-h-[430px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
          <img class="absolute inset-0 h-full w-full object-cover" :src="featured.cover" :alt="featured.title">
          <div class="absolute inset-0 bg-gradient-to-t from-[#080706] via-[#08070699] to-[#0807061a]" />
          <div class="relative z-[2] max-w-[620px]">
            <p class="mb-3 font-interface text-[10px] uppercase tracking-[.2em] text-fabula-gold-light">
              {{ featured.eyebrow }} · {{ featured.rating }}
            </p>
            <h1 class="font-display text-[clamp(22px,3vw,24px)] leading-tight text-white">
              {{ featured.title }}
            </h1>
            <p class="mt-3 max-w-[56ch] text-[clamp(16px,1.6vw,18px)] leading-relaxed text-fabula-100">
              {{ featured.logline }}
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span
                v-for="focus in featured.systemFocus"
                :key="focus"
                class="rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-[11px] text-fabula-300"
              >
                {{ focus }}
              </span>
            </div>
            <button
              type="button"
              class="mt-6 min-h-11 rounded-xl bg-fabula-gold px-5 font-display text-[14px] uppercase tracking-[.1em] text-[#151006] transition hover:bg-fabula-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold-light"
              @click="emit('openStory', featured.id)"
            >
              Выбрать воплощение
            </button>
          </div>
        </article>

        <aside class="rounded-3xl border border-white/8 bg-white/[.025] p-5 sm:p-6">
          <p class="font-interface text-[10px] uppercase tracking-[.16em] text-fabula-500">Твои ветки</p>
          <h2 class="mt-1 font-display text-[22px] text-fabula-100">Продолжить</h2>

          <p v-if="loading" class="mt-5 text-[14px] leading-relaxed text-fabula-500">
            Загружаем сохраненные истории…
          </p>

          <div v-else-if="sessions.length" class="mt-5 space-y-2.5">
            <button
              v-for="session in sessions.slice(0, 4)"
              :key="session.id"
              type="button"
              class="group flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-black/15 p-3 text-left transition hover:border-fabula-gold/40 hover:bg-white/[.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold"
              @click="emit('openSession', session.id)"
            >
              <img :src="session.story_cover" alt="" class="size-12 shrink-0 rounded-xl object-cover">
              <span class="min-w-0 flex-1">
                <strong class="block truncate font-display text-[16px] font-normal text-fabula-100">{{ session.story_title }}</strong>
                <span class="mt-1 block truncate text-[12px] text-fabula-500">{{ session.persona_name }} · {{ session.scene_title }}</span>
              </span>
              <span class="text-[18px] text-fabula-gold transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
            </button>
          </div>

          <div v-else class="mt-5">
            <p class="text-[14px] leading-relaxed text-fabula-500">
              Здесь появятся только действительно начатые истории. Выбери мир и создай первое воплощение.
            </p>
            <button
              type="button"
              class="mt-4 text-left font-display text-[14px] text-fabula-gold hover:text-fabula-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fabula-gold"
              @click="emit('openStory', featured.id)"
            >
              Начать с «Восьмой печати» →
            </button>
          </div>

          <div class="mt-6 border-t border-white/8 pt-5">
            <p class="font-interface text-[10px] uppercase tracking-[.16em] text-fabula-500">Как устроена игра</p>
            <p class="mt-2 text-[14px] leading-relaxed text-fabula-300">
              Свободный ход, предложенные варианты ответа и подтвержденные последствия работают в одной сохраненной ветке.
            </p>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

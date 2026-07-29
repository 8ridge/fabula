<script setup lang="ts">
import { gsap } from 'gsap'
import { motion } from 'motion-v'

const MotionDiv = motion.div
const sceneStarted = ref(false)
const stage = ref<HTMLElement | null>(null)
const reducedMotionPreference = usePreferredReducedMotion()
const prefersReducedMotion = computed(() => reducedMotionPreference.value === 'reduce')

onMounted(() => {
  if (!stage.value || prefersReducedMotion.value)
    return

  gsap.fromTo(
    stage.value,
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
  )
})

function startScene() {
  sceneStarted.value = true

  if (!stage.value || prefersReducedMotion.value)
    return

  gsap.fromTo(
    stage.value,
    { scale: 0.985 },
    { scale: 1, duration: 0.45, ease: 'back.out(1.4)' },
  )
}
</script>

<template>
  <div class="min-h-screen overflow-hidden bg-slate-950 text-slate-100">
    <NuxtRouteAnnouncer />
    <NuxtPwaManifest />

    <main class="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-10 sm:px-8">
      <section ref="stage" class="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div class="space-y-7">
          <p class="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-200">
            Nuxt 4.5.1 · Fabula
          </p>

          <div class="space-y-4">
            <h1 class="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              История, которая помнит твой выбор.
            </h1>
            <p class="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Базовый экран проекта готов: Tailwind отвечает за ритм интерфейса, GSAP - за сценические переходы, Motion - за живые состояния компонентов.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              class="rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
              type="button"
              @click="startScene"
            >
              {{ sceneStarted ? 'Сцена началась' : 'Начать сцену' }}
            </button>
            <span class="text-sm text-slate-400" aria-live="polite">
              {{ sceneStarted ? 'Состояние интерфейса обновлено без перезагрузки.' : 'Готово к первому ходу.' }}
            </span>
          </div>
        </div>

        <MotionDiv
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur"
          :initial="{ opacity: 0, scale: 0.96, y: 14 }"
          :animate="{ opacity: 1, scale: 1, y: 0 }"
          :transition="{ duration: prefersReducedMotion ? 0 : 0.55, ease: 'easeOut' }"
        >
          <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-300/20 blur-3xl" aria-hidden="true" />
          <div class="relative space-y-6">
            <div class="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
              <span>Состояние системы</span>
              <span class="text-emerald-300">Online</span>
            </div>

            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <span class="text-slate-300">Nuxt runtime</span>
                <span class="font-medium text-white">4.5.1</span>
              </div>
              <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <span class="text-slate-300">Motion layer</span>
                <span class="font-medium text-cyan-200">GSAP + Motion</span>
              </div>
              <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <span class="text-slate-300">PWA mode</span>
                <span class="font-medium text-amber-200">Prompt update</span>
              </div>
            </div>
          </div>
        </MotionDiv>
      </section>
    </main>
  </div>
</template>

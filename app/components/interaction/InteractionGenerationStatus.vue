<script setup lang="ts">
import { gsap } from 'gsap'
import type { StoryMode } from '#shared/storypacks'

const props = defineProps<{
  intent: string
  mode: StoryMode
  personaName: string
}>()

const emit = defineEmits<{
  cancel: []
}>()

const root = ref<HTMLElement | null>(null)
let animationContext: gsap.Context | null = null

const intentExcerpt = computed(() => props.intent.length > 110
  ? `${props.intent.slice(0, 107)}…`
  : props.intent)
const modeLabel = computed(() => ({
  action: 'Действие',
  exploration: 'Исследование',
  speech: 'Реплика',
})[props.mode])

onMounted(() => {
  if (!root.value || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    return
  animationContext = gsap.context(() => {
    gsap.to('[data-generation-orbit]', {
      rotate: 360,
      duration: 7,
      ease: 'none',
      repeat: -1,
      transformOrigin: '50% 50%',
    })
    gsap.to('[data-generation-dot]', {
      autoAlpha: 0.28,
      y: -3,
      duration: 0.65,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      stagger: 0.16,
    })
    gsap.fromTo(
      '[data-generation-trace]',
      { xPercent: -120 },
      { xPercent: 260, duration: 2.8, ease: 'power1.inOut', repeat: -1, repeatDelay: 0.3 },
    )
  }, root.value)
})

onBeforeUnmount(() => animationContext?.revert())
</script>

<template>
  <section
    ref="root"
    class="relative my-2 overflow-hidden border-l border-[rgb(var(--accent-rgb)/.55)] py-2.5 pl-4 pr-1"
    role="status"
    aria-live="polite"
    aria-label="Формируется продолжение истории"
  >
    <span
      data-generation-trace
      class="absolute bottom-0 left-0 h-px w-1/3 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70"
      aria-hidden="true"
    />

    <div class="flex items-start gap-3">
      <span data-generation-orbit class="relative mt-0.5 grid size-7 shrink-0 place-items-center text-[16px] text-[var(--accent)]" aria-hidden="true">
        ◇
        <i class="absolute right-0 top-0 size-1 rounded-full bg-[var(--accent-light)]" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <strong class="font-display text-[15px] font-normal text-fabula-100">Рассказчик продолжает историю</strong>
          <span class="inline-flex gap-1 text-[10px] text-[var(--accent)]" aria-hidden="true">
            <i v-for="dot in 3" :key="dot" data-generation-dot class="size-1 rounded-full bg-current" />
          </span>
        </div>
        <p class="mt-1 truncate font-story text-[13px] italic text-[#9b9ba6]" :title="intent">«{{ intentExcerpt }}»</p>
        <p class="mt-1 font-interface text-[10px] text-[var(--accent-light)]">
          {{ personaName }} · {{ modeLabel }}
        </p>

        <button type="button" class="mt-2 font-interface text-[11px] text-[#9b9ba6] transition hover:text-red-100" @click="emit('cancel')">
          Остановить
        </button>
      </div>
    </div>
  </section>
</template>

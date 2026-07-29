<script setup lang="ts">
import { STORY_PACKS } from '#shared/storypacks'

type DemoMessage = {
  id: string
  type: 'narrator' | 'context' | 'player' | 'system'
  title?: string
  text: string
  image?: string
  label?: string
  detail?: string
}

const root = ref<HTMLElement | null>(null)
const visibleMessages = ref<DemoMessage[]>([])
const awaitingChoice = ref(false)
const selectedChoice = ref<number | null>(null)
const running = ref(false)
const timer = ref<ReturnType<typeof setTimeout> | null>(null)
let generation = 0
let resolveWait: (() => void) | null = null
let observer: IntersectionObserver | null = null

const storyPack = STORY_PACKS['eighth-seal']
const choices = storyPack.opening.suggestions.map(suggestion => suggestion.label)

const opening: DemoMessage[] = [
  {
    id: 'opening',
    type: 'narrator',
    title: storyPack.title,
    text: 'Семь кругов горят ровно. Над каждым придворный писец записывает имя нового героя. Под твоими ногами линии восьмого круга обрываются, словно чертеж остановили на полуслове.',
  },
  {
    id: 'blade',
    type: 'narrator',
    image: '/assets/keyframe_01.jpg',
    text: 'Защитные печати поворачиваются к тебе острыми гранями. Молодая архивистка роняет свиток и шепчет: «Не позволяй королю назвать тебя».',
  },
  {
    id: 'inventory',
    type: 'context',
    label: 'Предмет рядом',
    text: 'Пустая медная печать',
    detail: 'без имени, сформулированного договора и владельца',
  },
  {
    id: 'keeper',
    type: 'narrator',
    image: '/assets/keyframe_02.jpg',
    text: 'Рыцари еще не понимают, что произошло. Архивистка смотрит не на тебя, а на разрыв в восьмом круге и пустую печать у камня.',
  },
  {
    id: 'journal',
    type: 'context',
    label: 'Запись в журнале',
    text: storyPack.opening.journalTitle,
    detail: storyPack.opening.objective,
  },
]

function clearTimer(resolvePending = false) {
  if (timer.value)
    clearTimeout(timer.value)
  timer.value = null
  if (resolvePending)
    resolveWait?.()
  resolveWait = null
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    clearTimer()
    resolveWait = () => {
      resolveWait = null
      timer.value = null
      resolve()
    }
    timer.value = setTimeout(() => resolveWait?.(), ms)
  })
}

async function play() {
  const currentGeneration = ++generation
  running.value = true
  awaitingChoice.value = false
  selectedChoice.value = null
  visibleMessages.value = []

  for (const message of opening) {
    if (currentGeneration !== generation)
      return
    visibleMessages.value.push(message)
    await nextTick()
    await wait(message.image ? 1600 : 1100)
  }

  if (currentGeneration === generation)
    awaitingChoice.value = true
}

async function choose(index: number) {
  if (!awaitingChoice.value)
    return
  selectedChoice.value = index
  awaitingChoice.value = false
  visibleMessages.value.push({
    id: `choice-${Date.now()}`,
    type: 'player',
    text: choices[index] ?? choices[0]!,
  })
  await wait(900)
  visibleMessages.value.push({
    id: `system-${Date.now()}`,
    type: 'system',
    text: 'Движок проверяет канон, предметы и последствия выбранного действия…',
  })
  await wait(3600)
  if (running.value)
    void play()
}

function advance() {
  if (awaitingChoice.value)
    return
  resolveWait?.()
}

onMounted(() => {
  const host = root.value
  if (!host)
    return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visibleMessages.value = opening
    awaitingChoice.value = true
    return
  }
  observer = new IntersectionObserver(([entry]) => {
    running.value = Boolean(entry?.isIntersecting)
    if (running.value && visibleMessages.value.length === 0)
      void play()
    if (!running.value) {
      generation++
      clearTimer(true)
    }
  }, { threshold: 0.2 })
  observer.observe(host)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  running.value = false
  generation++
  clearTimer(true)
})
</script>

<template>
  <div ref="root" data-reveal class="relative mx-auto w-full max-w-[1180px] py-[3%] [perspective:1750px] [perspective-origin:50%_0]">
    <div
      id="gp"
      data-gameplay
      class="relative z-[1] flex h-[clamp(460px,64vh,620px)] w-full origin-top flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-[#17151a] shadow-[0_60px_120px_-50px_#000] [transform:rotateX(var(--tilt,13deg))_scale(var(--scale,.94))] max-sm:min-h-[66vh] max-sm:transform-none"
    >
      <div class="min-h-0 flex-1 overflow-y-auto px-[2.4%] pb-[.4em] pt-[1.6em] [overscroll-behavior:contain] [scrollbar-width:none]" aria-live="polite">
        <div
          v-for="message in visibleMessages"
          :key="message.id"
          class="mb-[.7em] text-[clamp(15px,1.15vw,17px)]"
          :class="message.type === 'context'
            ? 'relative my-[.5em] mb-[1.1em] flex flex-col gap-[.3em] py-[.8em] pl-[1.4em] before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-fabula-gold/60 before:to-transparent before:content-[\'\'] after:absolute after:left-[-.22em] after:top-[calc(50%-.22em)] after:size-[.44em] after:rotate-45 after:bg-fabula-gold after:content-[\'\']'
            : message.type === 'player'
              ? 'indent-[1.6em] font-story text-base italic leading-[1.52] text-[#e8c97a]'
              : message.type === 'system'
                ? 'font-display text-xs text-fabula-500'
                : ''"
        >
          <div v-if="message.image" class="mb-[13px] max-h-[clamp(170px,26vh,290px)] overflow-hidden rounded-lg [aspect-ratio:2.6/1]">
            <img :src="message.image" alt="" loading="lazy" class="h-full w-full object-cover">
          </div>
          <p v-if="message.type === 'narrator'" class="indent-[1.6em] font-story text-[17px] italic leading-[1.58] text-[#b9b2a6] max-sm:text-[15px]">
            {{ message.text }}
          </p>
          <template v-else-if="message.type === 'context'">
            <span class="font-display text-[.62em] uppercase tracking-[.24em] text-fabula-gold/85">{{ message.label }}</span>
            <b class="font-display text-[1.15em] font-normal not-italic leading-[1.15] text-[#ece5d7]">{{ message.text }}</b>
            <i class="text-[.9em] italic leading-[1.4] text-[#8d8579]">{{ message.detail }}</i>
          </template>
          <template v-else>
            {{ message.text }}
          </template>
        </div>
      </div>
      <div class="flex flex-none flex-col gap-[.5em] px-[2.4%] max-sm:px-4">
        <template v-if="awaitingChoice">
          <div class="my-1.5 mb-0.5 font-display text-[10px] uppercase tracking-[.14em] text-fabula-gold">
            Что ты сделаешь?
          </div>
          <button
            v-for="(choice, index) in choices"
            :key="choice"
            class="cursor-pointer rounded-lg border border-white/[.08] bg-white/[.02] px-4 py-[.6em] text-left text-[#cfc7bb] transition duration-300 hover:border-fabula-gold/30 hover:bg-fabula-gold/[.09] hover:text-[#f0e8d8]"
            :class="{ 'border-fabula-gold/40 bg-fabula-gold/[.09]': selectedChoice === index }"
            type="button"
            @click="choose(index)"
          >
            <span class="mr-2 font-display text-fabula-gold">{{ index + 1 }}</span>{{ choice }}
          </button>
        </template>
      </div>
      <div class="mx-[2%] mb-[1.1em] mt-[.9em] flex flex-none justify-end border-t border-white/[.06] pt-[.9em] max-sm:mx-3.5 max-sm:mb-3.5">
        <button
          class="cursor-pointer rounded-lg border border-white/12 bg-white/[.02] px-[1.6em] py-[.7em] font-display text-[clamp(11px,.85em,13px)] tracking-[.1em] text-[#b9b2a6] transition duration-300 hover:border-fabula-gold/35 hover:bg-fabula-gold/[.08] hover:text-[#f0e8d8]"
          type="button"
          :class="{ 'border-fabula-gold/35 bg-fabula-gold/[.07] text-[#f0e8d8]': !awaitingChoice }"
          @click="advance"
        >
          Дальше ➤
        </button>
      </div>
    </div>
  </div>
</template>

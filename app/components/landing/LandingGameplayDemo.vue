<script setup lang="ts">
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

const choices = [
  'Пойти к деревне - там могут быть выжившие.',
  'Ступить на мост навстречу незнакомцу.',
  'Расспросить старика, кто ты такой.',
]

const opening: DemoMessage[] = [
  {
    id: 'opening',
    type: 'narrator',
    title: 'Королевство Пепельных земель',
    text: 'Древние хроники лгали - мир не погиб в одночасье. Он умирал медленно, век за веком, пока от цветущих долин Эхокарта не остался лишь серый пепел.',
  },
  {
    id: 'blade',
    type: 'narrator',
    image: '/assets/keyframe_01.jpg',
    text: 'Среди обломков рука натыкается на сталь - теплый клинок, будто им только что рубили. На лезвии герб, которого ты не узнаешь: три звезды над разбитой короной.',
  },
  {
    id: 'inventory',
    type: 'context',
    label: 'Найден предмет',
    text: 'Клинок Тихого Пепла',
    detail: 'чужое клеймо у гарды, рукоять холодная на ощупь',
  },
  {
    id: 'keeper',
    type: 'narrator',
    image: '/assets/keyframe_02.jpg',
    text: '"Значит, ты все-таки проснулся", - раздается хриплый голос за спиной. Старик смотрит не на тебя - только на клинок в твоей руке.',
  },
  {
    id: 'journal',
    type: 'context',
    label: 'Запись в журнале',
    text: 'Старик-хранитель',
    detail: 'двадцать лет ждал того, кто поднимет меч',
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
    text: 'ИИ дописывает следующую главу по твоему выбору…',
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
  <div ref="root" class="gp-wrap rv">
    <div id="gp" class="gp">
      <div class="gp-chat" aria-live="polite">
        <div
          v-for="message in visibleMessages"
          :key="message.id"
          class="gp-m"
          :class="{
            nar: message.type === 'narrator',
            ctx: message.type === 'context',
            me: message.type === 'player',
            sys: message.type === 'system',
          }"
        >
          <div v-if="message.image" class="kf">
            <img :src="message.image" alt="" loading="lazy">
          </div>
          <p v-if="message.type === 'narrator'">
            {{ message.text }}
          </p>
          <template v-else-if="message.type === 'context'">
            <span class="k">{{ message.label }}</span>
            <b>{{ message.text }}</b>
            <i>{{ message.detail }}</i>
          </template>
          <template v-else>
            {{ message.text }}
          </template>
        </div>
      </div>
      <div class="gp-foot">
        <template v-if="awaitingChoice">
          <div class="gp-q">
            Что ты сделаешь?
          </div>
          <button
            v-for="(choice, index) in choices"
            :key="choice"
            class="gp-c"
            :class="{ pick: selectedChoice === index }"
            type="button"
            @click="choose(index)"
          >
            <span class="n">{{ index + 1 }}</span>{{ choice }}
          </button>
        </template>
      </div>
      <div class="gp-bar">
        <button class="gp-send" type="button" :class="{ hot: !awaitingChoice }" @click="advance">
          Дальше ➤
        </button>
      </div>
    </div>
  </div>
</template>

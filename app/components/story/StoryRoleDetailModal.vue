<script setup lang="ts">
import type { StoryRole } from '#shared/storypacks'

const props = defineProps<{
  role: StoryRole
  storyTitle: string
  selected: boolean
}>()

const emit = defineEmits<{
  close: []
  select: []
}>()

const dialog = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
let previousBodyOverflow = ''

const isFreeRole = computed(() => props.role.id.endsWith(':free'))
const conditionLabel = computed(() => {
  const condition = props.role.startingItem?.condition
  return condition === 'pristine' ? 'новый' : condition === 'usable' ? 'исправный' : 'потертый'
})

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  nextTick(() => closeButton.value?.focus())
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
})

function close() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !dialog.value)
    return

  const focusable = [...dialog.value.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )]
  if (!focusable.length)
    return
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-6"
    @mousedown.self="close"
  >
    <section
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-role-title"
      aria-describedby="story-role-description"
      class="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#111114] shadow-2xl [scrollbar-width:thin] sm:max-w-[680px] sm:rounded-3xl"
      @keydown="handleKeydown"
    >
      <header class="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-white/8 bg-[#111114ee] px-5 py-5 backdrop-blur-xl sm:px-7">
        <div>
          <p class="font-interface text-[10px] uppercase tracking-[.18em] text-[var(--pack-accent-light)]">
            {{ isFreeRole ? 'Собственный пресет' : 'Специализация' }} · {{ storyTitle }}
          </p>
          <h2 id="story-role-title" class="mt-1 font-display text-[25px] leading-tight text-fabula-100">
            {{ role.label }}
          </h2>
        </div>
        <button
          ref="closeButton"
          type="button"
          aria-label="Закрыть описание специализации"
          class="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-[22px] text-fabula-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
          @click="close"
        >
          ×
        </button>
      </header>

      <div class="px-5 py-6 sm:px-7 sm:py-7">
        <p id="story-role-description" class="text-[16px] leading-relaxed text-fabula-300">
          <template v-if="isFreeRole">
            Чистая основа для собственного героя. Ты сам задашь название роли, практическую компетенцию, уязвимость, мотивацию и прошлое — мир будет учитывать именно твои формулировки.
          </template>
          <template v-else>
            Это отправная точка героя, а не жесткий класс. На следующем шаге можно переписать название, компетенцию и ограничение, сохранив связь с каноном выбранной истории.
          </template>
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-2">
          <article class="rounded-2xl border border-white/8 bg-white/[.025] p-4">
            <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Сильная сторона</p>
            <p class="mt-2 text-[15px] leading-relaxed text-fabula-100">{{ role.competence }}</p>
          </article>
          <article class="rounded-2xl border border-white/8 bg-white/[.025] p-4">
            <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Цена и граница</p>
            <p class="mt-2 text-[15px] leading-relaxed text-fabula-100">{{ role.limitation }}</p>
          </article>
        </div>

        <article v-if="role.startingItem" class="mt-3 rounded-2xl border border-white/8 bg-white/[.025] p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Стартовый предмет</p>
              <h3 class="mt-1 font-display text-[18px] font-normal text-fabula-100">{{ role.startingItem.name }}</h3>
            </div>
            <span class="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-fabula-500">
              {{ conditionLabel }}<template v-if="role.startingItem.charges !== null"> · {{ role.startingItem.charges }} исп.</template>
            </span>
          </div>
          <p class="mt-2 text-[14px] leading-relaxed text-fabula-300">{{ role.startingItem.description }}</p>
        </article>

        <p class="mt-5 rounded-2xl border border-[rgb(var(--pack-accent-rgb)/.22)] bg-[rgb(var(--pack-accent-rgb)/.07)] px-4 py-3 text-[13px] leading-relaxed text-fabula-300">
          Стартовый предмет закреплен за этой основой. Все параметры личности можно отредактировать перед входом в историю.
        </p>
      </div>

      <footer class="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-white/8 bg-[#111114ee] px-5 py-4 backdrop-blur-xl sm:flex-row sm:justify-end sm:px-7">
        <button
          type="button"
          class="min-h-11 rounded-xl border border-white/10 px-5 text-[13px] text-fabula-300 transition hover:border-white/25 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
          @click="close"
        >
          Вернуться к списку
        </button>
        <button
          type="button"
          class="min-h-11 rounded-xl bg-[var(--pack-accent)] px-5 font-display text-[13px] uppercase tracking-[.08em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)]"
          @click="emit('select')"
        >
          {{ selected ? 'Оставить эту основу' : 'Выбрать эту основу' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import type {
  CreateGameSessionRequest,
  CreateGameSessionResponse,
  PlayerPersonaInput,
} from '#shared/game'
import type { StoryPack, StoryRole } from '#shared/storypacks'

const props = defineProps<{
  storyPack: StoryPack
}>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const dialog = ref<HTMLFormElement | null>(null)
const dialogTitle = ref<HTMLHeadingElement | null>(null)
const step = ref<1 | 2 | 3>(1)
const selectedRoleId = ref('')
const name = ref('')
const roleLabel = ref('')
const competence = ref('')
const limitation = ref('')
const motivation = ref('')
const background = ref('')
const narrationDensity = ref<PlayerPersonaInput['narration_density']>('balanced')
const submitting = ref(false)
const errorMessage = ref('')
let previousBodyOverflow = ''

const selectedRole = computed(() => props.storyPack.roles.find(role => role.id === selectedRoleId.value) || null)
const abilitiesComplete = computed(() =>
  name.value.trim().length >= 2
  && roleLabel.value.trim().length >= 2
  && competence.value.trim().length >= 8
  && limitation.value.trim().length >= 8,
)
const storyComplete = computed(() => motivation.value.trim().length >= 3)
const canAdvance = computed(() => {
  if (step.value === 1)
    return Boolean(selectedRole.value)
  if (step.value === 2)
    return abilitiesComplete.value
  return storyComplete.value
})
const stepTitle = computed(() => {
  if (step.value === 1)
    return 'Выбери основу героя'
  if (step.value === 2)
    return 'Настрой способности'
  return 'Расскажи личную историю'
})
const stepDescription = computed(() => {
  if (step.value === 1)
    return 'Изучи полное описание специализации или начни с чистого листа.'
  if (step.value === 2)
    return 'Готовый пресет уже заполнен, но каждую формулировку можно переписать.'
  return 'Выбери подсказку или сформулируй собственную цель и прошлое героя.'
})
const footerHint = computed(() => {
  if (step.value === 1 && !selectedRole.value)
    return 'Выбери одну основу, чтобы продолжить.'
  if (step.value === 2 && !abilitiesComplete.value)
    return 'Заполни имя, роль, компетенцию и ограничение.'
  if (step.value === 3 && !storyComplete.value)
    return 'Укажи личную мотивацию героя.'
  return step.value === 3 ? 'После подтверждения начнется история.' : 'Все можно изменить до создания ветки.'
})

onMounted(() => {
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  nextTick(() => dialogTitle.value?.focus())
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousBodyOverflow
})

function selectRole(role: StoryRole) {
  if (selectedRoleId.value === role.id)
    return

  selectedRoleId.value = role.id
  if (role.id.endsWith(':free')) {
    roleLabel.value = ''
    competence.value = ''
    limitation.value = ''
    return
  }

  roleLabel.value = role.label
  competence.value = role.competence
  limitation.value = role.limitation
}

function conditionLabel(role: StoryRole) {
  const condition = role.startingItem?.condition
  return condition === 'pristine' ? 'новый' : condition === 'usable' ? 'исправный' : 'потертый'
}

function selectMotivation(item: string) {
  motivation.value = item
}

function focusStepTitle() {
  nextTick(() => dialogTitle.value?.focus())
}

function goBack() {
  if (step.value === 1)
    return
  step.value = step.value === 3 ? 2 : 1
  errorMessage.value = ''
  focusStepTitle()
}

function goForward() {
  if (!canAdvance.value || step.value === 3)
    return
  step.value = step.value === 1 ? 2 : 3
  errorMessage.value = ''
  focusStepTitle()
}

function close() {
  if (!submitting.value)
    emit('close')
}

async function createSession() {
  if (step.value !== 3 || !canAdvance.value || !selectedRole.value || submitting.value)
    return

  submitting.value = true
  errorMessage.value = ''
  const request: CreateGameSessionRequest = {
    schema_version: 'session-create@1.0',
    story_pack_id: props.storyPack.id,
    persona: {
      name: name.value.trim(),
      role_id: selectedRole.value.id,
      role_label: roleLabel.value.trim(),
      competence: competence.value.trim(),
      limitation: limitation.value.trim(),
      motivation: motivation.value.trim(),
      background: background.value.trim(),
      embodiment_note: '',
      narration_density: narrationDensity.value,
    },
  }

  try {
    const response = await $fetch<CreateGameSessionResponse>('/api/game/sessions', {
      method: 'POST',
      body: request,
    })
    await router.push({
      path: '/interaction',
      query: { session: response.session.id },
    })
  }
  catch (error) {
    const data = (error as { data?: { message?: string } })?.data
    errorMessage.value = data?.message || 'Не удалось начать историю. Проверь данные и попробуй еще раз.'
  }
  finally {
    submitting.value = false
  }
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
    class="fixed inset-0 z-50 grid place-items-center bg-black/80 p-0 backdrop-blur-md sm:p-5 lg:p-8"
    @mousedown.self="close"
  >
    <form
      ref="dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="persona-wizard-title"
      aria-describedby="persona-wizard-description"
      class="flex h-dvh w-full flex-col overflow-hidden border-white/10 bg-[#111114] shadow-2xl sm:h-[min(90dvh,820px)] sm:max-w-[1080px] sm:rounded-3xl sm:border"
      @submit.prevent="createSession"
      @keydown="handleKeydown"
    >
      <header class="shrink-0 border-b border-white/8 bg-[#111114f2] px-5 pb-4 pt-5 backdrop-blur-xl sm:px-7 sm:pb-5 sm:pt-6">
        <div class="flex items-start justify-between gap-5">
          <div class="min-w-0">
            <p class="font-interface text-[10px] uppercase tracking-[.18em] text-[var(--pack-accent-light)]">
              Новый герой · {{ storyPack.shortTitle }}
            </p>
            <h2
              id="persona-wizard-title"
              ref="dialogTitle"
              tabindex="-1"
              class="mt-1 font-display text-[clamp(23px,3vw,30px)] leading-tight text-fabula-100 outline-none"
            >
              {{ stepTitle }}
            </h2>
            <p id="persona-wizard-description" class="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-fabula-500 sm:text-[14px]">
              {{ stepDescription }}
            </p>
          </div>
          <button
            type="button"
            aria-label="Закрыть настройку героя"
            class="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 text-[22px] text-fabula-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
            @click="close"
          >
            ×
          </button>
        </div>

        <ol class="mt-5 grid grid-cols-3 gap-2" aria-label="Ход настройки">
          <li v-for="item in [{ id: 1, label: 'Основа' }, { id: 2, label: 'Способности' }, { id: 3, label: 'Личная история' }]" :key="item.id" class="min-w-0">
            <div
              class="h-1 rounded-full transition"
              :class="step >= item.id ? 'bg-[var(--pack-accent)]' : 'bg-white/10'"
            />
            <span
              class="mt-2 block truncate font-interface text-[9px] uppercase tracking-[.08em] sm:text-[10px]"
              :class="step === item.id ? 'text-[var(--pack-accent-light)]' : step > item.id ? 'text-fabula-300' : 'text-fabula-500'"
            >{{ item.id }}. {{ item.label }}</span>
          </li>
        </ol>
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:thin] sm:px-7 sm:py-6">
        <div v-if="step === 1" class="grid gap-5 lg:grid-cols-[minmax(260px,.7fr)_minmax(0,1.3fr)] lg:gap-6">
          <fieldset>
            <legend class="mb-3 font-display text-[15px] text-fabula-300">Доступные основы</legend>
            <div class="grid gap-2">
              <button
                v-for="role in storyPack.roles"
                :key="role.id"
                type="button"
                :aria-pressed="selectedRoleId === role.id"
                class="w-full rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
                :class="selectedRoleId === role.id
                  ? 'border-[var(--pack-accent)] bg-[rgb(var(--pack-accent-rgb)/.1)]'
                  : 'border-white/8 bg-white/[.018] hover:border-white/20 hover:bg-white/[.035]'"
                @click="selectRole(role)"
              >
                <span class="flex items-start gap-3">
                  <span
                    class="mt-1 grid size-4 shrink-0 place-items-center rounded-full border"
                    :class="selectedRoleId === role.id ? 'border-[var(--pack-accent)]' : 'border-white/25'"
                  >
                    <span v-if="selectedRoleId === role.id" class="size-2 rounded-full bg-[var(--pack-accent)]" />
                  </span>
                  <span class="min-w-0">
                    <strong class="block font-display text-[15px] font-normal text-fabula-100">{{ role.label }}</strong>
                    <span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">{{ role.competence }}</span>
                  </span>
                </span>
              </button>
            </div>
          </fieldset>

          <section v-if="selectedRole" class="rounded-2xl border border-[rgb(var(--pack-accent-rgb)/.24)] bg-[rgb(var(--pack-accent-rgb)/.055)] p-5 sm:p-6" aria-live="polite">
            <p class="font-interface text-[10px] uppercase tracking-[.16em] text-[var(--pack-accent-light)]">
              {{ selectedRole.id.endsWith(':free') ? 'Собственный пресет' : 'Полное описание' }}
            </p>
            <h3 class="mt-2 font-display text-[24px] text-fabula-100">{{ selectedRole.label }}</h3>
            <p class="mt-3 text-[14px] leading-relaxed text-fabula-300 sm:text-[15px]">
              <template v-if="selectedRole.id.endsWith(':free')">
                Чистая основа для собственного героя. На следующем этапе ты сам задашь название роли, практическую компетенцию и уязвимость.
              </template>
              <template v-else>
                Это отправная точка, а не жесткий класс. Следующий этап позволит переписать способности и ограничение, сохранив связь с каноном истории.
              </template>
            </p>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <article class="rounded-xl border border-white/8 bg-black/15 p-4">
                <p class="font-interface text-[9px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Сильная сторона</p>
                <p class="mt-2 text-[14px] leading-relaxed text-fabula-100">{{ selectedRole.competence }}</p>
              </article>
              <article class="rounded-xl border border-white/8 bg-black/15 p-4">
                <p class="font-interface text-[9px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Цена и граница</p>
                <p class="mt-2 text-[14px] leading-relaxed text-fabula-100">{{ selectedRole.limitation }}</p>
              </article>
            </div>

            <article v-if="selectedRole.startingItem" class="mt-3 rounded-xl border border-white/8 bg-black/15 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-interface text-[9px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Стартовый предмет</p>
                  <h4 class="mt-1 font-display text-[17px] font-normal text-fabula-100">{{ selectedRole.startingItem.name }}</h4>
                </div>
                <span class="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-fabula-500">
                  {{ conditionLabel(selectedRole) }}<template v-if="selectedRole.startingItem.charges !== null"> · {{ selectedRole.startingItem.charges }} исп.</template>
                </span>
              </div>
              <p class="mt-2 text-[13px] leading-relaxed text-fabula-300">{{ selectedRole.startingItem.description }}</p>
            </article>

            <p class="mt-5 text-[12px] leading-relaxed text-fabula-500">Стартовый предмет связан с выбранной основой. Личные параметры редактируются отдельно.</p>
          </section>

          <section v-else class="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 p-8 text-center">
            <div>
              <span class="mx-auto grid size-12 place-items-center rounded-full border border-white/10 text-[20px] text-fabula-500" aria-hidden="true">?</span>
              <h3 class="mt-4 font-display text-[18px] text-fabula-300">Выбери основу слева</h3>
              <p class="mx-auto mt-2 max-w-[36ch] text-[13px] leading-relaxed text-fabula-500">Здесь появятся полное описание, ограничение и стартовый предмет.</p>
            </div>
          </section>
        </div>

        <div v-else-if="step === 2" class="mx-auto max-w-[880px]">
          <div v-if="selectedRole" class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[rgb(var(--pack-accent-rgb)/.24)] bg-[rgb(var(--pack-accent-rgb)/.07)] px-4 py-3.5">
            <div>
              <p class="font-interface text-[9px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Выбранная основа</p>
              <p class="mt-1 font-display text-[15px] text-fabula-100">{{ selectedRole.label }}</p>
            </div>
            <span v-if="selectedRole.startingItem" class="text-[11px] text-fabula-500">Предмет: {{ selectedRole.startingItem.name }}</span>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Имя героя</span>
              <input
                v-model="name"
                name="name"
                autocomplete="nickname"
                maxlength="40"
                required
                placeholder="Как к тебе обращается мир"
                class="h-12 w-full rounded-xl border border-white/10 bg-[#09090b] px-4 text-[16px] text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              >
            </label>

            <label class="block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Название роли</span>
              <input
                v-model="roleLabel"
                name="role-label"
                maxlength="80"
                required
                placeholder="Например: районный врач или архивист"
                class="h-12 w-full rounded-xl border border-white/10 bg-[#09090b] px-4 text-[15px] text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              >
            </label>

            <label class="block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Главная компетенция</span>
              <span class="mb-2 block text-[12px] leading-relaxed text-fabula-500">Что герой умеет и где это дает преимущество.</span>
              <textarea
                v-model="competence"
                name="competence"
                maxlength="480"
                required
                rows="5"
                placeholder="Опиши конкретное умение героя"
                class="w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              ></textarea>
            </label>

            <label class="block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Ограничение</span>
              <span class="mb-2 block text-[12px] leading-relaxed text-fabula-500">Что дается трудно, чего герой боится или где ошибается.</span>
              <textarea
                v-model="limitation"
                name="limitation"
                maxlength="480"
                required
                rows="5"
                placeholder="Задай значимую границу героя"
                class="w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              ></textarea>
            </label>
          </div>
        </div>

        <div v-else class="mx-auto grid max-w-[920px] gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <fieldset>
              <legend class="font-display text-[15px] text-fabula-300">Личная мотивация</legend>
              <p class="mt-1 text-[12px] leading-relaxed text-fabula-500">Подсказка заполнит поле, но ее можно дополнить или заменить.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="item in storyPack.motivations"
                  :key="item"
                  type="button"
                  class="rounded-full border px-3 py-2 text-[12px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
                  :class="motivation === item
                    ? 'border-[var(--pack-accent)] bg-[rgb(var(--pack-accent-rgb)/.1)] text-[var(--pack-accent-light)]'
                    : 'border-white/10 text-fabula-500 hover:border-white/20 hover:text-fabula-300'"
                  @click="selectMotivation(item)"
                >
                  {{ item }}
                </button>
              </div>
              <textarea
                v-model="motivation"
                name="motivation"
                maxlength="600"
                required
                rows="5"
                placeholder="Чего герой хочет на самом деле и почему это нельзя отложить"
                class="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              ></textarea>
            </fieldset>

            <fieldset class="mt-5">
              <legend class="mb-2 font-display text-[14px] text-fabula-300">Ритм рассказа</legend>
              <div class="grid grid-cols-3 gap-2">
                <label
                  v-for="density in [
                    { id: 'concise', label: 'Кратко' },
                    { id: 'balanced', label: 'Баланс' },
                    { id: 'rich', label: 'Подробно' },
                  ]"
                  :key="density.id"
                  class="cursor-pointer rounded-xl border px-2 py-2.5 text-center text-[12px] transition"
                  :class="narrationDensity === density.id
                    ? 'border-[var(--pack-accent)] bg-[rgb(var(--pack-accent-rgb)/.09)] text-[var(--pack-accent-light)]'
                    : 'border-white/8 text-fabula-500'"
                >
                  <input v-model="narrationDensity" type="radio" name="density" :value="density.id" class="sr-only">
                  {{ density.label }}
                </label>
              </div>
            </fieldset>
          </div>

          <label class="block">
            <span class="flex items-end justify-between gap-3">
              <span>
                <span class="block font-display text-[15px] text-fabula-300">Прошлое героя</span>
                <span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">Связи, ошибки, обещания и важные воспоминания.</span>
              </span>
              <span class="shrink-0 font-interface text-[10px] text-fabula-500">{{ background.length }}/1200</span>
            </span>
            <textarea
              v-model="background"
              name="background"
              maxlength="1200"
              rows="12"
              placeholder="Кем герой был до начала истории? Кого оставил позади? Что скрывает, помнит или должен кому-то?"
              class="mt-3 min-h-56 w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
            ></textarea>
          </label>
        </div>
      </div>

      <footer class="shrink-0 border-t border-white/8 bg-[#111114f2] px-5 py-4 backdrop-blur-xl sm:px-7">
        <p v-if="errorMessage" role="alert" class="mb-3 rounded-xl border border-red-400/25 bg-red-400/8 px-3 py-2 text-[12px] leading-relaxed text-red-200">
          {{ errorMessage }}
        </p>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-[11px] leading-relaxed text-fabula-500">{{ footerHint }}</p>
          <div class="flex gap-2 sm:shrink-0">
            <button
              v-if="step > 1"
              type="button"
              class="min-h-11 flex-1 rounded-xl border border-white/10 px-5 text-[13px] text-fabula-300 transition hover:border-white/25 hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)] sm:flex-none"
              @click="goBack"
            >
              Назад
            </button>
            <button
              v-if="step < 3"
              type="button"
              :disabled="!canAdvance"
              class="min-h-11 flex-1 rounded-xl bg-[var(--pack-accent)] px-6 font-display text-[13px] uppercase tracking-[.08em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)] sm:flex-none"
              @click="goForward"
            >
              Далее
            </button>
            <button
              v-else
              type="submit"
              :disabled="!canAdvance || submitting"
              class="min-h-11 flex-1 rounded-xl bg-[var(--pack-accent)] px-6 font-display text-[13px] uppercase tracking-[.08em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)] sm:flex-none"
            >
              {{ submitting ? 'Создаем ветку…' : 'Войти в историю' }}
            </button>
          </div>
        </div>
      </footer>
    </form>
  </div>
</template>

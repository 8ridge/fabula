<script setup lang="ts">
import type {
  CreateGameSessionRequest,
  CreateGameSessionResponse,
  GameSessionSummary,
  ListGameSessionsResponse,
  PlayerPersonaInput,
} from '#shared/game'
import type { StoryPack } from '#shared/storypacks'

const props = defineProps<{
  storyPack: StoryPack
}>()

const router = useRouter()
const setupStep = ref<'role' | 'persona'>('role')
const selectedRoleId = ref('')
const inspectedRoleId = ref<string | null>(null)
const name = ref('')
const roleLabel = ref('')
const competence = ref('')
const limitation = ref('')
const motivation = ref('')
const background = ref('')
const narrationDensity = ref<PlayerPersonaInput['narration_density']>('balanced')
const startedSessions = ref<GameSessionSummary[]>([])
const loadingSessions = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const lastRoleTrigger = ref<HTMLElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)

const selectedRole = computed(() => props.storyPack.roles.find(role => role.id === selectedRoleId.value) || null)
const inspectedRole = computed(() => props.storyPack.roles.find(role => role.id === inspectedRoleId.value) || null)
const canContinue = computed(() => Boolean(selectedRole.value))
const canSubmit = computed(() =>
  name.value.trim().length >= 2
  && Boolean(selectedRole.value)
  && roleLabel.value.trim().length >= 2
  && competence.value.trim().length >= 8
  && limitation.value.trim().length >= 8
  && motivation.value.trim().length >= 3
)
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

async function createSession() {
  if (!canSubmit.value || submitting.value)
    return
  submitting.value = true
  errorMessage.value = ''
  const request: CreateGameSessionRequest = {
    schema_version: 'session-create@1.0',
    story_pack_id: props.storyPack.id,
    persona: {
      name: name.value.trim(),
      role_id: selectedRoleId.value,
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

function continueSession(sessionId: string) {
  return router.push({ path: '/interaction', query: { session: sessionId } })
}

function openRoleDetails(roleId: string, event: MouseEvent) {
  lastRoleTrigger.value = event.currentTarget as HTMLElement
  inspectedRoleId.value = roleId
}

function closeRoleDetails() {
  inspectedRoleId.value = null
  nextTick(() => lastRoleTrigger.value?.focus())
}

function applyRolePreset(role: StoryPack['roles'][number]) {
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

function chooseInspectedRole() {
  if (!inspectedRole.value)
    return
  if (selectedRoleId.value !== inspectedRole.value.id)
    applyRolePreset(inspectedRole.value)
  closeRoleDetails()
}

function continueToPersona() {
  if (!canContinue.value)
    return
  setupStep.value = 'persona'
  nextTick(() => nameInput.value?.focus())
}

function selectMotivation(item: string) {
  motivation.value = item
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
        <form class="rounded-3xl border border-white/10 bg-[#111114] p-5 shadow-2xl sm:p-6" @submit.prevent="createSession">
          <div class="mb-6 flex items-center gap-3" aria-label="Шаг настройки персонажа">
            <span
              class="grid size-7 place-items-center rounded-full border font-interface text-[10px]"
              :class="setupStep === 'role' ? 'border-[var(--pack-accent)] text-[var(--pack-accent-light)]' : 'border-[var(--pack-accent)] bg-[var(--pack-accent)] text-[#09090b]'"
            >1</span>
            <span class="h-px flex-1 bg-white/10" />
            <span
              class="grid size-7 place-items-center rounded-full border font-interface text-[10px]"
              :class="setupStep === 'persona' ? 'border-[var(--pack-accent)] text-[var(--pack-accent-light)]' : 'border-white/15 text-fabula-500'"
            >2</span>
          </div>

          <template v-if="setupStep === 'role'">
            <div class="mb-6">
              <p class="font-interface text-[10px] uppercase tracking-[.18em] text-[var(--pack-accent)]">Шаг 1 · Основа героя</p>
              <h2 class="mt-1 font-display text-[23px] text-fabula-100">Выбери специализацию</h2>
              <p class="mt-2 text-[15px] leading-relaxed text-fabula-500">Открой описание, оцени сильную сторону, ограничение и стартовый предмет. На следующем шаге все параметры личности можно переписать.</p>
            </div>

            <fieldset>
              <legend class="sr-only">Специализация героя</legend>
              <div class="grid gap-2">
                <button
                  v-for="role in storyPack.roles"
                  :key="role.id"
                  type="button"
                  aria-haspopup="dialog"
                  :aria-pressed="selectedRoleId === role.id"
                  class="group w-full rounded-xl border p-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
                  :class="selectedRoleId === role.id
                    ? 'border-[var(--pack-accent)] bg-[rgb(var(--pack-accent-rgb)/.09)]'
                    : 'border-white/8 bg-white/[.018] hover:border-white/20 hover:bg-white/[.035]'"
                  @click="openRoleDetails(role.id, $event)"
                >
                  <span class="flex items-start gap-3">
                    <span
                      class="mt-1 grid size-4 shrink-0 place-items-center rounded-full border"
                      :class="selectedRoleId === role.id ? 'border-[var(--pack-accent)]' : 'border-white/25'"
                    >
                      <span v-if="selectedRoleId === role.id" class="size-2 rounded-full bg-[var(--pack-accent)]" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="flex items-start justify-between gap-3">
                        <strong class="block font-display text-[15px] font-normal text-fabula-100">{{ role.label }}</strong>
                        <span class="shrink-0 text-[11px] text-[var(--pack-accent-light)]">Подробнее →</span>
                      </span>
                      <span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">{{ role.competence }}</span>
                    </span>
                  </span>
                </button>
              </div>
            </fieldset>

            <button
              type="button"
              :disabled="!canContinue"
              class="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--pack-accent)] px-5 font-display text-[14px] uppercase tracking-[.08em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)]"
              @click="continueToPersona"
            >
              Продолжить настройку
            </button>
            <p class="mt-3 text-center text-[11px] leading-relaxed text-fabula-500">Выбор не окончательный: к списку можно вернуться до создания ветки.</p>
          </template>

          <template v-else>
            <div class="mb-6">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="font-interface text-[10px] uppercase tracking-[.18em] text-[var(--pack-accent)]">Шаг 2 · Личный пресет</p>
                  <h2 class="mt-1 font-display text-[23px] text-fabula-100">Собери своего героя</h2>
                </div>
                <button
                  type="button"
                  class="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] text-[var(--pack-accent-light)] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent)]"
                  @click="setupStep = 'role'"
                >
                  Изменить основу
                </button>
              </div>
              <p class="mt-2 text-[15px] leading-relaxed text-fabula-500">Поля уже заполнены выбранным пресетом. Оставь их как есть или перепиши полностью — в историю уйдет именно твоя версия.</p>
            </div>

            <div v-if="selectedRole" class="mb-5 rounded-2xl border border-[rgb(var(--pack-accent-rgb)/.24)] bg-[rgb(var(--pack-accent-rgb)/.07)] p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--pack-accent-light)]">Основа</p>
                  <p class="mt-1 font-display text-[16px] text-fabula-100">{{ selectedRole.label }}</p>
                </div>
                <span v-if="selectedRole.startingItem" class="max-w-[18ch] text-right text-[11px] leading-relaxed text-fabula-500">Предмет: {{ selectedRole.startingItem.name }}</span>
              </div>
            </div>

            <label class="mb-5 block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Имя героя</span>
              <input
                ref="nameInput"
                v-model="name"
                name="name"
                autocomplete="nickname"
                maxlength="40"
                required
                placeholder="Как к тебе обращается мир"
                class="h-12 w-full rounded-xl border border-white/10 bg-[#09090b] px-4 text-[16px] text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              >
            </label>

            <label class="mb-5 block">
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

            <label class="mb-5 block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Главная компетенция</span>
              <textarea
                v-model="competence"
                name="competence"
                maxlength="480"
                required
                rows="3"
                placeholder="Что герой действительно умеет и где это дает преимущество"
                class="w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              />
            </label>

            <label class="mb-5 block">
              <span class="mb-2 block font-display text-[14px] text-fabula-300">Ограничение</span>
              <textarea
                v-model="limitation"
                name="limitation"
                maxlength="480"
                required
                rows="3"
                placeholder="Что дается трудно, чего герой боится или где ошибается"
                class="w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              />
            </label>

            <fieldset class="mb-5">
              <legend class="font-display text-[14px] text-fabula-300">Личная мотивация</legend>
              <p class="mt-1 text-[12px] leading-relaxed text-fabula-500">Выбери отправную точку или напиши собственную цель своими словами.</p>
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
                rows="4"
                placeholder="Чего герой хочет на самом деле и почему это нельзя отложить"
                class="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              />
            </fieldset>

            <label class="mb-5 block">
              <span class="flex items-end justify-between gap-3">
                <span>
                  <span class="block font-display text-[14px] text-fabula-300">Прошлое героя</span>
                  <span class="mt-1 block text-[12px] leading-relaxed text-fabula-500">Необязательно, но именно здесь можно задать связи, ошибки, обещания и важные воспоминания.</span>
                </span>
                <span class="shrink-0 font-interface text-[10px] text-fabula-500">{{ background.length }}/1200</span>
              </span>
              <textarea
                v-model="background"
                name="background"
                maxlength="1200"
                rows="6"
                placeholder="Кем герой был до начала истории? Кого оставил позади? Что скрывает, помнит или должен кому-то?"
                class="mt-3 w-full resize-y rounded-xl border border-white/10 bg-[#09090b] px-4 py-3 text-[15px] leading-relaxed text-fabula-100 outline-none transition placeholder:text-fabula-500 focus:border-[var(--pack-accent)] focus:ring-2 focus:ring-[rgb(var(--pack-accent-rgb)/.16)]"
              />
            </label>

            <fieldset class="mb-6">
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

            <p v-if="errorMessage" role="alert" class="mb-4 rounded-xl border border-red-400/25 bg-red-400/8 px-3 py-2.5 text-[13px] leading-relaxed text-red-200">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="!canSubmit || submitting"
              class="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--pack-accent)] px-5 font-display text-[15px] uppercase tracking-[.1em] text-[#09090b] transition hover:bg-[var(--pack-accent-light)] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pack-accent-light)]"
            >
              {{ submitting ? 'Создаем ветку…' : 'Войти в историю' }}
            </button>
            <p class="mt-3 text-center text-[11px] leading-relaxed text-fabula-500">StoryPack и стартовый предмет сохраняют канон. Личный пресет закрепляется за этой веткой в твоей редакции.</p>
          </template>
        </form>

        <p v-if="loadingSessions" class="mt-3 text-center text-[12px] text-fabula-500">Проверяем начатые истории…</p>
      </aside>
    </div>

    <StoryRoleDetailModal
      v-if="inspectedRole"
      :role="inspectedRole"
      :story-title="storyPack.shortTitle"
      :selected="selectedRoleId === inspectedRole.id"
      @close="closeRoleDetails"
      @select="chooseInspectedRole"
    />
  </main>
</template>

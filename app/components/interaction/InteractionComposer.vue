<script setup lang="ts">
import type {
  InventoryItemProjection,
  JournalEntryProjection,
  SuggestedAction,
} from '#shared/game'
import type {
  InteractionMode,
  InteractionQueuedTurn,
  InteractionToolName,
} from '~/types/interaction-ui'
import { projectInventoryItem } from '~/composables/useInventoryStore'
import { inventoryConditionMeta } from '~/types/inventory'

const input = defineModel<string>({ required: true })

const props = defineProps<{
  mode: InteractionMode
  turnPending: boolean
  pendingIntent: string
  queuedTurns: InteractionQueuedTurn[]
  suggestions: SuggestedAction[]
  selectedSuggestionId: string | null
  selectedItems: InventoryItemProjection[]
  selectedJournalEntries: JournalEntryProjection[]
  inventoryCount: number
  journalCount: number
}>()

const selectedItemViews = computed(() => props.selectedItems.map(projectInventoryItem))

const emit = defineEmits<{
  setMode: [mode: InteractionMode]
  chooseSuggestion: [suggestion: SuggestedAction]
  removeItem: [itemId: string]
  removeJournalEntry: [entryId: string]
  submit: []
  cancel: []
  editQueued: [turnId: string]
  removeQueued: [turnId: string]
  openTool: [tool: InteractionToolName]
}>()

const textarea = ref<HTMLTextAreaElement | null>(null)
const modes: Array<{ id: InteractionMode, label: string, icon: string }> = [
  { id: 'action', label: 'Действие', icon: '↗' },
  { id: 'speech', label: 'Речь', icon: '❝' },
  { id: 'exploration', label: 'Исследование', icon: '⌕' },
]
const modeLabels: Record<InteractionMode, string> = {
  action: 'Действие',
  speech: 'Речь',
  exploration: 'Исследование',
}
const suggestionModeMeta: Record<InteractionMode, {
  label: string
  icon: string
  className: string
}> = {
  action: {
    label: 'Действие',
    icon: '↗',
    className: 'border-amber-200/25 bg-amber-200/[.055] text-amber-100 hover:border-amber-200/45',
  },
  speech: {
    label: 'Речь',
    icon: '❝',
    className: 'border-violet-200/25 bg-violet-200/[.055] text-violet-100 hover:border-violet-200/45',
  },
  exploration: {
    label: 'Исследование',
    icon: '⌕',
    className: 'border-sky-200/25 bg-sky-200/[.055] text-sky-100 hover:border-sky-200/45',
  },
}
const journalEntryTypeLabels: Record<JournalEntryProjection['entry_type'], string> = {
  event: 'Событие',
  character: 'Персонаж',
  location: 'Место',
  item: 'Предмет',
  clue: 'Улика',
  promise: 'Обещание',
  objective: 'Цель',
}
const placeholder = computed(() => {
  if (props.turnPending)
    return 'Что будет следом…'
  if (props.mode === 'speech')
    return 'Слова, которые прозвучат…'
  if (props.mode === 'exploration')
    return 'К чему присмотреться…'
  return 'Твой следующий шаг…'
})

function resize() {
  nextTick(() => {
    if (!textarea.value)
      return
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 132)}px`
  })
}

function focus() {
  nextTick(() => textarea.value?.focus())
}

function selectEnd() {
  nextTick(() => {
    textarea.value?.focus()
    textarea.value?.setSelectionRange(input.value.length, input.value.length)
  })
}

function countLabel(value: number, one: string, few: string, many: string): string {
  const remainder100 = value % 100
  const remainder10 = value % 10
  const form = remainder100 >= 11 && remainder100 <= 14
    ? many
    : remainder10 === 1
      ? one
      : remainder10 >= 2 && remainder10 <= 4
        ? few
        : many
  return `${value} ${form}`
}

defineExpose({ resize, focus, selectEnd })
</script>

<template>
  <section class="shrink-0 border-t border-white/8 bg-[#0d0e12] px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:px-5" aria-label="Ход игрока">
    <div
      v-if="turnPending && pendingIntent"
      class="mb-2 flex items-center gap-3 rounded-xl border border-[rgb(var(--accent-rgb)/.24)] bg-[rgb(var(--accent-rgb)/.055)] px-3 py-2"
      aria-label="Текущий ход"
    >
      <span class="size-1.5 shrink-0 animate-pulse rounded-full bg-[var(--accent)]" aria-hidden="true" />
      <span class="shrink-0 font-interface text-[9px] uppercase tracking-[.1em] text-[var(--accent-light)]">Сейчас</span>
      <p class="min-w-0 flex-1 truncate font-story text-[13px] text-[#aaaab3]">«{{ pendingIntent }}»</p>
    </div>

    <div v-if="queuedTurns.length" class="mb-2" aria-label="Следующие ходы">
      <div class="mb-1.5 flex items-center gap-2 px-1">
        <span class="font-interface text-[9px] uppercase tracking-[.1em] text-[#9b9ba6]">Следом</span>
        <span class="font-interface text-[9px] text-[#777780]">{{ queuedTurns.length }}</span>
      </div>
      <div class="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
        <article
          v-for="turn in queuedTurns"
          :key="turn.id"
          class="flex min-w-[220px] max-w-[320px] shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] py-1.5 pl-2.5 pr-1.5"
        >
          <span class="shrink-0 font-interface text-[9px] text-[var(--accent-light)]">{{ modeLabels[turn.mode] }}</span>
          <p class="min-w-0 flex-1 truncate font-story text-[12px] text-fabula-300">{{ turn.text }}</p>
          <button
            type="button"
            class="rounded-md px-1.5 py-1 font-interface text-[9px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100"
            :aria-label="`Изменить ход: ${turn.text}`"
            @click="emit('editQueued', turn.id)"
          >
            Изменить
          </button>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-md text-[15px] text-[#777780] transition hover:bg-red-300/10 hover:text-red-100"
            :aria-label="`Убрать ход: ${turn.text}`"
            @click="emit('removeQueued', turn.id)"
          >
            ×
          </button>
        </article>
      </div>
    </div>

    <div
      v-if="suggestions.length"
      class="mb-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] min-[900px]:flex-wrap min-[900px]:overflow-x-visible"
      aria-label="Предложенные действия"
    >
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        type="button"
        class="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-[13px] leading-snug transition hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        :class="selectedSuggestionId === suggestion.id
          ? 'border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.14)] text-[var(--accent-light)]'
          : suggestionModeMeta[suggestion.mode].className"
        :aria-label="`Отправить сразу — ${suggestionModeMeta[suggestion.mode].label}: ${suggestion.label}`"
        title="Отправить сразу"
        @click="emit('chooseSuggestion', suggestion)"
      >
        <span class="font-interface text-[9px] uppercase tracking-[.08em] opacity-70">
          {{ suggestionModeMeta[suggestion.mode].icon }} {{ suggestionModeMeta[suggestion.mode].label }}
        </span>
        <span class="font-story">{{ suggestion.label }}</span>
        <span class="text-[14px] opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-90" aria-hidden="true">→</span>
      </button>
    </div>

    <div class="grid items-stretch gap-3 min-[1180px]:grid-cols-[112px_minmax(0,1fr)_112px]">
      <button
        type="button"
        class="group relative hidden min-h-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[#14151a] text-left transition hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/.45)] hover:shadow-[0_16px_40px_-24px_rgb(var(--accent-rgb)/.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-[1180px]:block"
        aria-label="Открыть журнал"
        @click="emit('openTool', 'journal')"
      >
        <img src="/assets/journal-with-pen-low-poly-640.png" alt="" class="absolute inset-x-0 top-0 mx-auto h-[112px] w-[112px] object-contain p-1 transition duration-300 group-hover:scale-105" />
        <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d11] via-[#0c0d11e8] to-transparent px-3 pb-2.5 pt-8">
          <strong class="block font-display text-[15px] font-normal text-fabula-100">Журнал</strong>
          <span class="font-interface text-[9px] text-[#9b9ba6]">{{ countLabel(journalCount, 'запись', 'записи', 'записей') }}</span>
        </span>
      </button>

      <form class="min-w-0 rounded-2xl border border-white/12 bg-[#15171d] p-2.5 transition focus-within:border-[rgb(var(--accent-rgb)/.65)]" @submit.prevent="emit('submit')">
      <div class="mb-1.5 flex items-center gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Режим хода">
        <button
          v-for="entry in modes"
          :key="entry.id"
          type="button"
          role="tab"
          :aria-selected="mode === entry.id"
          class="shrink-0 rounded-lg px-2.5 py-1.5 font-interface text-[10px] transition"
          :class="mode === entry.id ? 'bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]' : 'text-[#9b9ba6] hover:text-fabula-100'"
          @click="emit('setMode', entry.id)"
        >
          <span class="mr-1" aria-hidden="true">{{ entry.icon }}</span>{{ entry.label }}
        </button>
      </div>

      <div
        v-if="selectedItemViews.length || selectedJournalEntries.length"
        class="mb-2 flex flex-wrap gap-2"
        aria-label="Ссылки в ходе"
      >
        <span
          v-for="item in selectedItemViews"
          :key="item.id"
          class="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-[rgb(var(--accent-rgb)/.42)] bg-[rgb(var(--accent-rgb)/.09)] p-1 pr-1.5 text-[var(--accent-light)]"
        >
          <InventoryItemIcon :item="item" size="slot" class="ring-1 ring-white/10" />
          <span class="min-w-0">
            <strong class="block truncate text-[12px] font-semibold leading-tight">{{ item.name }}</strong>
            <span class="mt-0.5 flex items-center gap-1.5 text-[9px] leading-none text-fabula-300">
              <span class="rounded-md border px-1.5 py-0.5" :class="inventoryConditionMeta[item.condition].className">
                {{ item.conditionLabel }}
              </span>
              <span>{{ item.amountLabel }}</span>
            </span>
          </span>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-lg text-[16px] text-fabula-300 transition hover:bg-white/8 hover:text-fabula-100"
            :aria-label="`Убрать ${item.name} из хода`"
            @click="emit('removeItem', item.id)"
          >
            ×
          </button>
        </span>
        <span
          v-for="entry in selectedJournalEntries"
          :key="entry.id"
          class="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-[rgb(var(--accent-rgb)/.42)] bg-[rgb(var(--accent-rgb)/.09)] p-1 pr-1.5 text-[var(--accent-light)]"
          :title="entry.summary"
        >
          <span class="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-[#111319] text-[17px]" aria-hidden="true">✒</span>
          <span class="min-w-0 max-w-[min(58vw,360px)]">
            <strong class="block truncate text-[12px] font-semibold leading-tight">{{ entry.title }}</strong>
            <span class="mt-0.5 block truncate font-interface text-[9px] leading-none text-fabula-300">
              {{ journalEntryTypeLabels[entry.entry_type] }} · {{ entry.story_time }}
            </span>
          </span>
          <button
            type="button"
            class="grid size-7 shrink-0 place-items-center rounded-lg text-[16px] text-fabula-300 transition hover:bg-white/8 hover:text-fabula-100"
            :aria-label="`Убрать запись «${entry.title}» из хода`"
            @click="emit('removeJournalEntry', entry.id)"
          >
            ×
          </button>
        </span>
      </div>

      <label class="sr-only" for="playerInput">Опиши действие, исследование или реплику</label>
      <textarea
        id="playerInput"
        ref="textarea"
        v-model="input"
        rows="1"
        maxlength="1200"
        class="max-h-[132px] min-h-[48px] w-full resize-none bg-transparent px-1 font-story text-[18px] leading-[1.45] text-fabula-100 outline-none placeholder:text-[#8f8f99]"
        :placeholder="placeholder"
        @input="resize"
        @keydown.enter.exact.prevent="emit('submit')"
      />

      <div class="mt-1 flex items-center justify-between gap-3">
        <div class="flex items-center gap-1">
          <button
            v-for="tool in [
              { id: 'inventory', label: 'Добавить предмет из инвентаря' },
              { id: 'journal', label: 'Открыть журнал' },
            ]"
            :key="tool.id"
            type="button"
            class="grid size-9 place-items-center rounded-lg text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            :aria-label="tool.label"
            :title="tool.label"
            @click="emit('openTool', tool.id as InteractionToolName)"
          >
            <InteractionToolIcon :tool="tool.id as InteractionToolName" class="size-[21px]" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-interface text-[10px] text-[#9b9ba6]">{{ input.length }}/1200</span>
          <button
            v-if="turnPending"
            type="button"
            class="grid size-10 place-items-center rounded-xl border border-red-300/35 bg-red-300/10 text-[20px] text-red-100 transition hover:bg-red-300/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-light)]"
            aria-label="Остановить генерацию"
            title="Остановить генерацию"
            @click.stop="emit('cancel')"
          >
            ■
          </button>
          <button
            type="submit"
            class="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[20px] text-[#111218] transition hover:bg-[var(--accent-light)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-light)]"
            :aria-label="turnPending ? 'Добавить следующий ход' : 'Отправить ход'"
            :title="turnPending ? 'Добавить следующим' : 'Отправить ход'"
            :disabled="!input.trim()"
          >
            ↑
          </button>
        </div>
      </div>
      </form>

      <button
        type="button"
        class="group relative hidden min-h-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[#14151a] text-left transition hover:-translate-y-0.5 hover:border-[rgb(var(--accent-rgb)/.45)] hover:shadow-[0_16px_40px_-24px_rgb(var(--accent-rgb)/.65)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] min-[1180px]:block"
        aria-label="Открыть инвентарь"
        @click="emit('openTool', 'inventory')"
      >
        <img src="/assets/backpack-urban-low-poly-640.png" alt="" class="absolute inset-x-0 top-0 mx-auto h-[116px] w-[112px] object-contain p-0.5 transition duration-300 group-hover:scale-105" />
        <span class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0c0d11] via-[#0c0d11e8] to-transparent px-3 pb-2.5 pt-8">
          <strong class="block font-display text-[15px] font-normal text-fabula-100">Инвентарь</strong>
          <span class="font-interface text-[9px] text-[#9b9ba6]">{{ countLabel(inventoryCount, 'предмет', 'предмета', 'предметов') }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

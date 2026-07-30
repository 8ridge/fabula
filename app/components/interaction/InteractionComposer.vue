<script setup lang="ts">
import type { InventoryItemProjection, SuggestedAction } from '#shared/game'
import type { InteractionMode, InteractionToolName } from '~/types/interaction-ui'
import { projectInventoryItem } from '~/composables/useInventoryStore'
import { inventoryConditionMeta } from '~/types/inventory'

const input = defineModel<string>({ required: true })

const props = defineProps<{
  mode: InteractionMode
  turnPending: boolean
  suggestions: SuggestedAction[]
  selectedSuggestionId: string | null
  selectedItems: InventoryItemProjection[]
}>()

const selectedItemViews = computed(() => props.selectedItems.map(projectInventoryItem))

const emit = defineEmits<{
  setMode: [mode: InteractionMode]
  chooseSuggestion: [suggestion: SuggestedAction]
  removeItem: [itemId: string]
  submit: []
  cancel: []
  openTool: [tool: InteractionToolName]
}>()

const textarea = ref<HTMLTextAreaElement | null>(null)
const modes: Array<{ id: InteractionMode, label: string, icon: string }> = [
  { id: 'action', label: 'Действие', icon: '↗' },
  { id: 'speech', label: 'Речь', icon: '❝' },
  { id: 'exploration', label: 'Исследование', icon: '⌕' },
]

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

defineExpose({ resize, focus, selectEnd })
</script>

<template>
  <section class="shrink-0 border-t border-white/8 bg-[#0d0e12] px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:px-5" aria-label="Ход игрока">
    <div v-if="suggestions.length" class="mb-2 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]" aria-label="Предложенные действия">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        type="button"
        class="shrink-0 rounded-full border px-3 py-1.5 text-left text-[12px] leading-snug transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        :class="selectedSuggestionId === suggestion.id
          ? 'border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]'
          : 'border-white/10 bg-white/[.025] text-fabula-300 hover:border-white/20'"
        @click="emit('chooseSuggestion', suggestion)"
      >
        {{ suggestion.label }}
      </button>
    </div>

    <form class="rounded-2xl border border-white/12 bg-[#15171d] p-2.5 transition focus-within:border-[rgb(var(--accent-rgb)/.65)]" @submit.prevent="emit('submit')">
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

      <div v-if="selectedItemViews.length" class="mb-2 flex flex-wrap gap-2" aria-label="Предметы в ходе">
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
      </div>

      <label class="sr-only" for="playerInput">Опиши действие, исследование или реплику</label>
      <textarea
        id="playerInput"
        ref="textarea"
        v-model="input"
        rows="1"
        maxlength="1200"
        class="max-h-[132px] min-h-[48px] w-full resize-none bg-transparent px-1 font-story text-[18px] leading-[1.45] text-fabula-100 outline-none placeholder:text-[#8f8f99]"
        placeholder="Что ты делаешь или говоришь?"
        @input="resize"
        @keydown.enter.exact.prevent="emit('submit')"
      />

      <div class="mt-1 flex items-center justify-between gap-3">
        <div class="flex items-center gap-1">
          <button
            v-for="tool in [
              { id: 'inventory', icon: '◫', label: 'Добавить предмет из инвентаря' },
              { id: 'journal', icon: '✒', label: 'Открыть журнал' },
            ]"
            :key="tool.id"
            type="button"
            class="grid size-9 place-items-center rounded-lg text-[17px] text-[#9b9ba6] transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            :aria-label="tool.label"
            :title="tool.label"
            @click="emit('openTool', tool.id as InteractionToolName)"
          >
            {{ tool.icon }}
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
            v-else
            type="submit"
            class="grid size-10 place-items-center rounded-xl bg-[var(--accent)] text-[20px] text-[#111218] transition hover:bg-[var(--accent-light)] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-light)]"
            aria-label="Отправить ход"
            title="Отправить ход"
            :disabled="!input.trim()"
          >
            ↑
          </button>
        </div>
      </div>
    </form>
  </section>
</template>

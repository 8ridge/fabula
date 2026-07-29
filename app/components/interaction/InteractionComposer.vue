<script setup lang="ts">
import type { InteractionMode, InteractionToolName } from '~/types/interaction-ui'

const input = defineModel<string>({ required: true })
const props = defineProps<{
  mode: InteractionMode
  turnPending: boolean
  modeCopy: string[]
}>()
const emit = defineEmits<{
  setMode: [mode: InteractionMode]
  submit: []
  openTool: [tool: InteractionToolName]
  rewrite: []
  compose: [text: string]
}>()

const textarea = ref<HTMLTextAreaElement | null>(null)

function resize() {
  nextTick(() => {
    if (!textarea.value)
      return
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 150)}px`
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
  <section class="border-t border-white/10 bg-[#0d0d11] px-[clamp(14px,3vw,58px)] pb-3 pt-4" aria-label="Ввод действия игрока">
    <div class="mb-2 flex items-center gap-3 font-interface text-[8px]">
      <span class="font-bold uppercase tracking-[.1em] text-[var(--accent)]">ТВОЙ ХОД</span>
      <span class="flex-1 text-fabula-500">{{ modeCopy[0] }}</span>
      <button type="button" disabled class="hidden items-center gap-1 text-[#8fcd78] opacity-90 min-[900px]:flex" title="Preview: функция не подключена"><i class="size-2 rounded-full bg-[#8fcd78]" />Автопродолжение</button>
    </div>
    <div class="flex w-max overflow-hidden rounded-t-xl border border-b-0 border-white/10 bg-[#111116]" role="tablist" aria-label="Режим действия">
      <button
        v-for="entry in [{ id: 'action', icon: '↗', label: 'Действие' }, { id: 'speech', icon: '❝', label: 'Речь' }, { id: 'exploration', icon: '⌕', label: 'Исследование' }]"
        :key="entry.id"
        type="button"
        role="tab"
        :aria-selected="mode === entry.id"
        class="px-3 py-2 font-interface text-[8px] text-fabula-500"
        :class="mode === entry.id ? 'bg-[#17171d] text-[var(--accent-light)]' : ''"
        @click="emit('setMode', entry.id as InteractionMode)"
      >
        <span class="mr-1">{{ entry.icon }}</span>{{ entry.label }}
      </button>
    </div>
    <form class="rounded-[0_14px_14px_14px] border border-white/15 bg-[#14141a] p-3 transition focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_1px_var(--accent-soft)]" @submit.prevent="emit('submit')">
      <label class="sr-only" for="playerInput">Опиши свое действие</label>
      <textarea
        id="playerInput"
        ref="textarea"
        v-model="input"
        rows="1"
        maxlength="1200"
        class="max-h-[150px] min-h-[46px] w-full resize-none bg-transparent font-story text-[20px] leading-[1.45] text-fabula-100 outline-none placeholder:text-fabula-500"
        :placeholder="modeCopy[1]"
        @input="resize"
        @keydown.enter.exact.prevent="emit('submit')"
      />
      <div class="mt-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-1.5">
          <button v-for="tool in [{ id: 'inventory', icon: '☙', label: 'Добавить предмет из инвентаря' }, { id: 'journal', icon: '✒', label: 'Добавить запись из журнала' }, { id: 'check', icon: '⚄', label: 'Открыть проверку навыка' }]" :key="tool.id" type="button" class="grid size-8 place-items-center rounded-lg text-fabula-300 hover:bg-white/[.05]" :aria-label="tool.label" @click="emit('openTool', tool.id as InteractionToolName)">{{ tool.icon }}</button>
          <button type="button" class="grid size-8 place-items-center rounded-lg text-[var(--accent)] hover:bg-white/[.05]" aria-label="Показать локальный вариант текста" @click="emit('rewrite')">✧</button>
          <span class="mx-1 h-5 w-px bg-white/10" />
          <button type="button" class="grid size-8 place-items-center rounded-lg text-fabula-300 hover:bg-white/[.05]" aria-label="Подставить пример исследования" @click="emit('compose', 'Я осматриваю ближайшие следы и ищу безопасный путь.')">⌁</button>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-interface text-[8px] text-fabula-500">{{ input.length }} / 1200</span>
          <button type="submit" class="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-fabula-gold-light to-fabula-gold text-2xl text-[#22180a] shadow-[0_8px_24px_-10px_#d9a94a] disabled:opacity-40" aria-label="Отправить ход" :disabled="turnPending">↑</button>
        </div>
      </div>
    </form>
    <div class="mt-2 hidden items-center gap-4 font-interface text-[7px] text-fabula-500 min-[700px]:flex"><span>Enter - отправить</span><span>Shift + Enter - новая строка</span><span class="ml-auto">Ключи OpenRouter не хранятся в браузере</span></div>
  </section>
</template>

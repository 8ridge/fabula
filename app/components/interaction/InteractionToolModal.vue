<script setup lang="ts">
import type { GameSessionSnapshot, InventoryItemProjection } from '#shared/game'
import type { InteractionFontScale, InteractionToolName } from '~/types/interaction-ui'

const props = defineProps<{
  activeTool: InteractionToolName | null
  session: GameSessionSnapshot
  fontScale: InteractionFontScale
}>()

const emit = defineEmits<{
  close: []
  compose: [payload: { text: string, itemId?: string }]
  openTool: [tool: InteractionToolName]
  setFontScale: [scale: InteractionFontScale]
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const inventoryQuery = ref('')
const selectedItemId = ref('')

const toolCopy: Record<InteractionToolName, { eyebrow: string, title: string }> = {
  inventory: { eyebrow: 'Состояние сессии', title: 'Инвентарь' },
  journal: { eyebrow: 'Подтвержденные события', title: 'Журнал' },
  character: { eyebrow: 'Воплощение и связи', title: 'Персонажи' },
  world: { eyebrow: 'Сцена и известные места', title: 'Мир' },
  settings: { eyebrow: 'Чтение и ввод', title: 'Настройки' },
}

const currentCopy = computed(() => props.activeTool ? toolCopy[props.activeTool] : toolCopy.inventory)
const playerInventory = computed(() =>
  props.session.inventory.filter(item => item.owner_id === 'player' || item.holder_id === 'player'))
const filteredInventory = computed(() => {
  const query = inventoryQuery.value.trim().toLocaleLowerCase('ru')
  if (!query)
    return playerInventory.value
  return playerInventory.value.filter((item) => {
    const haystack = [item.name, item.description, item.location_name, item.holder_name].join(' ').toLocaleLowerCase('ru')
    return haystack.includes(query)
  })
})
const selectedItem = computed(() =>
  playerInventory.value.find(item => item.id === selectedItemId.value)
  || filteredInventory.value[0]
  || null)

const categoryLabels: Record<InventoryItemProjection['category'], string> = {
  tool: 'Инструмент',
  document: 'Документ',
  medicine: 'Медицина',
  keepsake: 'Личная вещь',
  resource: 'Ресурс',
}
const conditionLabels: Record<InventoryItemProjection['condition'], string> = {
  pristine: 'Новое',
  usable: 'Исправно',
  worn: 'Изношено',
  damaged: 'Повреждено',
  spent: 'Использовано',
}
const slotLabels: Record<Exclude<InventoryItemProjection['slot'], null>, string> = {
  hand: 'В руках',
  body: 'На себе',
  bag: 'В сумке',
}
const entryTypeLabels = {
  event: 'Событие',
  character: 'Персонаж',
  location: 'Место',
  item: 'Предмет',
  clue: 'Улика',
  promise: 'Обещание',
  objective: 'Цель',
}
const uncertaintyLabels = {
  confirmed: 'Подтверждено',
  reported: 'Со слов',
  suspected: 'Предположение',
  contradicted: 'Противоречие',
}

function itemsInSlot(slot: Exclude<InventoryItemProjection['slot'], null>) {
  return playerInventory.value.filter(item => item.slot === slot)
}

function addItemToTurn(item: InventoryItemProjection) {
  emit('compose', {
    text: `Я использую «${item.name}» для текущего действия.`,
    itemId: item.id,
  })
}

watch(() => props.activeTool, async (tool) => {
  await nextTick()
  if (tool) {
    if (tool === 'inventory' && !selectedItemId.value)
      selectedItemId.value = playerInventory.value[0]?.id || ''
    if (dialog.value && !dialog.value.open)
      dialog.value.showModal()
  }
  else if (dialog.value?.open) {
    dialog.value.close()
  }
})

watch(() => props.session.id, () => {
  inventoryQuery.value = ''
  selectedItemId.value = playerInventory.value[0]?.id || ''
})
</script>

<template>
  <dialog
    ref="dialog"
    class="fixed inset-0 z-[100] m-auto hidden h-[min(820px,92dvh)] w-[min(980px,95vw)] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#0e1014] p-0 text-fabula-100 shadow-[0_36px_120px_-28px_#000] backdrop:bg-black/80 open:flex"
    aria-labelledby="interactionToolTitle"
    @cancel.prevent="emit('close')"
    @close="emit('close')"
  >
    <header class="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-6">
      <div>
        <p class="font-interface text-[10px] uppercase tracking-[.14em] text-[var(--accent-light)]">{{ currentCopy.eyebrow }}</p>
        <h2 id="interactionToolTitle" class="mt-1 font-display text-[24px]">{{ currentCopy.title }}</h2>
      </div>
      <button
        type="button"
        class="grid size-10 place-items-center rounded-xl border border-white/10 text-[20px] text-fabula-300 transition hover:bg-white/5 hover:text-fabula-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        ×
      </button>
    </header>

    <nav class="flex shrink-0 gap-1 overflow-x-auto border-b border-white/8 px-3 py-2 [scrollbar-width:none] sm:px-5" aria-label="Разделы истории">
      <button
        v-for="tool in [
          { id: 'inventory', label: 'Инвентарь', icon: '◫' },
          { id: 'journal', label: 'Журнал', icon: '✒' },
          { id: 'character', label: 'Персонажи', icon: '♙' },
          { id: 'world', label: 'Мир', icon: '⌖' },
          { id: 'settings', label: 'Настройки', icon: '⚙' },
        ]"
        :key="tool.id"
        type="button"
        class="shrink-0 rounded-lg px-3 py-1.5 font-interface text-[10px] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        :class="activeTool === tool.id ? 'bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]' : 'text-[#9b9ba6] hover:bg-white/5'"
        @click="emit('openTool', tool.id as InteractionToolName)"
      >
        <span class="mr-1.5 text-[14px]" aria-hidden="true">{{ tool.icon }}</span>{{ tool.label }}
      </button>
    </nav>

    <div class="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] sm:p-6">
      <template v-if="activeTool === 'inventory'">
        <div class="mb-5 grid gap-4 lg:grid-cols-[minmax(250px,.72fr)_minmax(0,1.28fr)]">
          <section>
            <h3 class="font-display text-[19px] text-fabula-100">Размещение</h3>
            <p class="mt-1 text-[13px] leading-relaxed text-[#9b9ba6]">Только предметы из подтвержденного снимка сессии.</p>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <div
                v-for="slot in (['hand', 'body', 'bag'] as const)"
                :key="slot"
                class="min-h-[112px] rounded-xl border border-white/10 bg-white/[.025] p-3"
              >
                <span class="font-interface text-[10px] uppercase tracking-[.08em] text-[#9b9ba6]">{{ slotLabels[slot] }}</span>
                <template v-if="itemsInSlot(slot).length">
                  <button
                    v-for="item in itemsInSlot(slot)"
                    :key="item.id"
                    type="button"
                    class="mt-3 block w-full text-left"
                    @click="selectedItemId = item.id"
                  >
                    <strong class="block font-display text-[15px] font-normal text-[var(--accent-light)]">{{ item.name }}</strong>
                    <span class="mt-1 block text-[11px] text-[#9b9ba6]">×{{ item.quantity }} · {{ conditionLabels[item.condition] }}</span>
                  </button>
                </template>
                <span v-else class="mt-4 block text-[12px] text-[#9b9ba6]">Пусто</span>
              </div>
            </div>
          </section>

          <section>
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 class="font-display text-[19px] text-fabula-100">Все предметы</h3>
                <p class="mt-1 text-[13px] text-[#9b9ba6]">{{ playerInventory.length }} у персонажа</p>
              </div>
              <label class="flex min-h-10 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-[#9b9ba6] sm:max-w-[360px]">
                <span aria-hidden="true">⌕</span>
                <span class="sr-only">Найти предмет</span>
                <input
                  v-model="inventoryQuery"
                  type="search"
                  autocomplete="off"
                  placeholder="Найти предмет"
                  class="w-full bg-transparent text-[14px] text-fabula-100 outline-none placeholder:text-[#8f8f99]"
                >
              </label>
            </div>

            <div v-if="filteredInventory.length" class="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                v-for="item in filteredInventory"
                :key="item.id"
                type="button"
                class="rounded-xl border p-3 text-left transition"
                :class="selectedItem?.id === item.id
                  ? 'border-[rgb(var(--accent-rgb)/.55)] bg-[rgb(var(--accent-rgb)/.08)]'
                  : 'border-white/8 bg-white/[.02] hover:border-white/16'"
                @click="selectedItemId = item.id"
              >
                <span class="font-interface text-[10px] uppercase tracking-[.08em] text-[var(--accent-light)]">{{ categoryLabels[item.category] }}</span>
                <strong class="mt-1 block font-display text-[16px] font-normal text-fabula-100">{{ item.name }}</strong>
                <span class="mt-1 block text-[11px] text-[#9b9ba6]">×{{ item.quantity }} · {{ conditionLabels[item.condition] }}</span>
              </button>
            </div>
            <p v-else class="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center text-[14px] text-[#9b9ba6]">Предметов не найдено.</p>
          </section>
        </div>

        <section v-if="selectedItem" class="border-t border-white/10 pt-4">
          <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p class="font-interface text-[10px] uppercase tracking-[.1em] text-[var(--accent-light)]">{{ categoryLabels[selectedItem.category] }}</p>
              <h3 class="mt-1 font-display text-[20px] text-fabula-100">{{ selectedItem.name }}</h3>
              <p class="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-fabula-300">{{ selectedItem.description }}</p>
              <p class="mt-2 text-[12px] text-[#9b9ba6]">
                Держатель: {{ selectedItem.holder_name }} · место: {{ selectedItem.location_name }} · версия {{ selectedItem.version }}
              </p>
            </div>
            <button
              type="button"
              class="min-h-11 rounded-xl bg-[var(--accent)] px-4 font-display text-[14px] text-[#101114] hover:bg-[var(--accent-light)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-light)]"
              @click="addItemToTurn(selectedItem)"
            >
              Добавить в ход
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="activeTool === 'journal'">
        <p class="mb-4 max-w-[68ch] text-[15px] leading-relaxed text-fabula-300">
          Запись появляется только после подтвержденного события. Предположения и сведения со слов отмечены отдельно.
        </p>
        <div class="divide-y divide-white/8 border-y border-white/8">
          <article v-for="entry in session.journal" :key="entry.id" class="py-4">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="font-interface text-[10px] uppercase tracking-[.08em] text-[var(--accent-light)]">{{ entryTypeLabels[entry.entry_type] }}</span>
              <span class="font-interface text-[10px] text-[#9b9ba6]">{{ uncertaintyLabels[entry.uncertainty] }} · {{ entry.story_time }}</span>
            </div>
            <h3 class="mt-1.5 font-display text-[18px] text-fabula-100">{{ entry.title }}</h3>
            <p class="mt-1 text-[15px] leading-relaxed text-fabula-300">{{ entry.summary }}</p>
            <button
              type="button"
              class="mt-2 rounded-lg px-2 py-1 text-[12px] text-[var(--accent-light)] transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              @click="emit('compose', { text: `Я опираюсь на запись «${entry.title}»: ${entry.summary}` })"
            >
              Использовать в ходе
            </button>
          </article>
        </div>
      </template>

      <template v-else-if="activeTool === 'character'">
        <section class="border-b border-white/10 pb-5">
          <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--accent-light)]">{{ session.persona.role_label }}</p>
          <h3 class="mt-1 font-display text-[24px] text-fabula-100">{{ session.persona.name }}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-fabula-300">{{ session.persona.motivation }}</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-white/8 bg-white/[.02] p-3">
              <span class="font-interface text-[10px] uppercase text-[#9b9ba6]">Компетенция</span>
              <p class="mt-1 text-[14px] leading-relaxed text-fabula-100">{{ session.persona.competence }}</p>
            </div>
            <div class="rounded-xl border border-white/8 bg-white/[.02] p-3">
              <span class="font-interface text-[10px] uppercase text-[#9b9ba6]">Ограничение</span>
              <p class="mt-1 text-[14px] leading-relaxed text-fabula-100">{{ session.persona.limitation }}</p>
            </div>
          </div>
        </section>

        <section class="pt-5">
          <h3 class="font-display text-[19px] text-fabula-100">Известные персонажи</h3>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <article v-for="character in session.characters" :key="character.id" class="rounded-xl border border-white/8 bg-white/[.02] p-3">
              <p class="font-interface text-[10px] uppercase tracking-[.08em] text-[var(--accent-light)]">{{ character.relation }}</p>
              <h4 class="mt-1 font-display text-[17px] text-fabula-100">{{ character.name }}</h4>
              <p class="text-[12px] text-[#9b9ba6]">{{ character.role }}</p>
              <p class="mt-2 text-[14px] leading-relaxed text-fabula-300">{{ character.description }}</p>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="activeTool === 'world'">
        <section class="border-b border-white/10 pb-5">
          <p class="font-interface text-[10px] uppercase tracking-[.12em] text-[var(--accent-light)]">Текущая сцена · {{ session.scene.story_time }}</p>
          <h3 class="mt-1 font-display text-[24px] text-fabula-100">{{ session.scene.title }}</h3>
          <p class="mt-1 text-[14px] text-[#9b9ba6]">{{ session.scene.location_name }}</p>
          <p class="mt-3 text-[16px] leading-relaxed text-fabula-300">{{ session.scene.objective }}</p>
        </section>

        <section class="pt-5">
          <h3 class="font-display text-[19px] text-fabula-100">Известные места</h3>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <article v-for="location in session.locations" :key="location.id" class="rounded-xl border border-white/8 bg-white/[.02] p-3">
              <p class="font-interface text-[10px] uppercase tracking-[.08em] text-[var(--accent-light)]">{{ location.status }}</p>
              <h4 class="mt-1 font-display text-[17px] text-fabula-100">{{ location.name }}</h4>
              <p class="mt-2 text-[14px] leading-relaxed text-fabula-300">{{ location.description }}</p>
            </article>
          </div>
        </section>
      </template>

      <template v-else-if="activeTool === 'settings'">
        <section class="max-w-[620px]">
          <label class="font-display text-[17px] text-fabula-100">Размер текста истории</label>
          <p class="mt-1 text-[13px] leading-relaxed text-[#9b9ba6]">Меняется только чтение на этом устройстве и не влияет на канон.</p>
          <div class="mt-3 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10">
            <button
              v-for="option in (['normal', 'large', 'xlarge'] as InteractionFontScale[])"
              :key="option"
              type="button"
              class="min-h-12 border-r border-white/10 px-2 font-display text-[13px] last:border-r-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--accent)]"
              :class="fontScale === option ? 'bg-[var(--accent)] text-[#101114]' : 'text-fabula-300 hover:bg-white/5'"
              :aria-pressed="fontScale === option"
              @click="emit('setFontScale', option)"
            >
              {{ option === 'normal' ? '17 px' : option === 'large' ? '19 px' : '21 px' }}
            </button>
          </div>

          <div class="mt-6 border-t border-white/10 pt-5">
            <p class="font-display text-[17px] text-fabula-100">Управление</p>
            <dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
              <dt class="font-interface text-[10px] text-[var(--accent-light)]">Enter</dt><dd class="text-fabula-300">Отправить ход</dd>
              <dt class="font-interface text-[10px] text-[var(--accent-light)]">Shift + Enter</dt><dd class="text-fabula-300">Новая строка</dd>
              <dt class="font-interface text-[10px] text-[var(--accent-light)]">Ctrl / ⌘ + K</dt><dd class="text-fabula-300">Перейти к вводу</dd>
              <dt class="font-interface text-[10px] text-[var(--accent-light)]">Esc</dt><dd class="text-fabula-300">Закрыть панель</dd>
            </dl>
          </div>
        </section>
      </template>
    </div>
  </dialog>
</template>

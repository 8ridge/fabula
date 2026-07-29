<script setup lang="ts">
import { interactionConfig } from '~/data/interaction'
import type { InventoryItem, StoryToolset } from '~/data/interaction-tools'
import type { AiCatalog, InteractionFontScale, InteractionStory, InteractionToolName } from '~/types/interaction-ui'

const props = defineProps<{
  activeTool: InteractionToolName | null
  story: InteractionStory
  tools: StoryToolset
  aiCatalog: AiCatalog | null
  catalogPending: boolean
  fontScale: InteractionFontScale
}>()

const emit = defineEmits<{
  close: []
  compose: [text: string]
  toast: [message: string]
  openTool: [tool: InteractionToolName]
  setFontScale: [scale: InteractionFontScale]
}>()

const dialog = ref<HTMLDialogElement | null>(null)
const inventoryQuery = ref('')
const inventoryFilter = ref<InventoryItem['category'] | 'all'>('all')
const selectedInventoryId = ref('')
const inventoryCategories: Array<[InventoryItem['category'] | 'all', string]> = [
  ['all', 'Все'],
  ['weapon', 'Оружие'],
  ['armor', 'Броня'],
  ['artifact', 'Артефакты'],
  ['key', 'Ключи'],
  ['consumable', 'Расходники'],
]

const modalCopy = computed(() => ({
  models: ['КОНТУР OPENROUTER', 'Модели и промты'],
  inventory: ['СОСТОЯНИЕ СЕССИИ', 'Рюкзак и предметы'],
  journal: ['ДЕМО-ЖУРНАЛ', 'Локальные примеры'],
  character: ['ЛИСТ ПЕРСОНАЖА', 'Безымянный'],
  check: ['ПРОВЕРКА', 'Инструмент действия'],
  settings: ['НАСТРОЙКИ СЦЕНЫ', 'Опыт взаимодействия'],
})[props.activeTool || 'models'])
const filteredInventory = computed(() => {
  const query = inventoryQuery.value.trim().toLowerCase()
  return props.tools.inventory.filter((item) => {
    const matchesCategory = inventoryFilter.value === 'all' || item.category === inventoryFilter.value
    const haystack = [item.name, item.categoryLabel, item.rarityLabel, item.description].join(' ').toLowerCase()
    return matchesCategory && (!query || haystack.includes(query))
  })
})
const selectedInventoryItem = computed(() => props.tools.inventory.find(item => item.id === selectedInventoryId.value) || filteredInventory.value[0] || null)
const rarityClasses: Record<InventoryItem['rarity'], string> = {
  legendary: 'border-[#e8b24a] text-[#e8b24a] bg-[#e8b24a]/10',
  epic: 'border-fabula-epic text-fabula-epic bg-fabula-epic/10',
  rare: 'border-[#5b8fd6] text-[#5b8fd6] bg-[#5b8fd6]/10',
  common: 'border-white/15 text-fabula-300 bg-white/[.03]',
}

function moduleStatus(promptId: string) {
  const module = props.aiCatalog?.modules?.find(entry => entry.id === promptId)
  if (!module)
    return props.aiCatalog ? 'недоступен' : 'статус не загружен'
  if (module.id === 'authoritative-turn')
    return props.aiCatalog?.available ? 'живой turn route' : 'нужен серверный ключ'
  if (module.enabled)
    return 'доступен'
  if (module.blocked_reason)
    return 'честно заблокирован'
  return module.internal_only ? 'внутренний' : 'недоступен'
}

watch(() => props.activeTool, async (tool) => {
  await nextTick()
  if (tool) {
    if (tool === 'inventory' && !selectedInventoryId.value)
      selectedInventoryId.value = props.tools.inventory[0]?.id || ''
    if (dialog.value && !dialog.value.open)
      dialog.value.showModal()
  }
  else if (dialog.value?.open) {
    dialog.value.close()
  }
})

watch(() => props.tools, () => {
  inventoryQuery.value = ''
  inventoryFilter.value = 'all'
  selectedInventoryId.value = props.tools.inventory[0]?.id || ''
})
</script>

<template>
  <dialog
    ref="dialog"
    class="fixed inset-0 z-[100] m-auto hidden h-[min(836px,92dvh)] w-[min(790px,94vw)] flex-col overflow-hidden rounded-[20px] border border-[var(--accent)]/45 bg-[#121217] p-0 text-fabula-100 shadow-[0_40px_120px_-30px_#000] backdrop:bg-black/80 backdrop:backdrop-blur-sm open:flex"
    aria-labelledby="toolModalTitle"
    @cancel.prevent="emit('close')"
    @click.self="emit('close')"
    @close="emit('close')"
  >
    <header class="flex shrink-0 items-center justify-between border-b border-white/10 bg-[linear-gradient(145deg,var(--accent-soft),#15151a_70%)] px-6 py-5">
      <div><span class="font-interface text-[8px] uppercase tracking-[.12em] text-fabula-500">{{ modalCopy[0] }}</span><h2 id="toolModalTitle" class="mt-2 font-display text-[28px]">{{ modalCopy[1] }}</h2></div>
      <button type="button" class="grid size-10 place-items-center rounded-xl border border-white/10 text-fabula-300" aria-label="Закрыть" @click="emit('close')">×</button>
    </header>

    <div class="flex-1 overflow-y-auto px-6 py-5 [scrollbar-width:thin]">
      <template v-if="activeTool === 'models'">
        <div class="mb-4 flex items-center gap-3 rounded-xl border border-[#3e4b62] bg-[#191d27] p-3.5" role="status">
          <span class="grid size-8 place-items-center rounded-lg bg-[#2a3449] text-[#b7c8e4]">⌘</span>
          <span><strong class="block font-display text-[16px] font-normal">{{ catalogPending ? 'Проверяю серверный контур' : aiCatalog?.available ? 'OpenRouter готов к AI-вызовам' : 'OpenRouter ожидает серверный ключ' }}</strong><small class="font-interface text-[7px] text-[#9ba9bf]">Ключ не передается в браузер</small></span>
        </div>
        <p class="mb-4 text-[16px] leading-relaxed text-fabula-300">Игровой ход подключен через защищенный Nitro route. Остальные модули показывают честный серверный статус.</p>
        <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <div v-for="model in interactionConfig.models" :key="model.id" class="rounded-xl border border-white/10 bg-white/[.018] p-3">
            <strong class="block font-display text-[14px] font-normal">{{ model.label }}</strong>
            <small class="mt-1 block break-all font-interface text-[6px] text-fabula-500">{{ model.slug }}</small>
            <b class="mt-2 block font-interface text-[6px] uppercase text-[var(--accent)]">{{ model.phase }} · {{ model.status }}</b>
          </div>
        </div>
        <h3 class="mb-2 mt-5 font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500">{{ interactionConfig.prompts.length }} файлов-промтов</h3>
        <div class="space-y-2">
          <div v-for="prompt in interactionConfig.prompts" :key="prompt.id" class="grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-xl border border-white/10 px-3 py-3">
            <span class="font-interface text-[8px] text-[var(--accent)]">{{ prompt.number }}</span>
            <span class="min-w-0"><strong class="block truncate font-display text-[15px] font-normal">{{ prompt.title }}</strong><small class="font-interface text-[7px] text-fabula-500">{{ prompt.contract }}</small></span>
            <span class="rounded-md border border-white/10 px-2 py-1 font-interface text-[6px] text-fabula-300">{{ moduleStatus(prompt.id) }}</span>
          </div>
        </div>
        <div class="mt-5 flex justify-end"><a class="rounded-xl bg-gradient-to-b from-[var(--accent-light)] to-[var(--accent)] px-4 py-3 font-interface text-[9px] text-[#201608] no-underline" href="https://openrouter.ai" target="_blank" rel="noopener">Открыть OpenRouter</a></div>
      </template>

      <template v-else-if="activeTool === 'inventory'">
        <div class="mb-4 flex items-end justify-between"><div><span class="font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500">РЮКЗАК · ЛОКАЛЬНАЯ ДЕМО-СЕССИЯ</span><strong class="mt-1 block font-display text-[20px] font-normal"><b class="text-[var(--accent-light)]">{{ tools.inventory.length }}</b> / 24 слота</strong></div><span class="rounded-full border border-[var(--accent)]/45 bg-[var(--accent-soft)] px-3 py-1 font-interface text-[8px] text-[var(--accent-light)]">{{ tools.currency }}</span></div>
        <p class="mb-4 text-[15px] text-fabula-300">Предмет изменит мир только после подтвержденного сервером хода.</p>
        <div class="mb-3 flex items-center gap-3"><label class="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[.02] px-3 py-2"><span>⌕</span><span class="sr-only">Поиск по инвентарю</span><input v-model="inventoryQuery" class="w-full bg-transparent text-sm outline-none" type="search" placeholder="Найти предмет" autocomplete="off"></label><span class="font-interface text-[7px] text-fabula-500">{{ filteredInventory.length }} из {{ tools.inventory.length }}</span></div>
        <div class="mb-4 flex gap-1.5 overflow-x-auto" role="toolbar" aria-label="Фильтр инвентаря">
          <button v-for="([value, label]) in inventoryCategories" :key="value" type="button" class="shrink-0 rounded-full border px-3 py-1.5 font-interface text-[7px]" :class="inventoryFilter === value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-light)]' : 'border-white/10 text-fabula-500'" :aria-pressed="inventoryFilter === value" @click="inventoryFilter = value">{{ label }}</button>
        </div>
        <div class="grid gap-4 min-[700px]:grid-cols-[1fr_1fr]">
          <div class="space-y-2" role="list" aria-label="Предметы">
            <button v-for="item in filteredInventory" :key="item.id" type="button" class="flex w-full items-center gap-3 rounded-xl border p-3 text-left" :class="selectedInventoryItem?.id === item.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-white/10'" @click="selectedInventoryId = item.id">
              <span class="grid size-10 shrink-0 place-items-center rounded-xl border text-xl" :class="rarityClasses[item.rarity]">{{ item.icon }}</span>
              <span class="min-w-0 flex-1"><strong class="block truncate font-display text-[15px] font-normal">{{ item.name }}</strong><small class="font-interface text-[7px] text-fabula-500">{{ item.rarityLabel }} · {{ item.categoryLabel }}</small></span><b class="font-interface text-[8px] text-fabula-300">×{{ item.quantity }}</b>
            </button>
          </div>
          <section v-if="selectedInventoryItem" class="h-max rounded-[14px] border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4" aria-label="Выбранный предмет">
            <div class="flex items-center gap-3"><span class="grid size-12 place-items-center rounded-xl border text-2xl" :class="rarityClasses[selectedInventoryItem.rarity]">{{ selectedInventoryItem.icon }}</span><span><span class="font-interface text-[7px] uppercase text-fabula-500">{{ selectedInventoryItem.categoryLabel }}</span><h3 class="font-display text-[19px]">{{ selectedInventoryItem.name }}</h3><b class="font-interface text-[7px] text-[var(--accent-light)]">{{ selectedInventoryItem.rarityLabel }}</b></span></div>
            <p class="my-4 text-[15px] leading-relaxed text-fabula-300">{{ selectedInventoryItem.description }}</p>
            <div class="grid grid-cols-3 gap-2"><span v-for="entry in [['Количество', `×${selectedInventoryItem.quantity}`], ['Состояние', selectedInventoryItem.condition], ['Вес', selectedInventoryItem.weight]]" :key="entry[0]" class="rounded-lg border border-white/10 p-2"><small class="block font-interface text-[6px] text-fabula-500">{{ entry[0] }}</small><strong class="font-display text-sm font-normal">{{ entry[1] }}</strong></span></div>
            <div class="mt-4 flex gap-2"><button type="button" class="flex-1 rounded-xl bg-gradient-to-b from-[var(--accent-light)] to-[var(--accent)] p-2.5 font-interface text-[8px] text-[#201608]" @click="emit('compose', selectedInventoryItem.text)">Добавить в ход</button><button type="button" class="rounded-xl border border-white/10 px-3 font-interface text-[8px]" @click="emit('toast', selectedInventoryItem.inspect)">Осмотреть</button></div>
          </section>
        </div>
      </template>

      <template v-else-if="activeTool === 'journal'">
        <p class="mb-4 text-[15px] text-fabula-300">Это локальный демо-журнал. Записи только подставляют текст в поле хода.</p>
        <div class="space-y-2">
          <div v-for="item in tools.journal" :key="item.title" class="flex items-center gap-3 rounded-xl border border-white/10 p-3"><span class="text-[var(--accent)]">✒</span><span class="min-w-0 flex-1"><strong class="block font-display text-base font-normal">{{ item.title }}</strong><small class="block font-interface text-[7px] text-fabula-500">{{ item.meta }} · {{ item.text }}</small></span><button type="button" class="rounded-lg border border-[var(--accent)]/40 px-3 py-2 font-interface text-[7px] text-[var(--accent-light)]" @click="emit('compose', item.text)">В ход</button></div>
        </div>
      </template>

      <template v-else-if="activeTool === 'character'">
        <div class="flex gap-4 rounded-[15px] border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4"><img class="size-24 rounded-[14px] object-cover" src="/assets/avatar.jpg" alt="Портрет игрока"><div class="flex-1"><h3 class="font-display text-[26px]">Ты</h3><p class="text-fabula-300">{{ story.role }} · сцена 02</p><div class="mt-4 grid grid-cols-3 gap-2"><div v-for="entry in [['31', 'стойкость'], ['14', 'влияние'], [tools.currency, 'ресурс']]" :key="entry[1]" class="rounded-xl border border-white/10 p-2 text-center"><b class="block font-display text-lg font-normal text-[var(--accent-light)]">{{ entry[0] }}</b><small class="font-interface text-[6px] text-fabula-500">{{ entry[1] }}</small></div></div><div class="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><i class="block h-full w-[64%] bg-gradient-to-r from-[var(--accent-deep)] to-[var(--accent-light)]" /></div></div></div>
        <div class="mt-4 flex justify-end"><button type="button" class="rounded-xl bg-gradient-to-b from-[var(--accent-light)] to-[var(--accent)] px-4 py-3 font-interface text-[8px] text-[#201608]" @click="emit('openTool', 'inventory')">Открыть инвентарь</button></div>
      </template>

      <template v-else-if="activeTool === 'check'">
        <p class="mb-4 text-[15px] text-fabula-300">Итоговый порог и typed operations решает сервер.</p>
        <div class="grid gap-3 sm:grid-cols-2"><div v-for="check in tools.checks" :key="check.title" class="rounded-[14px] border border-white/10 p-4"><h3 class="font-display text-lg">{{ check.title }}</h3><p class="my-2 text-fabula-300">{{ check.text }}</p><b class="font-interface text-[7px] text-[var(--accent)]">{{ check.meta }}</b></div></div>
      </template>

      <template v-else-if="activeTool === 'settings'">
        <div><label class="mb-2 block font-interface text-[8px] uppercase tracking-[.1em] text-fabula-500">Размер текста</label><div class="flex overflow-hidden rounded-xl border border-white/10"><button v-for="option in (['normal', 'large', 'xlarge'] as InteractionFontScale[])" :key="option" type="button" class="flex-1 border-r border-white/10 px-3 py-3 font-interface text-[8px] last:border-0" :class="fontScale === option ? 'bg-[var(--accent)] text-[#201608]' : 'text-fabula-300'" :aria-pressed="fontScale === option" @click="emit('setFontScale', option)">{{ option === 'normal' ? 'Обычный' : option === 'large' ? 'Крупный' : 'Очень крупный' }}</button></div><small class="mt-2 block text-fabula-500">Масштаб сохраняется локально и не меняет канон.</small></div>
      </template>
    </div>
  </dialog>
</template>

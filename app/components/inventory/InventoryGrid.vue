<script setup lang="ts">
import { toRef } from 'vue'
import { inventoryConditionMeta, type InventoryItemView } from '~/types/inventory'

const props = withDefaults(defineProps<{
  items: InventoryItemView[]
  selectedItemId?: string | null
}>(), {
  selectedItemId: null,
})

const emit = defineEmits<{
  select: [itemId: string]
}>()

const { query, activeCategory, categories, filteredItems, resetFilters } =
  useInventoryView(toRef(props, 'items'))
</script>

<template>
  <section aria-labelledby="backpack-heading">
    <header class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="font-interface text-[10px] uppercase tracking-[.15em] text-[var(--accent-light)]">
          Все предметы
        </p>
        <h3 id="backpack-heading" class="mt-1 font-display text-[22px] text-fabula-100">
          Инвентарь
        </h3>
        <p class="mt-1 text-[13px] leading-relaxed text-[#9b9ba6]">
          {{ filteredItems.length }} из {{ items.length }} в этой ветке
        </p>
      </div>
      <span class="rounded-full border border-white/10 px-2.5 py-1 font-interface text-[10px] text-fabula-300">
        {{ filteredItems.length }}
      </span>
    </header>

    <label class="group flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-black/15 px-3 text-[#9b9ba6] transition focus-within:border-[rgb(var(--accent-rgb)/.6)] focus-within:ring-2 focus-within:ring-[rgb(var(--accent-rgb)/.1)]">
      <span aria-hidden="true">⌕</span>
      <span class="sr-only">Найти предмет</span>
      <input
        v-model="query"
        type="search"
        autocomplete="off"
        placeholder="Название, описание или место"
        class="min-w-0 flex-1 bg-transparent text-[14px] text-fabula-100 outline-none placeholder:text-[#77747a]"
      >
      <button
        v-if="query || activeCategory"
        type="button"
        class="rounded-md px-1.5 py-0.5 text-[11px] text-[#aaa5a5] hover:bg-white/[.06] hover:text-fabula-100"
        @click="resetFilters"
      >
        Сбросить
      </button>
    </label>

    <div class="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" aria-label="Фильтр предметов">
      <button
        type="button"
        class="shrink-0 rounded-lg border px-3 py-1.5 font-interface text-[10px] transition"
        :class="!activeCategory
          ? 'border-[rgb(var(--accent-rgb)/.55)] bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]'
          : 'border-white/10 bg-white/[.025] text-[#9b9ba6] hover:border-white/20'"
        @click="activeCategory = null"
      >
        Все
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="shrink-0 rounded-lg border px-3 py-1.5 font-interface text-[10px] transition"
        :class="activeCategory === category.id
          ? 'border-[rgb(var(--accent-rgb)/.55)] bg-[rgb(var(--accent-rgb)/.12)] text-[var(--accent-light)]'
          : 'border-white/10 bg-white/[.025] text-[#9b9ba6] hover:border-white/20'"
        @click="activeCategory = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <div v-if="filteredItems.length" class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      <button
        v-for="item in filteredItems"
        :key="item.id"
        type="button"
        :aria-pressed="selectedItemId === item.id"
        class="group relative min-w-0 overflow-hidden rounded-xl border text-left transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        :class="selectedItemId === item.id
          ? 'border-[var(--accent)] bg-[rgb(var(--accent-rgb)/.08)] shadow-[0_0_0_1px_rgb(var(--accent-rgb)/.15),0_12px_30px_rgba(0,0,0,.2)]'
          : 'border-white/[.1] bg-[#15161c] hover:-translate-y-0.5 hover:border-white/20'"
        @click="emit('select', item.id)"
      >
        <span class="absolute right-2 top-2 z-10 rounded-md border border-white/15 bg-[#111217]/90 px-1.5 py-0.5 font-interface text-[9px] text-fabula-100">
          {{ item.amountLabel }}
        </span>
        <InventoryItemIcon :item="item" />
        <span class="block p-2.5">
          <span class="block truncate font-display text-[15px] text-fabula-100">
            {{ item.name }}
          </span>
          <span class="mt-1.5 flex items-center justify-between gap-1.5">
            <span
              :class="inventoryConditionMeta[item.condition].className"
              class="truncate rounded border px-1.5 py-0.5 font-interface text-[8px] uppercase tracking-[.06em]"
            >
              {{ item.conditionLabel }}
            </span>
            <span class="truncate text-[10px] text-[#858189]">{{ item.slotLabel }}</span>
          </span>
        </span>
      </button>
    </div>

    <div v-else class="mt-4 grid min-h-44 place-items-center rounded-xl border border-dashed border-white/[.13] bg-white/[.015] p-6 text-center">
      <div>
        <p class="font-display text-[18px] text-fabula-100">Предметов не найдено</p>
        <p class="mt-1 text-[13px] text-[#918e95]">Измени запрос или сбрось фильтр.</p>
        <button type="button" class="mt-3 text-[13px] text-[var(--accent-light)] hover:text-fabula-100" @click="resetFilters">
          Сбросить фильтр
        </button>
      </div>
    </div>
  </section>
</template>

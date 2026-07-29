<script setup lang="ts">
import { interactionTools, type InventoryItem } from '~/data/interaction-tools'

const emit = defineEmits<{
  toast: [message: string]
}>()

const tabs: Array<{ id: InventoryItem['category'] | 'all', label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'weapon', label: 'Оружие' },
  { id: 'armor', label: 'Броня' },
  { id: 'artifact', label: 'Артефакты' },
  { id: 'consumable', label: 'Расходники' },
  { id: 'key', label: 'Ключи' },
]
const activeTab = ref<(typeof tabs)[number]['id']>('all')
const selectedItemId = ref(interactionTools.fant.inventory[0]!.id)
const items = interactionTools.fant.inventory
const visibleItems = computed(() => activeTab.value === 'all' ? items : items.filter(item => item.category === activeTab.value))
const selectedItem = computed(() => items.find(item => item.id === selectedItemId.value) ?? items[0]!)
const rarityClasses: Record<InventoryItem['rarity'], string> = {
  legendary: 'border-[#e8b24a] text-[#e8b24a] shadow-[0_0_14px_-1px_#e8b24a,inset_0_2px_6px_#0007]',
  epic: 'border-fabula-epic text-fabula-epic shadow-[0_0_12px_-2px_#9a6fd0,inset_0_2px_6px_#0007]',
  rare: 'border-[#5b8fd6] text-[#5b8fd6] shadow-[0_0_12px_-2px_#5b8fd6,inset_0_2px_6px_#0007]',
  common: 'border-white/10 text-[#e9dfc9] shadow-[inset_0_2px_6px_#0007]',
}
</script>

<template>
  <section data-hub-screen class="absolute inset-0 z-10 bg-[radial-gradient(120%_90%_at_50%_0%,#22190d,#140d06_60%,#0a0704)]">
    <div class="absolute inset-0 overflow-y-auto px-[22px] pb-[94px] [scrollbar-width:none] min-[900px]:left-[clamp(224px,17vw,280px)] min-[900px]:px-[max(4%,28px)] min-[900px]:pb-12">
      <HubAppBar title="Инвентарь" action="⛃ 248" />

      <div class="mx-auto mb-4 flex max-w-[1120px] items-center gap-[14px] rounded-[14px] border border-[#d9a94a2e] bg-white/[.025] p-[14px]">
        <div class="grid size-[60px] shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[#a97a2c] bg-[radial-gradient(circle_at_50%_30%,#5a4526,#1c130a)] text-[28px] text-black/35">☗</div>
        <div><p class="font-display text-lg text-fabula-gold-light">Безымянный</p><p class="text-sm text-[#b6a88a]">Скиталец · ур. 7</p></div>
      </div>

      <div class="mx-auto mb-4 flex max-w-[1120px] gap-2 overflow-x-auto [scrollbar-width:none]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="shrink-0 rounded-full border px-[13px] py-[7px] font-display text-xs tracking-[.08em]"
          :class="activeTab === tab.id ? 'border-[#a97a2c] bg-fabula-gold/[.07] text-fabula-gold-light' : 'border-[#d9a94a2e] text-[#8a7c60]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="mx-auto mb-[18px] grid max-w-[1120px] grid-cols-4 gap-2.5 min-[900px]:grid-cols-8">
        <button
          v-for="item in visibleItems"
          :key="item.id"
          type="button"
          :aria-label="item.name"
          class="relative grid aspect-square place-items-center rounded-[11px] border bg-[linear-gradient(160deg,#241a0e,#120c06)] text-[22px] transition active:scale-95"
          :class="[rarityClasses[item.rarity], selectedItem.id === item.id ? 'outline-2 outline-offset-2 outline-fabula-gold-light' : '']"
          @click="selectedItemId = item.id"
        >
          {{ item.icon }}
          <span v-if="item.quantity > 1" class="absolute bottom-[3px] right-[5px] font-display text-[10px] text-[#b6a88a]">{{ item.quantity }}</span>
        </button>
        <span
          v-for="index in Math.max(0, 16 - visibleItems.length)"
          :key="`empty-${index}`"
          class="grid aspect-square place-items-center rounded-[11px] border border-dashed border-white/[.06] bg-[#0e0a06] text-sm text-[#4a4030]"
        >+</span>
      </div>

      <article class="mx-auto max-w-[1120px] rounded-xl border border-[#a97a2c] bg-[radial-gradient(#ffffff07_.5px,transparent_.5px)_0_0/3px_3px,linear-gradient(#1c1409,#120c06)] p-[13px]">
        <div class="mb-2 flex items-center gap-3">
          <div class="grid size-11 place-items-center rounded-[10px] border bg-[#0e0a06] text-2xl" :class="rarityClasses[selectedItem.rarity]">{{ selectedItem.icon }}</div>
          <div>
            <h2 class="font-display text-base text-fabula-gold-light">{{ selectedItem.name }}</h2>
            <p class="text-[13px] tracking-[.04em] text-fabula-gold">{{ selectedItem.rarityLabel }} · {{ selectedItem.categoryLabel.toLowerCase() }}</p>
          </div>
        </div>
        <p class="text-[15px] italic leading-[1.35] text-[#b6a88a]">"{{ selectedItem.description }}"</p>
        <div class="mt-3 flex gap-2">
          <button type="button" class="flex-1 rounded-[10px] bg-gradient-to-b from-fabula-gold-light to-[#8a6122] p-2.5 font-display text-xs uppercase tracking-[.08em] text-[#1a1206] shadow-[inset_0_1px_0_rgba(255,246,222,.45),inset_0_-3px_8px_rgba(90,60,15,.55),0_10px_26px_-10px_rgba(217,169,74,.5)]" @click="emit('toast', 'Предмет экипирован')">Экипировать</button>
          <button type="button" class="flex-1 rounded-[10px] border border-[#a97a2c] bg-fabula-gold/[.06] p-2.5 font-display text-xs uppercase tracking-[.08em] text-fabula-gold-light" @click="emit('toast', selectedItem.inspect)">Осмотреть</button>
        </div>
      </article>
    </div>
  </section>
</template>

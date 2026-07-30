<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryEquipmentSlot, InventorySlotId } from '~/types/inventory'

const props = withDefaults(defineProps<{
  characterName: string
  slots: InventoryEquipmentSlot[]
  selectedItemId?: string | null
}>(), {
  selectedItemId: null,
})

const emit = defineEmits<{
  select: [itemId: string]
}>()

const equippedCount = computed(() =>
  props.slots.reduce((total, slot) => total + slot.items.length, 0),
)

const anchorClasses: Record<InventorySlotId, string> = {
  hand: 'left-3 top-4',
  body: 'right-3 top-[9.25rem]',
  bag: 'bottom-4 left-3',
}
</script>

<template>
  <section aria-labelledby="equipment-heading">
    <header class="mb-4 flex items-start justify-between gap-3">
      <div>
        <p class="font-interface text-[10px] uppercase tracking-[.15em] text-[var(--accent-light)]">
          Экипировка
        </p>
        <h3 id="equipment-heading" class="mt-1 font-display text-[22px] text-fabula-100">
          При себе
        </h3>
        <p class="mt-1 text-[13px] leading-relaxed text-[#9b9ba6]">
          Размещение из подтвержденного снимка сессии.
        </p>
      </div>
      <span class="rounded-full border border-white/10 px-2.5 py-1 font-interface text-[10px] text-fabula-300">
        {{ equippedCount }}
      </span>
    </header>

    <div class="relative min-h-[25rem] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgb(var(--accent-rgb)/.11),transparent_34%),linear-gradient(145deg,#16171d,#0d0e12)] p-3">
      <div class="pointer-events-none absolute inset-4 rounded-xl border border-dashed border-white/[.08]" />

      <div class="pointer-events-none absolute inset-x-0 top-14 flex justify-center" aria-hidden="true">
        <div class="relative h-[18rem] w-28 opacity-50">
          <div class="absolute left-1/2 top-0 size-11 -translate-x-1/2 rounded-full border border-[#77747a] bg-[#1a1b22]" />
          <div class="absolute left-1/2 top-12 h-32 w-[4.5rem] -translate-x-1/2 rounded-t-[2rem] border border-[#77747a] bg-[#18191f]" />
          <div class="absolute left-0 top-[5.25rem] h-24 w-px -rotate-[25deg] bg-[#77747a]" />
          <div class="absolute right-0 top-[5.25rem] h-24 w-px rotate-[25deg] bg-[#77747a]" />
          <div class="absolute bottom-0 left-[2.2rem] h-[7.5rem] w-px -rotate-[5deg] bg-[#77747a]" />
          <div class="absolute bottom-0 right-[2.2rem] h-[7.5rem] w-px rotate-[5deg] bg-[#77747a]" />
        </div>
      </div>

      <div class="pointer-events-none absolute right-3 top-4 max-w-[8.5rem] text-right">
        <span class="inline-block max-w-full truncate rounded-full border border-white/10 bg-[#111217]/85 px-3 py-1 font-interface text-[9px] uppercase tracking-[.08em] text-fabula-300">
          {{ characterName }}
        </span>
      </div>

      <section
        v-for="slot in slots"
        :key="slot.id"
        :class="anchorClasses[slot.id]"
        class="absolute z-10 w-[9rem] rounded-xl border border-white/[.13] bg-[#131419]/95 p-2.5 shadow-lg"
        :aria-label="slot.label"
      >
        <p class="font-interface text-[9px] uppercase tracking-[.09em] text-[#96939b]">
          {{ slot.label }}
        </p>
        <div v-if="slot.items.length" class="mt-2 max-h-[6.7rem] space-y-1.5 overflow-y-auto [scrollbar-width:thin]">
          <button
            v-for="item in slot.items"
            :key="item.id"
            type="button"
            :aria-pressed="item.id === selectedItemId"
            class="flex w-full items-center gap-2 rounded-lg border p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            :class="item.id === selectedItemId
              ? 'border-[rgb(var(--accent-rgb)/.6)] bg-[rgb(var(--accent-rgb)/.11)]'
              : 'border-white/[.08] bg-white/[.025] hover:border-white/20'"
            @click="emit('select', item.id)"
          >
            <InventoryItemIcon :item="item" size="slot" />
            <span class="min-w-0">
              <strong class="block truncate font-display text-[12px] font-normal text-fabula-100">
                {{ item.name }}
              </strong>
              <span class="mt-0.5 block text-[9px] text-[#96939b]">{{ item.amountLabel }}</span>
            </span>
          </button>
        </div>
        <p v-else class="mt-3 text-[12px] text-[#77747a]">
          Пусто
        </p>
      </section>
    </div>
  </section>
</template>

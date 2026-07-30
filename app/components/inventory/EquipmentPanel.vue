<script setup lang="ts">
import { computed } from 'vue'
import type {
  InventoryEquipmentPositionId,
  InventoryEquipmentSlot,
  InventoryItemView,
} from '~/types/inventory'

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

const positionClasses: Record<InventoryEquipmentPositionId, string> = {
  head_accessory: 'col-start-1 row-start-1 justify-self-start self-start',
  head: 'col-start-3 row-start-1 justify-self-end self-start',
  body: 'col-start-1 row-start-2 justify-self-start self-center',
  backpack: 'col-start-3 row-start-2 justify-self-end self-center',
  left_hand: 'col-start-1 row-start-3 justify-self-start self-center',
  right_hand: 'col-start-3 row-start-3 justify-self-end self-center',
  left_hand_accessory: 'col-start-1 row-start-4 justify-self-start self-center',
  right_hand_accessory: 'col-start-3 row-start-4 justify-self-end self-center',
  belt: 'col-start-1 row-start-5 justify-self-start self-center',
  legs: 'col-start-3 row-start-5 justify-self-end self-center',
  feet: 'col-start-3 row-start-6 justify-self-end self-end',
}

function visibleItem(slot: InventoryEquipmentSlot): InventoryItemView | null {
  return slot.items.find(item => item.id === props.selectedItemId)
    || slot.items[0]
    || null
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
          То, что у тебя сейчас под рукой.
        </p>
      </div>
      <span class="rounded-full border border-white/10 px-2.5 py-1 font-interface text-[10px] text-fabula-300">
        {{ equippedCount }}
      </span>
    </header>

    <div class="relative mx-auto grid h-[35rem] w-full max-w-[28rem] grid-cols-[minmax(0,1fr)_4.75rem_minmax(0,1fr)] grid-rows-6 overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgb(var(--accent-rgb)/.11),transparent_34%),linear-gradient(145deg,#16171d,#0d0e12)] p-2.5">
      <div class="pointer-events-none absolute inset-4 rounded-xl border border-dashed border-white/[.08]" />

      <div class="pointer-events-none absolute inset-5 flex items-center justify-center" aria-hidden="true">
        <img
          src="/assets/inventory/human-mannequin-transparent-v2.png"
          alt=""
          class="h-auto max-h-[31rem] w-full max-w-[20.75rem] object-contain opacity-55 drop-shadow-[0_18px_32px_rgba(0,0,0,.52)]"
        >
      </div>

      <div class="pointer-events-none absolute bottom-3 left-1/2 z-20 max-w-[8.5rem] -translate-x-1/2 text-center">
        <span class="inline-block max-w-full truncate rounded-full border border-white/10 bg-[#111217]/85 px-3 py-1 font-interface text-[9px] uppercase tracking-[.08em] text-fabula-300">
          {{ characterName }}
        </span>
      </div>

      <button
        v-for="slot in slots"
        :key="slot.id"
        type="button"
        :disabled="!visibleItem(slot)"
        :aria-label="`${slot.label}: ${visibleItem(slot)?.name || 'пусто'}`"
        :aria-pressed="visibleItem(slot)?.id === selectedItemId"
        :title="slot.hint"
        :class="[
          positionClasses[slot.id],
          visibleItem(slot)?.id === selectedItemId
            ? 'border-[rgb(var(--accent-rgb)/.62)] bg-[rgb(var(--accent-rgb)/.13)] shadow-[0_0_0_1px_rgb(var(--accent-rgb)/.16),0_10px_24px_rgba(0,0,0,.34)]'
            : 'border-white/[.13] bg-[#131419]/95 shadow-lg hover:border-white/25',
          !visibleItem(slot) && 'cursor-default opacity-75 hover:border-white/[.13]',
        ]"
        class="z-10 flex min-h-[3.4rem] w-[5.75rem] items-center gap-1.5 rounded-xl border p-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
        @click="visibleItem(slot) && emit('select', visibleItem(slot)!.id)"
      >
        <InventoryItemIcon
          v-if="visibleItem(slot)"
          :item="visibleItem(slot)!"
          size="slot"
          class="!size-7"
        />
        <span
          v-else
          aria-hidden="true"
          class="grid size-7 shrink-0 place-items-center rounded-lg border border-dashed border-white/15 text-[14px] text-[#6f6d75]"
        >
          +
        </span>

        <span class="min-w-0 flex-1">
          <span class="line-clamp-2 font-interface text-[7px] uppercase leading-[1.2] tracking-[.06em] text-[#96939b]">
            {{ slot.label }}
          </span>
          <strong class="mt-0.5 block truncate font-display text-[10px] font-normal text-fabula-100">
            {{ visibleItem(slot)?.name || 'Пусто' }}
          </strong>
        </span>

        <span
          v-if="slot.items.length > 1"
          class="absolute right-1 top-1 rounded-full border border-white/10 bg-[#0d0e12] px-1 text-[7px] text-fabula-300"
        >
          +{{ slot.items.length - 1 }}
        </span>
      </button>
    </div>
  </section>
</template>

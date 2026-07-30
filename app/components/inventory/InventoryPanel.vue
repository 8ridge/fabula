<script setup lang="ts">
import { toRef } from 'vue'
import type { GameSessionSnapshot } from '#shared/game'
import type { InventoryItemView } from '~/types/inventory'

const props = defineProps<{
  session: GameSessionSnapshot
}>()

const emit = defineEmits<{
  compose: [payload: { text: string, itemId: string }]
}>()

const inventory = useInventoryStore(toRef(props, 'session'))

function useItem(item: InventoryItemView) {
  if (!item.canUse)
    return

  emit('compose', {
    text: `Я использую «${item.name}» для текущего действия.`,
    itemId: item.id,
  })
}
</script>

<template>
  <div class="grid min-h-full gap-4 xl:grid-cols-[minmax(17rem,.82fr)_minmax(23rem,1.28fr)_minmax(17rem,.8fr)]">
    <div class="rounded-2xl border border-white/[.08] bg-white/[.015] p-4 sm:p-5">
      <InventoryEquipmentPanel
        :character-name="session.persona.name"
        :slots="inventory.equipmentSlots.value"
        :selected-item-id="inventory.selectedItemId.value"
        @select="inventory.selectItem"
      />
    </div>

    <div class="rounded-2xl border border-white/[.08] bg-white/[.015] p-4 sm:p-5">
      <InventoryGrid
        :items="inventory.items.value"
        :selected-item-id="inventory.selectedItemId.value"
        @select="inventory.selectItem"
      />
    </div>

    <div class="rounded-2xl border border-white/[.08] bg-black/[.08] p-4 sm:p-5">
      <InventoryItemDetail
        :item="inventory.selectedItem.value"
        @use-item="useItem"
      />
    </div>
  </div>
</template>

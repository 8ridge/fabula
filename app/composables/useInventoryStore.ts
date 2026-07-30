import { computed, ref, watch, type Ref } from 'vue'
import type { GameSessionSnapshot, InventoryItemProjection } from '#shared/game'
import {
  inventoryCategoryMeta,
  inventoryConditionMeta,
  inventorySlotMeta,
  type InventoryEquipmentSlot,
  type InventoryItemView,
  type InventoryItemVisual,
  type InventorySlotId,
} from '~/types/inventory'

const slotOrder: InventorySlotId[] = ['hand', 'body', 'bag']

const templateArt = [
  { fragments: ['knife', 'нож'], assetUrl: '/assets/items/knife.png', symbol: '†' },
  { fragments: ['sword', 'blade', 'меч', 'клинок'], assetUrl: '/assets/items/sword.png', symbol: '†' },
  { fragments: ['map', 'карта'], assetUrl: '/assets/items/map.png', symbol: '⌖' },
  { fragments: ['key', 'token', 'ключ', 'жетон'], assetUrl: '/assets/items/key.png', symbol: '◇' },
  { fragments: ['flask', 'bottle', 'фляг', 'бутыл'], assetUrl: '/assets/items/flask.png', symbol: '◉' },
  { fragments: ['striker', 'flint', 'огнив', 'кресал'], assetUrl: '/assets/items/striker.png', symbol: '⌁' },
  { fragments: ['keepsake', 'amulet', 'амулет', 'талисман'], assetUrl: '/assets/items/amulet.png', symbol: '◇' },
  { fragments: ['ash', 'пепел', 'зола'], assetUrl: '/assets/items/ash.png', symbol: '◆' },
] as const

function visualFor(item: InventoryItemProjection): InventoryItemVisual {
  const category = inventoryCategoryMeta[item.category]
  const visualIdentity = `${item.template_id} ${item.name}`.toLocaleLowerCase('ru')
  const exactArt = templateArt.find(rule =>
    rule.fragments.some(fragment => visualIdentity.includes(fragment)),
  )
  const assetUrl = exactArt?.assetUrl || category.assetUrl

  return {
    assetUrl,
    symbol: exactArt?.symbol || category.symbol,
    alt: `Иконка предмета «${item.name}»`,
    status: assetUrl ? 'ready' : 'fallback',
    isPremium: false,
  }
}

function unavailableReason(item: InventoryItemProjection): string | null {
  if (item.holder_id !== 'player')
    return `Сейчас предмет у персонажа «${item.holder_name}»`
  if (item.condition === 'spent' || item.quantity <= 0 || item.charges === 0)
    return 'Предмет уже использован'
  return null
}

function projectItem(item: InventoryItemProjection): InventoryItemView {
  const reason = unavailableReason(item)
  return {
    ...item,
    categoryLabel: inventoryCategoryMeta[item.category].label,
    conditionLabel: inventoryConditionMeta[item.condition].label,
    slotLabel: item.slot ? inventorySlotMeta[item.slot].label : 'Не размещено',
    amountLabel: item.charges === null ? `×${item.quantity}` : `${item.charges} зар.`,
    visual: visualFor(item),
    canUse: reason === null,
    unavailableReason: reason,
  }
}

/**
 * Проекция авторитетного снимка сессии для интерфейса инвентаря.
 * Отдельный клиентский API-store здесь не нужен: обновленный снимок уже
 * приходит через useGameSession после каждого подтвержденного хода.
 */
export function useInventoryStore(session: Ref<GameSessionSnapshot>) {
  const selectedItemId = ref<string | null>(null)

  const items = computed(() =>
    session.value.inventory
      .filter(item => item.owner_id === 'player' || item.holder_id === 'player')
      .map(projectItem),
  )

  const equipmentSlots = computed<InventoryEquipmentSlot[]>(() =>
    slotOrder.map((slotId) => {
      const meta = inventorySlotMeta[slotId]
      return {
        id: slotId,
        label: meta.label,
        hint: meta.hint,
        items: items.value.filter(item =>
          item.holder_id === 'player' && item.slot === slotId,
        ),
      }
    }),
  )

  const selectedItem = computed(() =>
    items.value.find(item => item.id === selectedItemId.value) || null,
  )

  function syncSelection() {
    if (!items.value.some(item => item.id === selectedItemId.value))
      selectedItemId.value = items.value[0]?.id || null
  }

  function selectItem(itemId: string) {
    if (items.value.some(item => item.id === itemId))
      selectedItemId.value = itemId
  }

  watch(
    () => [
      session.value.id,
      ...session.value.inventory
        .filter(item => item.owner_id === 'player' || item.holder_id === 'player')
        .map(item => item.id),
    ],
    syncSelection,
    { immediate: true },
  )

  return {
    items,
    equipmentSlots,
    selectedItemId,
    selectedItem,
    selectItem,
  }
}

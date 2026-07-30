import { computed, ref, watch, type Ref } from 'vue'
import type { GameSessionSnapshot, InventoryItemProjection } from '#shared/game'
import {
  inventoryCategoryMeta,
  inventoryConditionMeta,
  inventoryEquipmentPositionMeta,
  inventorySlotMeta,
  type InventoryEquipmentPositionId,
  type InventoryEquipmentSlot,
  type InventoryItemView,
  type InventoryItemVisual,
} from '~/types/inventory'

const equipmentPositionOrder: InventoryEquipmentPositionId[] = [
  'head_accessory',
  'head',
  'body',
  'backpack',
  'left_hand',
  'right_hand',
  'left_hand_accessory',
  'right_hand_accessory',
  'belt',
  'legs',
  'feet',
]

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

export function inventoryVisualFor(item: InventoryItemProjection): InventoryItemVisual {
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

export function inventoryUnavailableReason(item: InventoryItemProjection): string | null {
  if (item.holder_id !== 'player')
    return `Сейчас предмет у персонажа «${item.holder_name}»`
  if (item.condition === 'spent' || item.quantity <= 0 || item.charges === 0)
    return 'Предмет уже использован'
  return null
}

export function projectInventoryItem(item: InventoryItemProjection): InventoryItemView {
  const reason = inventoryUnavailableReason(item)
  return {
    ...item,
    categoryLabel: inventoryCategoryMeta[item.category].label,
    conditionLabel: inventoryConditionMeta[item.condition].label,
    slotLabel: item.slot ? inventorySlotMeta[item.slot].label : 'Не размещено',
    amountLabel: item.charges === null ? `×${item.quantity}` : `${item.charges} зар.`,
    visual: inventoryVisualFor(item),
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
      .map(projectInventoryItem),
  )

  const equipmentSlots = computed<InventoryEquipmentSlot[]>(() => {
    const handItems = items.value.filter(item =>
      item.holder_id === 'player' && item.slot === 'hand',
    )
    const bodyItems = items.value.filter(item =>
      item.holder_id === 'player' && item.slot === 'body',
    )
    const bagItems = items.value.filter(item =>
      item.holder_id === 'player' && item.slot === 'bag',
    )

    return equipmentPositionOrder.map((positionId) => {
      const meta = inventoryEquipmentPositionMeta[positionId]
      let positionItems: InventoryItemView[] = []
      if (positionId === 'body')
        positionItems = bodyItems
      else if (positionId === 'backpack')
        positionItems = bagItems
      else if (positionId === 'right_hand')
        positionItems = handItems.filter((_item, index) => index % 2 === 0)
      else if (positionId === 'left_hand')
        positionItems = handItems.filter((_item, index) => index % 2 === 1)

      return {
        id: positionId,
        label: meta.label,
        hint: meta.hint,
        items: positionItems,
      }
    })
  })

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

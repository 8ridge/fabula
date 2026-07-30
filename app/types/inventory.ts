import type { InventoryItemProjection } from '#shared/game'

export type InventoryCategory = InventoryItemProjection['category']
export type InventoryCondition = InventoryItemProjection['condition']
export type InventorySlotId = Exclude<InventoryItemProjection['slot'], null>
export type InventoryEquipmentPositionId =
  | 'head'
  | 'head_accessory'
  | 'body'
  | 'legs'
  | 'feet'
  | 'left_hand'
  | 'right_hand'
  | 'backpack'
  | 'belt'
  | 'left_hand_accessory'
  | 'right_hand_accessory'
export type ItemArtStatus = 'ready' | 'pending' | 'fallback'

export interface InventoryItemVisual {
  assetUrl: string | null
  symbol: string
  alt: string
  status: ItemArtStatus
  isPremium: boolean
}

export interface InventoryItemView extends InventoryItemProjection {
  categoryLabel: string
  conditionLabel: string
  slotLabel: string
  amountLabel: string
  visual: InventoryItemVisual
  canUse: boolean
  unavailableReason: string | null
}

export interface InventoryEquipmentSlot {
  id: InventoryEquipmentPositionId
  label: string
  hint: string
  items: InventoryItemView[]
}

export const inventoryEquipmentPositionMeta = {
  head_accessory: {
    label: 'Аксессуар головы',
    hint: 'Украшение, маска или другой предмет на голове',
  },
  head: {
    label: 'Голова',
    hint: 'Шлем или другой головной убор',
  },
  body: {
    label: 'Тело',
    hint: 'Основная одежда или броня',
  },
  backpack: {
    label: 'Рюкзак',
    hint: 'Предметы, которые герой несет за спиной',
  },
  left_hand: {
    label: 'Левая рука',
    hint: 'Предмет в левой руке',
  },
  right_hand: {
    label: 'Правая рука',
    hint: 'Предмет в правой руке',
  },
  left_hand_accessory: {
    label: 'Аксессуар левой руки',
    hint: 'Кольцо, браслет или другое украшение левой руки',
  },
  right_hand_accessory: {
    label: 'Аксессуар правой руки',
    hint: 'Кольцо, браслет или другое украшение правой руки',
  },
  belt: {
    label: 'Пояс',
    hint: 'Предмет на поясе',
  },
  legs: {
    label: 'Штаны',
    hint: 'Одежда или броня для ног',
  },
  feet: {
    label: 'Ботинки',
    hint: 'Обувь героя',
  },
} as const satisfies Record<
  InventoryEquipmentPositionId,
  { label: string, hint: string }
>

export const inventoryCategoryMeta = {
  tool: {
    label: 'Инструмент',
    symbol: '⌁',
    assetUrl: null,
  },
  document: {
    label: 'Документ',
    symbol: '▤',
    assetUrl: null,
  },
  medicine: {
    label: 'Медицина',
    symbol: '✚',
    assetUrl: null,
  },
  keepsake: {
    label: 'Личная вещь',
    symbol: '◇',
    assetUrl: null,
  },
  resource: {
    label: 'Ресурс',
    symbol: '◆',
    assetUrl: null,
  },
} as const satisfies Record<
  InventoryCategory,
  { label: string, symbol: string, assetUrl: string | null }
>

export const inventoryConditionMeta = {
  pristine: {
    label: 'Новое',
    className: 'border-emerald-400/35 bg-emerald-300/[.08] text-emerald-200',
  },
  usable: {
    label: 'Исправно',
    className: 'border-sky-400/35 bg-sky-300/[.08] text-sky-200',
  },
  worn: {
    label: 'Изношено',
    className: 'border-amber-400/35 bg-amber-300/[.08] text-amber-100',
  },
  damaged: {
    label: 'Повреждено',
    className: 'border-orange-400/35 bg-orange-300/[.08] text-orange-200',
  },
  spent: {
    label: 'Использовано',
    className: 'border-stone-400/25 bg-stone-300/[.06] text-stone-300',
  },
} as const satisfies Record<
  InventoryCondition,
  { label: string, className: string }
>

export const inventorySlotMeta = {
  hand: {
    label: 'В руках',
    hint: 'То, чем герой пользуется прямо сейчас',
  },
  body: {
    label: 'На себе',
    hint: 'Одежда и предметы быстрого доступа',
  },
  bag: {
    label: 'В сумке',
    hint: 'То, что герой несет с собой',
  },
} as const satisfies Record<
  InventorySlotId,
  { label: string, hint: string }
>

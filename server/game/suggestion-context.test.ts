import { describe, expect, test } from 'bun:test'
import type { GameMessage, InventoryItemProjection, SuggestedAction } from '../../shared/game'
import { filterContextualSuggestions } from './suggestion-context'

const suggestions: SuggestedAction[] = [
  {
    id: 'suggestion:conversation',
    label: 'Подойти к двери, прислушаться к разговору соседей',
    mode: 'action',
    intent_hint: 'listen_to_neighbors_conversation',
  },
  {
    id: 'suggestion:peephole',
    label: 'Включить свет и выглянуть в глазок',
    mode: 'action',
    intent_hint: 'look_through_peephole',
  },
  {
    id: 'suggestion:shards',
    label: 'Проверить, не осталось ли осколков на полу',
    mode: 'action',
    intent_hint: 'inspect_shards_on_floor',
  },
  {
    id: 'suggestion:bottle',
    label: 'Надеть куртку и приготовить бутылку в кармане',
    mode: 'action',
    intent_hint: 'prepare_bottle',
  },
  {
    id: 'suggestion:journal',
    label: 'Записать в дневник услышанное',
    mode: 'speech',
    intent_hint: 'record_heard_events',
  },
]

const spentBottle = [{
  id: 'item:bottle',
  template_id: 'item-template:bottle',
  name: 'Бутылка',
  category: 'resource',
  description: 'Разбитая бутылка.',
  quantity: 0,
  charges: null,
  condition: 'spent',
  owner_id: 'player',
  owner_name: 'Грег',
  holder_id: 'player',
  holder_name: 'Грег',
  location_id: 'location:apartment',
  location_name: 'Квартира',
  slot: 'hand',
  version: 1,
  provenance: {
    kind: 'world_event',
    source_event_id: 'event:bottle-taken',
    summary: 'Бутылка была взята в квартире.',
  },
}] satisfies InventoryItemProjection[]

function narrator(text: string): GameMessage {
  return {
    id: `message:${text.length}`,
    role: 'narrator',
    speaker: 'Рассказчик',
    text,
    mode: null,
    outcome: 'success',
    created_at: '2026-08-04T00:00:00.000Z',
    selected_items: [],
    selected_journal_entries: [],
  }
}

describe('contextual suggestions', () => {
  test('removes stale actions after the bottle breaks outside', () => {
    const result = filterContextualSuggestions(suggestions, spentBottle, [
      narrator('Бутылка вылетает из окна и разбивается о стену дома напротив.'),
      narrator('Шаги на улице удаляются. В подъезде тихо.'),
    ])

    expect(result.map(suggestion => suggestion.id)).toEqual([
      'suggestion:peephole',
      'suggestion:journal',
    ])
  })

  test('keeps a referenced item and indoor debris when they remain available', () => {
    const activeBottle = [{
      ...spentBottle[0]!,
      quantity: 1,
      condition: 'usable' as const,
    }]
    const result = filterContextualSuggestions(
      suggestions.filter(suggestion => ['suggestion:shards', 'suggestion:bottle'].includes(suggestion.id)),
      activeBottle,
      [narrator('Бутылка падает на пол комнаты, рядом остаются осколки.')],
    )

    expect(result).toHaveLength(2)
  })

  test('does not confuse an unavailable item with an unrelated word sharing a prefix', () => {
    const spentMap = [{
      ...spentBottle[0]!,
      name: 'Карта',
    }]
    const result = filterContextualSuggestions([{
      id: 'suggestion:painting',
      label: 'Осмотреть картину на стене',
      mode: 'exploration',
      intent_hint: 'inspect_painting',
    }], spentMap, [narrator('На стене висит картина.')])

    expect(result).toHaveLength(1)
  })
})

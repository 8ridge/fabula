import { describe, expect, test } from 'bun:test'
import {
  confirmsIrreversibleItemLoss,
  explicitlyLosesSelectedItem,
} from './inventory-consumption'

describe('inventory consumption language', () => {
  test('recognizes an irreversible throw and its confirmed result', () => {
    expect(explicitlyLosesSelectedItem('Открою окно и брошу бутылку наружу.')).toBe(true)
    expect(confirmsIrreversibleItemLoss('Бутылка разбивается о стену и осыпается осколками.')).toBe(true)
  })

  test('does not treat a reusable strike, negation or an unrelated verb as loss', () => {
    expect(explicitlyLosesSelectedItem('Ударю арматурой по двери.')).toBe(false)
    expect(explicitlyLosesSelectedItem('Не брошу бутылку, а оставлю ее в руке.')).toBe(false)
    expect(explicitlyLosesSelectedItem('Выполню действие с аптечкой.')).toBe(false)
  })
})

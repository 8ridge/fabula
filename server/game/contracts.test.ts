import { describe, expect, test } from 'bun:test'
import { parseCreateGameSessionRequest } from './contracts'

describe('game session create contract', () => {
  test('accepts an edited preset and normalizes all player-authored fields', () => {
    const request = parseCreateGameSessionRequest({
      schema_version: 'session-create@1.0',
      story_pack_id: 'zero-line',
      persona: {
        name: '  Мира  ',
        role_id: 'zero-line:courier',
        role_label: '  Волонтер штаба  ',
        competence: '  Знает дворы   и соседей  ',
        limitation: '  Не бросает знакомых в беде  ',
        motivation: '  Найти брата до рассвета  ',
        background: '  Раньше развозила продукты по району.  ',
        embodiment_note: '',
        narration_density: 'rich',
      },
    })

    expect(request.persona).toMatchObject({
      name: 'Мира',
      role_label: 'Волонтер штаба',
      competence: 'Знает дворы и соседей',
      limitation: 'Не бросает знакомых в беде',
      motivation: 'Найти брата до рассвета',
      background: 'Раньше развозила продукты по району.',
      narration_density: 'rich',
    })
  })

  test('keeps the legacy compact preset request compatible', () => {
    const request = parseCreateGameSessionRequest({
      schema_version: 'session-create@1.0',
      story_pack_id: 'zero-line',
      persona: {
        name: 'Грег',
        role_id: 'zero-line:courier',
        motivation: 'Добыть лекарство',
        embodiment_note: '',
        narration_density: 'balanced',
      },
    })

    expect(request.persona.role_label).toBeUndefined()
    expect(request.persona.background).toBeUndefined()
  })

  test('requires a meaningful competence for a free preset', () => {
    expect(() => parseCreateGameSessionRequest({
      schema_version: 'session-create@1.0',
      story_pack_id: 'zero-line',
      persona: {
        name: 'Мира',
        role_id: 'zero-line:free',
        role_label: 'Своя роль',
        competence: 'Чиню все',
        limitation: 'Боится темноты',
        motivation: 'Найти брата',
        background: '',
        embodiment_note: '',
        narration_density: 'balanced',
      },
    })).toThrow('Для свободного воплощения')
  })
})

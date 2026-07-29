import { describe, expect, test } from 'bun:test'
import { parseStandaloneOutput } from './standalone-contracts'

export function validScenePlan() {
  return {
    plan_version: 'scene-plan@0.2',
    scene_goal: 'Сохранить причинность.',
    dramatic_question: 'Что изменится?',
    active_world_pressures: [],
    npc_intentions: [],
    unresolved_consequences: [],
    allowed_directions: [],
    avoid_repetition: [],
    forbidden_next_moves: [],
    climax_conditions: [],
    potential_media_trigger: {
      event_ref: null,
      eligible_only_if: [],
      visual_uniqueness: '',
    },
    expires_after_turns: 4,
  }
}

describe('standalone AI contracts', () => {
  test('accepts the exact scene-plan structure', () => {
    expect(parseStandaloneOutput('scene-plan', validScenePlan())).toEqual(validScenePlan())
  })

  test('rejects an extra field and a wrong nested type', () => {
    expect(() => parseStandaloneOutput('scene-plan', {
      ...validScenePlan(),
      invented: true,
    })).toThrow()
    expect(() => parseStandaloneOutput('scene-plan', {
      ...validScenePlan(),
      potential_media_trigger: {
        event_ref: null,
        eligible_only_if: 'not-an-array',
        visual_uniqueness: '',
      },
    })).toThrow()
  })

  test('rejects a syntax-valid but structurally incomplete audit', () => {
    expect(() => parseStandaloneOutput('turn-qa', {
      audit_version: 'canon-audit@0.2',
      pass: true,
    })).toThrow()
  })
})

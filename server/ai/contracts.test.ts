import { describe, expect, test } from 'bun:test'
import { ContractError, parseTurnCommand, parseTurnOutput } from './contracts'

export function validTurnCommand(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 'turn-command@1.0',
    session_id: 'session:12345678',
    idempotency_key: 'turn:12345678',
    expected_session_version: 0,
    mode: 'action',
    text: 'Я осматриваю арку.',
    story_id: 'fant',
    selected_target_ids: [],
    selected_item_ids: [],
    selected_suggestion_id: null,
    ...overrides,
  }
}

export function validTurnOutput(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 'turn-output@0.2',
    turn_id: 'turn:12345678',
    expected_session_version: 0,
    status: 'resolved',
    intent: {
      type: 'inspect_arch',
      targets: [],
      referenced_entities: [],
      atomic_steps: [],
    },
    context_check: {
      actor_can_attempt: true,
      actor_conscious: true,
      target_reachable: true,
      target_perceivable: true,
      item_accessible: true,
      ownership_valid: true,
      knowledge_sources_valid: true,
      channel_valid: true,
      scope_valid: true,
      consent_valid: true,
      barriers_allow_attempt: true,
      time_sufficient: true,
      blocking_reasons: [],
    },
    difficulty: {
      base: 1,
      environment: 1,
      time_pressure: 0,
      injury: 0,
      opposition: 0,
      skill: 1,
      tools: 0,
      preparation: 0,
      help: 0,
      final_band: 1,
      uncertainty: 'low',
    },
    resolution: {
      summary: 'Ты замечаешь следы на внутренней стороне арки.',
      outcome: 'success',
      reason_codes: ['target_perceivable'],
      costs_and_consequences: [],
    },
    operations: [],
    narrative_brief: {
      must_include: ['следы'],
      must_not_invent: ['нового свидетеля'],
      tone: 'tense',
      point_of_view: 'second_person',
      sensory_scope: ['visible'],
    },
    narrative_text: 'Ты проводишь пальцами по холодному камню и замечаешь свежую пыль.',
    suggested_actions: [{
      label: 'Проверить следы',
      mode: 'exploration',
      intent_hint: 'inspect_tracks',
    }],
    media_candidate: null,
    safety_flags: [],
    audit: {
      canon_fact_ids_used: [],
      memory_event_ids_used: [],
      assumptions: [],
      unresolved_ambiguities: [],
      difficulty_regulation_note: null,
    },
    ...overrides,
  }
}

describe('turn command contract', () => {
  test('accepts only the narrow client command', () => {
    const parsed = parseTurnCommand(validTurnCommand())
    expect(parsed.schema_version).toBe('turn-command@1.0')
    expect(parsed.text).toBe('Я осматриваю арку.')
  })

  test('rejects forged server authority fields', () => {
    expect(() => parseTurnCommand(validTurnCommand({
      authority: { allowed_operation_types: ['inventory.spawn'] },
    }))).toThrow(ContractError)
  })
})

describe('turn output contract', () => {
  test('accepts a canonical no-operation preview result', () => {
    const parsed = parseTurnOutput(validTurnOutput(), 'turn:12345678', 0)
    expect(parsed.schema_version).toBe('turn-output@0.2')
    expect(parsed.operations).toEqual([])
  })

  test('rejects legacy Prompt 01 fields instead of translating them', () => {
    const legacy = {
      contract_version: 'turn-output@0.2',
      turn_id: 'turn:12345678',
      feasibility: { status: 'possible' },
      fact_ops: [],
      inventory_ops: [],
    }
    expect(() => parseTurnOutput(legacy, 'turn:12345678', 0)).toThrow(ContractError)
  })

  test('rejects any canonical operation in the process-memory preview', () => {
    const output = validTurnOutput({
      operations: [{ type: 'event.create', operation_index: 0 }],
    })
    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(/запрещает операции/)
  })

  test('recalculates difficulty server-side', () => {
    const output = validTurnOutput({
      difficulty: {
        ...validTurnOutput().difficulty,
        final_band: 5,
      },
    })
    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(/неверно рассчитала/)
  })

  test('rejects resolved output when a context gate blocks the attempt', () => {
    const output = validTurnOutput({
      context_check: {
        ...validTurnOutput().context_check,
        actor_can_attempt: false,
        blocking_reasons: ['actor_cannot_attempt'],
      },
    })
    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(/Resolved-ход/)
  })

  test('requires blocking reasons whenever a context gate is false', () => {
    const output = validTurnOutput({
      status: 'rejected',
      context_check: {
        ...validTurnOutput().context_check,
        actor_can_attempt: false,
      },
      resolution: {
        ...validTurnOutput().resolution,
        outcome: 'impossible',
      },
    })
    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(/blocking_reasons/)
  })

  test('accepts a rejected impossible attempt with an explicit blocker', () => {
    const output = validTurnOutput({
      status: 'rejected',
      context_check: {
        ...validTurnOutput().context_check,
        actor_can_attempt: false,
        blocking_reasons: ['actor_cannot_attempt'],
      },
      resolution: {
        ...validTurnOutput().resolution,
        outcome: 'impossible',
      },
      narrative_text: '',
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).status).toBe('rejected')
  })
})

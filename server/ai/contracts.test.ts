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
    selected_target_ids: [],
    selected_item_ids: [],
    selected_journal_entry_ids: [],
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
    suggested_actions: [
      {
        label: 'Проверить следы',
        mode: 'exploration',
        intent_hint: 'inspect_tracks',
      },
      {
        label: 'Сопоставить пыль с камнем арки',
        mode: 'exploration',
        intent_hint: 'compare_dust_with_arch',
      },
    ],
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
    expect(parsed.selected_journal_entry_ids).toEqual([])
  })

  test('accepts journal references and normalizes older commands without them', () => {
    const withReference = parseTurnCommand(validTurnCommand({
      selected_journal_entry_ids: ['journal:12345678'],
    }))
    expect(withReference.selected_journal_entry_ids).toEqual(['journal:12345678'])

    const {
      selected_journal_entry_ids: _journalEntryIds,
      ...olderCommand
    } = validTurnCommand()
    expect(parseTurnCommand(olderCommand).selected_journal_entry_ids).toEqual([])
  })

  test('rejects forged server authority fields', () => {
    expect(() => parseTurnCommand(validTurnCommand({
      authority: { allowed_operation_types: ['inventory.spawn'] },
    }))).toThrow(ContractError)
  })

  test('accepts six varied suggested actions', () => {
    const modes = ['action', 'speech', 'exploration', 'action', 'speech', 'exploration'] as const
    const output = validTurnOutput({
      suggested_actions: modes.map((mode, index) => ({
        label: `Вариант ${index + 1}`,
        mode,
        intent_hint: `intent_${index + 1}`,
      })),
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).suggested_actions).toHaveLength(6)
  })
})

describe('turn output contract', () => {
  test('accepts a canonical no-operation clarification result', () => {
    const parsed = parseTurnOutput(validTurnOutput(), 'turn:12345678', 0)
    expect(parsed.schema_version).toBe('turn-output@0.2')
    expect(parsed.operations).toEqual([])
  })

  test('rejects duplicate suggested actions from the model', () => {
    const duplicate = {
      label: 'Проверить следы',
      mode: 'exploration',
      intent_hint: 'inspect_tracks_again',
    }
    const output = validTurnOutput({
      suggested_actions: [
        {
          label: 'Проверить следы',
          mode: 'exploration',
          intent_hint: 'inspect_tracks',
        },
        duplicate,
      ],
    })

    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(ContractError)
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

  test('accepts a closed canonical event operation', () => {
    const output = validTurnOutput({
      operations: [{
        type: 'event.create',
        operation_index: 0,
        event_id: 'event:reserved:0001',
        event_kind: 'location_inspected',
        actor_ids: ['player'],
        target_ids: [],
        item_ids: [],
        location_id: 'location:summoning-hall',
        source_turn_id: 'turn:12345678',
      }],
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).operations[0]?.type).toBe('event.create')
  })

  test('accepts a reserved inventory instance operation', () => {
    const output = validTurnOutput({
      operations: [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: 'event:reserved:0001',
          event_kind: 'item_taken',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: ['item:reserved:0001'],
          location_id: 'location:summoning-hall',
          source_turn_id: 'turn:12345678',
        },
        {
          type: 'inventory.create_instance',
          operation_index: 1,
          source_event_id: 'event:reserved:0001',
          item_id: 'item:reserved:0001',
          template_id: 'item-template:eighth-seal:copper-seal',
          name: 'Пустая медная печать',
          category: 'keepsake',
          description: 'Печать без имени и договора.',
          owner_id: 'player',
          holder_id: 'player',
          location_id: 'location:summoning-hall',
          quantity: 1,
          charges: null,
          condition: 'usable',
          slot: 'hand',
        },
      ],
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).operations[1]?.type).toBe('inventory.create_instance')
  })

  test('accepts a closed scene transition operation', () => {
    const output = validTurnOutput({
      operations: [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: 'event:reserved:0001',
          event_kind: 'location_reached',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [],
          location_id: 'location:unfinished-contracts-archive',
          source_turn_id: 'turn:12345678',
        },
        {
          type: 'scene.transition',
          operation_index: 1,
          source_event_id: 'event:reserved:0001',
          scene_id: 'scene:reserved:0001',
          title: 'Дверь архива',
          location_id: 'location:unfinished-contracts-archive',
          story_time: 'Второй час после призыва',
          objective: 'Открыть архив, не принимая чужого договора.',
          present_character_ids: ['character:ilva-rein'],
          expected: {
            scene_id: 'scene:eighth-seal:summoning-hall',
            location_id: 'location:summoning-hall',
            story_time: 'Первый час после призыва',
          },
        },
      ],
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).operations[1]?.type).toBe('scene.transition')
  })

  test('accepts a canonical presence update with explicit departures', () => {
    const output = validTurnOutput({
      operations: [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: 'event:reserved:0001',
          event_kind: 'ritual_architect_arrived',
          actor_ids: ['character:maelis-arden'],
          target_ids: ['character:kassar-vel'],
          item_ids: [],
          location_id: 'location:summoning-hall',
          source_turn_id: 'turn:12345678',
        },
        {
          type: 'scene.update_presence',
          operation_index: 1,
          source_event_id: 'event:reserved:0001',
          present_character_ids: ['character:ilva-rein', 'character:maelis-arden'],
          departures: [{
            character_id: 'character:kassar-vel',
            destination_location_id: 'location:unfinished-contracts-archive',
          }],
          expected: {
            scene_id: 'scene:eighth-seal:summoning-hall',
            present_character_ids: ['character:ilva-rein', 'character:kassar-vel'],
          },
        },
      ],
    })
    expect(parseTurnOutput(output, 'turn:12345678', 0).operations[1]?.type).toBe('scene.update_presence')
  })

  test('rejects an operation outside the closed catalog', () => {
    const output = validTurnOutput({
      operations: [{ type: 'world.patch', operation_index: 0 }],
    })
    expect(() => parseTurnOutput(output, 'turn:12345678', 0)).toThrow(/запрещенный тип операции/)
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

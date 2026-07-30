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

  test('accepts the strict inventory advisory and rejects invented fields', () => {
    const advisory = {
      module_version: 'inventory-advisory@1.1',
      action_feasible: true,
      reason_codes: ['item_accessible'],
      selected_items: [{
        item_id: 'item:kit',
        exists: true,
        accessible: true,
        owner_id: 'player',
        holder_id: 'player',
        location_id: 'location:hall',
        quantity: 1,
        charges: 2,
        condition: 'usable',
        slot: 'bag',
        version: 3,
        provenance_summary: 'Получена до начала истории.',
        reason_codes: [],
      }],
      tracked_items: [{
        item_id: 'item:kit',
        selected: true,
        accessible: true,
        owner_id: 'player',
        holder_id: 'player',
        location_id: 'location:hall',
        quantity: 1,
        charges: 2,
        condition: 'usable',
        slot: 'bag',
        version: 3,
        provenance_summary: 'Получена до начала истории.',
        scene_relation: 'carried_by_player',
        reason_codes: [],
      }],
      referenced_objects: [],
      operation_candidates: [],
      scene_sync: {
        current_location_id: 'location:hall',
        player_carried_item_ids: ['item:kit'],
        scene_item_ids: ['item:kit'],
        remote_item_ids: [],
        orphaned_item_ids: [],
        consistency_errors: [],
      },
      story_sync: {
        canon_compatible: true,
        scene_compatible: true,
        plot_relevant_item_ids: ['item:kit'],
        required_narrative_facts: [],
        forbidden_narrative_claims: [],
        continuity_risks: [],
        unresolved_questions: [],
      },
      interaction_effects: {
        time_cost: 'brief',
        noise: 'none',
        hands_required: 1,
        storage_required: 'bag',
        traces: [],
        witness_ids: [],
        resource_changes: [],
        condition_changes: [],
      },
      consistency_notes: [],
    }

    expect(parseStandaloneOutput('inventory', advisory)).toEqual(advisory)
    expect(() => parseStandaloneOutput('inventory', {
      ...advisory,
      authoritative_operation: true,
    })).toThrow()
  })

  test('accepts structured journal and character updates from Mistral', () => {
    const projection = {
      module_version: 'journal-character-compiler@1.0',
      entries: [{
        entry_id: 'journal:reserved:0001',
        event_refs: ['event:confirmed:0001'],
        title: 'Изменение доверия',
        public_summary: 'Илва подтверждает, что услышала тот же шум за дверью.',
        location_ref: 'location:summoning-hall',
        participant_refs: ['character:ilva-rein'],
        fact_refs: ['fact:confirmed:0001'],
        item_refs: [],
        relationship_changes_visible_to_player: ['Илва стала внимательнее к словам игрока.'],
        rumors: [],
        open_threads: [],
        tags: ['Илва'],
      }],
      character_updates: [{
        character_id: 'character:ilva-rein',
        source_event_refs: ['event:confirmed:0001'],
        relation_summary: 'Считает наблюдения игрока полезными',
        public_description: null,
        knowledge_fact_refs: ['fact:confirmed:0001'],
      }],
      location_index_updates: [],
      quest_index_updates: [],
      server_only_callback_hooks: [],
    }

    expect(parseStandaloneOutput('journal', projection)).toEqual(projection)
  })
})

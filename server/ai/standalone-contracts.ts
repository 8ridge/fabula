import type { AiModuleId } from './catalog'
import type { JsonValue } from './contracts'
import { ContractError } from './contracts'

type JsonSchema = Record<string, unknown>

const text = (maxLength = 1_000): JsonSchema => ({ type: 'string', maxLength })
const stringList = (maxItems = 32, maxLength = 500): JsonSchema => ({
  type: 'array',
  maxItems,
  items: text(maxLength),
})
const strictObject = (properties: Record<string, JsonSchema>): JsonSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
})
const objectList = (item: JsonSchema, maxItems = 32): JsonSchema => ({
  type: 'array',
  maxItems,
  items: item,
})
const nullable = (schema: JsonSchema): JsonSchema => ({
  anyOf: [schema, { type: 'null' }],
})

const scenePlanSchema = strictObject({
  plan_version: { type: 'string', const: 'scene-plan@0.2' },
  scene_goal: text(),
  dramatic_question: text(),
  active_world_pressures: objectList(strictObject({
    pressure_ref: text(160),
    next_change_if_ignored: text(),
    time_horizon_turns: { type: 'integer', minimum: 0, maximum: 100 },
  })),
  npc_intentions: objectList(strictObject({
    npc_ref: text(160),
    wants_now: text(),
    will_not_do: text(),
    knowledge_limit: text(),
  })),
  unresolved_consequences: objectList(strictObject({
    source_event_ref: text(160),
    callback_condition: text(),
    eligible_now: { type: 'boolean' },
    possible_form: text(),
  })),
  allowed_directions: objectList(strictObject({
    direction: text(),
    type: { type: 'string', enum: ['safe', 'risky', 'unexpected'] },
    required_facts: stringList(),
    pressure_advanced: stringList(),
  })),
  avoid_repetition: stringList(),
  forbidden_next_moves: stringList(),
  climax_conditions: objectList(strictObject({
    condition: text(),
    currently_met: { type: 'boolean' },
    missing: stringList(),
  })),
  potential_media_trigger: strictObject({
    event_ref: { anyOf: [text(160), { type: 'null' }] },
    eligible_only_if: stringList(),
    visual_uniqueness: text(),
  }),
  expires_after_turns: { type: 'integer', minimum: 1, maximum: 20 },
})

const narrationSchema = strictObject({
  renderer_version: { type: 'string', const: 'aion-narrative@0.2' },
  scene_text: text(6_000),
  used_fact_refs: stringList(),
  omitted_optional_details: stringList(),
  detected_conflicts: stringList(),
})

const canonAuditSchema = strictObject({
  audit_version: { type: 'string', const: 'canon-audit@0.2' },
  pass: { type: 'boolean' },
  hard_errors: objectList(strictObject({
    code: text(160),
    fact_refs: stringList(),
    explanation: text(),
    required_action: { type: 'string', enum: ['reject', 'retry', 'manual_review'] },
  })),
  soft_warnings: stringList(),
  missing_callbacks: stringList(),
  unsupported_narrative_claims: stringList(),
  recommended_prompt_correction: text(2_000),
})

const journalSchema = strictObject({
  module_version: { type: 'string', const: 'journal-character-compiler@1.0' },
  entries: objectList(strictObject({
    entry_id: text(160),
    event_refs: stringList(),
    title: text(160),
    public_summary: text(2_000),
    location_ref: text(160),
    participant_refs: stringList(),
    fact_refs: stringList(),
    item_refs: stringList(),
    relationship_changes_visible_to_player: stringList(),
    rumors: objectList(strictObject({
      text: text(),
      source_ref: text(160),
      confidence: { type: 'string', enum: ['unknown', 'low', 'medium', 'high'] },
    })),
    open_threads: stringList(),
    tags: stringList(),
  })),
  character_updates: objectList(strictObject({
    character_id: text(160),
    source_event_refs: stringList(16, 160),
    relation_summary: nullable(text(500)),
    public_description: nullable(text(1_000)),
    knowledge_fact_refs: stringList(16, 160),
  }), 16),
  location_index_updates: stringList(),
  quest_index_updates: stringList(),
  server_only_callback_hooks: objectList(strictObject({
    source_event_ref: text(160),
    condition_refs: stringList(),
    suggested_horizon_turns: { type: 'integer', minimum: 0, maximum: 1_000 },
  })),
})

const difficultySchema = strictObject({
  director_version: { type: 'string', const: 'difficulty-advisory@0.2' },
  current_band: { type: 'string', enum: ['too_easy', 'fair', 'tense', 'too_hard', 'blocked'] },
  evidence: stringList(),
  preparation_rating: { type: 'string', enum: ['none', 'weak', 'adequate', 'strong', 'overprepared'] },
  recommended_risk: { type: 'string', enum: ['low', 'medium', 'high', 'extreme'] },
  recommended_adjustments: objectList(strictObject({
    knob: text(160),
    direction: { type: 'string', enum: ['decrease', 'hold', 'increase'] },
    amount: { type: 'string', enum: ['small', 'medium'] },
    reason: text(),
    must_preserve: stringList(),
  })),
  clarity_support: stringList(),
  retreat_or_recovery_options: stringList(),
  forbidden_adjustments: stringList(),
  expires_after_turns: { type: 'integer', minimum: 1, maximum: 20 },
})

const inventoryAdvisorySchema = strictObject({
  module_version: { type: 'string', const: 'inventory-advisory@1.1' },
  action_feasible: { type: 'boolean' },
  reason_codes: stringList(24, 160),
  selected_items: objectList(strictObject({
    item_id: text(160),
    exists: { type: 'boolean' },
    accessible: { type: 'boolean' },
    owner_id: nullable(text(160)),
    holder_id: nullable(text(160)),
    location_id: nullable(text(160)),
    quantity: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
    charges: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
    condition: nullable({
      type: 'string',
      enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
    }),
    slot: nullable({
      type: 'string',
      enum: ['hand', 'body', 'bag'],
    }),
    version: { type: 'integer', minimum: 0, maximum: 1_000_000 },
    provenance_summary: nullable(text(1_000)),
    reason_codes: stringList(16, 160),
  }), 16),
  tracked_items: objectList(strictObject({
    item_id: text(160),
    selected: { type: 'boolean' },
    accessible: { type: 'boolean' },
    owner_id: text(160),
    holder_id: text(160),
    location_id: text(160),
    quantity: { type: 'integer', minimum: 0, maximum: 1_000_000 },
    charges: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
    condition: {
      type: 'string',
      enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
    },
    slot: nullable({
      type: 'string',
      enum: ['hand', 'body', 'bag'],
    }),
    version: { type: 'integer', minimum: 0, maximum: 1_000_000 },
    provenance_summary: text(1_000),
    scene_relation: {
      type: 'string',
      enum: ['carried_by_player', 'present_in_scene', 'held_by_present_character', 'remote', 'spent'],
    },
    reason_codes: stringList(16, 160),
  }), 128),
  referenced_objects: objectList(strictObject({
    normalized_name: text(240),
    source: {
      type: 'string',
      enum: ['player_input', 'scene', 'story_pack', 'confirmed_event', 'confirmed_fact', 'recent_turn'],
    },
    portability: { type: 'string', enum: ['portable', 'fixed', 'unknown'] },
    continuity_status: {
      type: 'string',
      enum: ['existing_instance', 'candidate_new_instance', 'environment_only', 'contradiction', 'unknown'],
    },
    matched_item_id: nullable(text(160)),
    evidence: stringList(16, 500),
  }), 32),
  operation_candidates: objectList(strictObject({
    type: {
      type: 'string',
      enum: [
        'inventory.create_instance',
        'inventory.transfer_custody',
        'inventory.transfer_ownership',
        'inventory.consume',
      ],
    },
    item_id: nullable(text(160)),
    required_on_success: { type: 'boolean' },
    amount: nullable({ type: 'integer', minimum: 1, maximum: 1_000_000 }),
    from_entity_id: nullable(text(160)),
    to_entity_id: nullable(text(160)),
    reason: text(1_000),
    expected_state: nullable(strictObject({
      owner_id: text(160),
      holder_id: text(160),
      location_id: text(160),
      quantity: { type: 'integer', minimum: 0, maximum: 1_000_000 },
      charges: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
      condition: {
        type: 'string',
        enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
      },
      slot: nullable({
        type: 'string',
        enum: ['hand', 'body', 'bag'],
      }),
      version: { type: 'integer', minimum: 0, maximum: 1_000_000 },
    })),
    resulting_state: nullable(strictObject({
      owner_id: text(160),
      holder_id: text(160),
      location_id: text(160),
      quantity: { type: 'integer', minimum: 0, maximum: 1_000_000 },
      charges: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
      condition: {
        type: 'string',
        enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
      },
      slot: nullable({
        type: 'string',
        enum: ['hand', 'body', 'bag'],
      }),
      version: { type: 'integer', minimum: 0, maximum: 1_000_000 },
    })),
    instance_draft: nullable(strictObject({
      template_id: text(160),
      name: text(160),
      category: { type: 'string', enum: ['tool', 'document', 'medicine', 'keepsake', 'resource'] },
      description: text(1_000),
      owner_id: text(160),
      holder_id: text(160),
      location_id: text(160),
      quantity: { type: 'integer', minimum: 1, maximum: 1_000_000 },
      charges: nullable({ type: 'integer', minimum: 0, maximum: 1_000_000 }),
      condition: {
        type: 'string',
        enum: ['pristine', 'usable', 'worn', 'damaged', 'spent'],
      },
      slot: nullable({
        type: 'string',
        enum: ['hand', 'body', 'bag'],
      }),
    })),
    narrative_requirements: stringList(16, 500),
    forbidden_narrative_claims: stringList(16, 500),
  }), 16),
  scene_sync: strictObject({
    current_location_id: text(160),
    player_carried_item_ids: stringList(128, 160),
    scene_item_ids: stringList(128, 160),
    remote_item_ids: stringList(128, 160),
    orphaned_item_ids: stringList(128, 160),
    consistency_errors: stringList(32, 1_000),
  }),
  story_sync: strictObject({
    canon_compatible: { type: 'boolean' },
    scene_compatible: { type: 'boolean' },
    plot_relevant_item_ids: stringList(64, 160),
    required_narrative_facts: stringList(32, 1_000),
    forbidden_narrative_claims: stringList(32, 1_000),
    continuity_risks: stringList(32, 1_000),
    unresolved_questions: stringList(32, 1_000),
  }),
  interaction_effects: strictObject({
    time_cost: { type: 'string', enum: ['none', 'brief', 'meaningful', 'extended'] },
    noise: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
    hands_required: { type: 'integer', minimum: 0, maximum: 2 },
    storage_required: { type: 'string', enum: ['none', 'hand', 'body', 'bag', 'external'] },
    traces: stringList(16, 500),
    witness_ids: stringList(16, 160),
    resource_changes: stringList(16, 500),
    condition_changes: stringList(16, 500),
  }),
  consistency_notes: stringList(24, 1_000),
})

const CONTRACTS: Partial<Record<AiModuleId, { name: string, schema: JsonSchema }>> = {
  'scene-plan': { name: 'fabula_scene_plan_0_2', schema: scenePlanSchema },
  'scene-plan-paid': { name: 'fabula_scene_plan_0_2', schema: scenePlanSchema },
  narration: { name: 'fabula_aion_narrative_0_2', schema: narrationSchema },
  'turn-qa': { name: 'fabula_canon_audit_0_2', schema: canonAuditSchema },
  journal: { name: 'fabula_journal_character_compiler_1_0', schema: journalSchema },
  difficulty: { name: 'fabula_difficulty_advisory_0_2', schema: difficultySchema },
  inventory: { name: 'fabula_inventory_advisory_1_1', schema: inventoryAdvisorySchema },
}

export function getStandaloneContract(moduleId: AiModuleId): { name: string, schema: JsonSchema } {
  const contract = CONTRACTS[moduleId]
  if (!contract)
    throw new ContractError('MODULE_CONTRACT_UNAVAILABLE', 'Для standalone-модуля не настроен строгий контракт.')
  return contract
}

export function parseStandaloneOutput(moduleId: AiModuleId, value: unknown): Record<string, JsonValue> {
  const contract = getStandaloneContract(moduleId)
  assertSchema(contract.schema, value, '$')
  return value as Record<string, JsonValue>
}

function assertSchema(schema: JsonSchema, value: unknown, path: string): void {
  if (Array.isArray(schema.anyOf)) {
    const accepted = schema.anyOf.some((candidate) => {
      try {
        assertSchema(candidate as JsonSchema, value, path)
        return true
      }
      catch {
        return false
      }
    })
    if (!accepted)
      invalid(path)
    return
  }
  if ('const' in schema && value !== schema.const)
    invalid(path)
  if (Array.isArray(schema.enum) && !schema.enum.includes(value))
    invalid(path)

  switch (schema.type) {
    case 'null':
      if (value !== null)
        invalid(path)
      return
    case 'boolean':
      if (typeof value !== 'boolean')
        invalid(path)
      return
    case 'string':
      if (typeof value !== 'string'
        || (typeof schema.maxLength === 'number' && value.length > schema.maxLength)
        || (typeof schema.minLength === 'number' && value.length < schema.minLength)) {
        invalid(path)
      }
      return
    case 'integer':
      if (!Number.isInteger(value)
        || (typeof schema.minimum === 'number' && Number(value) < schema.minimum)
        || (typeof schema.maximum === 'number' && Number(value) > schema.maximum)) {
        invalid(path)
      }
      return
    case 'array': {
      if (!Array.isArray(value)
        || (typeof schema.maxItems === 'number' && value.length > schema.maxItems)
        || (typeof schema.minItems === 'number' && value.length < schema.minItems)) {
        invalid(path)
      }
      const itemSchema = schema.items as JsonSchema
      value.forEach((item, index) => assertSchema(itemSchema, item, `${path}[${index}]`))
      return
    }
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value))
        invalid(path)
      const record = value as Record<string, unknown>
      const properties = schema.properties as Record<string, JsonSchema>
      const required = schema.required as string[]
      const missing = required.filter(key => !(key in record))
      if (missing.length)
        invalid(`${path}.${missing[0]}`)
      if (schema.additionalProperties === false) {
        const extra = Object.keys(record).find(key => !(key in properties))
        if (extra)
          invalid(`${path}.${extra}`)
      }
      Object.entries(properties).forEach(([key, child]) => {
        if (key in record)
          assertSchema(child, record[key], `${path}.${key}`)
      })
      return
    }
    default:
      invalid(path)
  }
}

function invalid(path: string): never {
  throw new ContractError(
    'MODEL_CONTRACT_ERROR',
    'Модель вернула ответ, не соответствующий строгому контракту модуля.',
    [path],
  )
}

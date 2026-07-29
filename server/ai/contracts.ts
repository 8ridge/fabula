export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export interface TurnCommand {
  schema_version: 'turn-command@1.0'
  session_id: string
  idempotency_key: string
  expected_session_version: number
  mode: 'action' | 'speech' | 'exploration'
  text: string
  story_id: 'fant' | 'scifi' | 'hist' | 'post'
  selected_target_ids: string[]
  selected_item_ids: string[]
  selected_suggestion_id: string | null
}

export interface TurnOutput {
  schema_version: 'turn-output@0.2'
  turn_id: string
  expected_session_version: number
  status: 'resolved' | 'clarification_required' | 'rejected'
  intent: {
    type: string
    targets: string[]
    referenced_entities: string[]
    atomic_steps: Array<Record<string, JsonValue>>
  }
  context_check: Record<string, JsonValue>
  difficulty: {
    base: number
    environment: number
    time_pressure: number
    injury: number
    opposition: number
    skill: number
    tools: number
    preparation: number
    help: number
    final_band: number
    uncertainty: 'low' | 'medium' | 'high'
  }
  resolution: {
    summary: string
    outcome: 'success' | 'partial_success' | 'failure' | 'impossible'
    reason_codes: string[]
    costs_and_consequences: string[]
  }
  operations: []
  narrative_brief: {
    must_include: string[]
    must_not_invent: string[]
    tone: string
    point_of_view: 'second_person'
    sensory_scope: string[]
  }
  narrative_text: string
  suggested_actions: Array<{
    label: string
    mode: 'action' | 'speech' | 'exploration'
    intent_hint: string
  }>
  media_candidate: null | {
    event_id: string
    kind: 'image' | 'video'
    salience: number
    reason_codes: string[]
    exclusive_event_hint: boolean
  }
  safety_flags: string[]
  audit: {
    canon_fact_ids_used: string[]
    memory_event_ids_used: string[]
    assumptions: string[]
    unresolved_ambiguities: string[]
    difficulty_regulation_note: string | null
  }
}

export class ContractError extends Error {
  readonly code: string
  readonly fieldErrors: string[]

  constructor(code: string, message: string, fieldErrors: string[] = []) {
    super(message)
    this.name = 'ContractError'
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/
const STORY_IDS = new Set(['fant', 'scifi', 'hist', 'post'])
const MODES = new Set(['action', 'speech', 'exploration'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  const extras = Object.keys(value).filter(key => !allowedSet.has(key))
  if (extras.length)
    throw new ContractError('INVALID_FIELDS', 'Запрос содержит запрещенные поля.', extras.map(key => `${path}.${key}`))
}

function requiredKeys(value: Record<string, unknown>, required: readonly string[], path: string): void {
  const missing = required.filter(key => !(key in value))
  if (missing.length)
    throw new ContractError('MISSING_FIELDS', 'В запросе не хватает обязательных полей.', missing.map(key => `${path}.${key}`))
}

function stringArray(value: unknown, path: string, maxItems = 32): string[] {
  if (!Array.isArray(value) || value.length > maxItems || value.some(item => typeof item !== 'string' || item.length > 160))
    throw new ContractError('INVALID_FIELD', 'Некорректный список строк.', [path])
  return value
}

function boundedString(value: unknown, path: string, min: number, max: number): string {
  if (typeof value !== 'string' || value.length < min || value.length > max)
    throw new ContractError('INVALID_FIELD', 'Некорректная длина строки.', [path])
  return value
}

function boundedInteger(value: unknown, path: string, min: number, max: number): number {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max)
    throw new ContractError('INVALID_FIELD', 'Некорректное целое число.', [path])
  return Number(value)
}

export function parseTurnCommand(value: unknown): TurnCommand {
  if (!isRecord(value))
    throw new ContractError('INVALID_BODY', 'Ожидался JSON-объект.')
  const keys = [
    'schema_version',
    'session_id',
    'idempotency_key',
    'expected_session_version',
    'mode',
    'text',
    'story_id',
    'selected_target_ids',
    'selected_item_ids',
    'selected_suggestion_id',
  ] as const
  exactKeys(value, keys, '$')
  requiredKeys(value, keys, '$')

  if (value.schema_version !== 'turn-command@1.0')
    throw new ContractError('UNSUPPORTED_SCHEMA', 'Неподдерживаемая версия команды.', ['$.schema_version'])
  if (typeof value.session_id !== 'string' || !SAFE_ID.test(value.session_id))
    throw new ContractError('INVALID_FIELD', 'Некорректный session_id.', ['$.session_id'])
  if (typeof value.idempotency_key !== 'string' || !SAFE_ID.test(value.idempotency_key))
    throw new ContractError('INVALID_FIELD', 'Некорректный idempotency_key.', ['$.idempotency_key'])
  if (!MODES.has(String(value.mode)))
    throw new ContractError('INVALID_FIELD', 'Некорректный режим хода.', ['$.mode'])
  if (!STORY_IDS.has(String(value.story_id)))
    throw new ContractError('INVALID_FIELD', 'Неизвестный StoryPack.', ['$.story_id'])
  const text = boundedString(value.text, '$.text', 1, 1200)
  boundedInteger(value.expected_session_version, '$.expected_session_version', 0, 1_000_000)
  const selectedTargetIds = stringArray(value.selected_target_ids, '$.selected_target_ids', 16)
  const selectedItemIds = stringArray(value.selected_item_ids, '$.selected_item_ids', 16)
  if (value.selected_suggestion_id !== null && (typeof value.selected_suggestion_id !== 'string' || value.selected_suggestion_id.length > 160))
    throw new ContractError('INVALID_FIELD', 'Некорректный suggestion_id.', ['$.selected_suggestion_id'])

  return {
    schema_version: 'turn-command@1.0',
    session_id: value.session_id,
    idempotency_key: value.idempotency_key,
    expected_session_version: Number(value.expected_session_version),
    mode: value.mode as TurnCommand['mode'],
    text: text.trim(),
    story_id: value.story_id as TurnCommand['story_id'],
    selected_target_ids: selectedTargetIds,
    selected_item_ids: selectedItemIds,
    selected_suggestion_id: value.selected_suggestion_id as string | null,
  }
}

export interface ModuleRequest {
  schema_version: 'ai-module-request@1.0'
  request_id: string
  payload: Record<string, JsonValue>
  template_variables: Record<string, JsonValue>
}

function assertJsonValue(value: unknown, path: string, depth = 0): asserts value is JsonValue {
  if (depth > 8)
    throw new ContractError('INVALID_FIELD', 'Слишком глубокая JSON-структура.', [path])
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
    if (typeof value === 'string' && value.length > 8000)
      throw new ContractError('INVALID_FIELD', 'Строка слишком длинная.', [path])
    return
  }
  if (Array.isArray(value)) {
    if (value.length > 100)
      throw new ContractError('INVALID_FIELD', 'Слишком длинный массив.', [path])
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`, depth + 1))
    return
  }
  if (isRecord(value)) {
    if (Object.keys(value).length > 100)
      throw new ContractError('INVALID_FIELD', 'Слишком много полей.', [path])
    Object.entries(value).forEach(([key, item]) => {
      if (!/^[A-Za-z0-9_.-]{1,80}$/.test(key))
        throw new ContractError('INVALID_FIELD', 'Некорректное имя поля.', [`${path}.${key}`])
      assertJsonValue(item, `${path}.${key}`, depth + 1)
    })
    return
  }
  throw new ContractError('INVALID_FIELD', 'Значение не является JSON.', [path])
}

export function parseModuleRequest(value: unknown): ModuleRequest {
  if (!isRecord(value))
    throw new ContractError('INVALID_BODY', 'Ожидался JSON-объект.')
  const keys = ['schema_version', 'request_id', 'payload', 'template_variables'] as const
  exactKeys(value, keys, '$')
  requiredKeys(value, ['schema_version', 'request_id', 'payload'], '$')
  if (value.schema_version !== 'ai-module-request@1.0')
    throw new ContractError('UNSUPPORTED_SCHEMA', 'Неподдерживаемая версия запроса.', ['$.schema_version'])
  if (typeof value.request_id !== 'string' || !SAFE_ID.test(value.request_id))
    throw new ContractError('INVALID_FIELD', 'Некорректный request_id.', ['$.request_id'])
  if (!isRecord(value.payload))
    throw new ContractError('INVALID_FIELD', 'payload должен быть объектом.', ['$.payload'])
  const templateVariables = value.template_variables === undefined ? {} : value.template_variables
  if (!isRecord(templateVariables))
    throw new ContractError('INVALID_FIELD', 'template_variables должен быть объектом.', ['$.template_variables'])
  assertJsonValue(value.payload, '$.payload')
  assertJsonValue(templateVariables, '$.template_variables')
  const serializedLength = JSON.stringify(value).length
  if (serializedLength > 64_000)
    throw new ContractError('BODY_TOO_LARGE', 'Запрос превышает допустимый размер.')
  return {
    schema_version: 'ai-module-request@1.0',
    request_id: value.request_id,
    payload: value.payload as Record<string, JsonValue>,
    template_variables: templateVariables as Record<string, JsonValue>,
  }
}

const atomicStepKeys = [
  'step',
  'phase',
  'explicit_or_inferred',
  'actor_id',
  'target_ids',
  'item_ids',
  'source_location_id',
  'destination_location_id',
  'hands_required',
  'attention_required',
  'duration_seconds',
  'noise_band',
  'visibility',
  'precondition_codes',
  'interruption_points',
  'completion_evidence',
] as const

function validateAtomicStep(value: unknown, path: string): void {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула некорректный atomic_step.', [path])
  exactKeys(value, atomicStepKeys, path)
  requiredKeys(value, atomicStepKeys, path)
  boundedString(value.step, `${path}.step`, 1, 120)
  if (!['prepare', 'attempt', 'complete', 'interrupted'].includes(String(value.phase)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная фаза atomic_step.', [`${path}.phase`])
  if (!['explicit', 'inferred'].includes(String(value.explicit_or_inferred)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный источник atomic_step.', [`${path}.explicit_or_inferred`])
  boundedString(value.actor_id, `${path}.actor_id`, 1, 160)
  stringArray(value.target_ids, `${path}.target_ids`, 16)
  stringArray(value.item_ids, `${path}.item_ids`, 16)
  if (value.source_location_id !== null)
    boundedString(value.source_location_id, `${path}.source_location_id`, 1, 160)
  if (value.destination_location_id !== null)
    boundedString(value.destination_location_id, `${path}.destination_location_id`, 1, 160)
  boundedInteger(value.hands_required, `${path}.hands_required`, 0, 2)
  boundedString(value.attention_required, `${path}.attention_required`, 1, 40)
  boundedInteger(value.duration_seconds, `${path}.duration_seconds`, 0, 86_400)
  boundedInteger(value.noise_band, `${path}.noise_band`, 0, 5)
  boundedString(value.visibility, `${path}.visibility`, 1, 80)
  stringArray(value.precondition_codes, `${path}.precondition_codes`, 32)
  stringArray(value.interruption_points, `${path}.interruption_points`, 32)
  stringArray(value.completion_evidence, `${path}.completion_evidence`, 32)
}

function validateTurnOutputShape(value: Record<string, unknown>, expectedTurnId: string, expectedVersion: number): void {
  const topKeys = [
    'schema_version',
    'turn_id',
    'expected_session_version',
    'status',
    'intent',
    'context_check',
    'difficulty',
    'resolution',
    'operations',
    'narrative_brief',
    'narrative_text',
    'suggested_actions',
    'media_candidate',
    'safety_flags',
    'audit',
  ] as const
  exactKeys(value, topKeys, '$')
  requiredKeys(value, topKeys, '$')
  if (value.schema_version !== 'turn-output@0.2')
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула неверную версию контракта.', ['$.schema_version'])
  if (value.turn_id !== expectedTurnId)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель изменила turn_id.', ['$.turn_id'])
  if (value.expected_session_version !== expectedVersion)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель изменила версию сессии.', ['$.expected_session_version'])
  if (!['resolved', 'clarification_required', 'rejected'].includes(String(value.status)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный status.', ['$.status'])

  if (!isRecord(value.intent))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный intent.', ['$.intent'])
  exactKeys(value.intent, ['type', 'targets', 'referenced_entities', 'atomic_steps'], '$.intent')
  requiredKeys(value.intent, ['type', 'targets', 'referenced_entities', 'atomic_steps'], '$.intent')
  boundedString(value.intent.type, '$.intent.type', 1, 120)
  stringArray(value.intent.targets, '$.intent.targets')
  stringArray(value.intent.referenced_entities, '$.intent.referenced_entities')
  if (!Array.isArray(value.intent.atomic_steps) || value.intent.atomic_steps.length > 12)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректные atomic_steps.', ['$.intent.atomic_steps'])
  value.intent.atomic_steps.forEach((step, index) => validateAtomicStep(step, `$.intent.atomic_steps[${index}]`))

  if (!isRecord(value.context_check))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный context_check.', ['$.context_check'])
  const contextCheck = value.context_check
  const contextKeys = [
    'actor_can_attempt',
    'actor_conscious',
    'target_reachable',
    'target_perceivable',
    'item_accessible',
    'ownership_valid',
    'knowledge_sources_valid',
    'channel_valid',
    'scope_valid',
    'consent_valid',
    'barriers_allow_attempt',
    'time_sufficient',
    'blocking_reasons',
  ]
  exactKeys(contextCheck, contextKeys, '$.context_check')
  requiredKeys(contextCheck, contextKeys, '$.context_check')
  for (const key of contextKeys.slice(0, -1)) {
    if (typeof contextCheck[key] !== 'boolean')
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный context_check.', [`$.context_check.${key}`])
  }
  stringArray(contextCheck.blocking_reasons, '$.context_check.blocking_reasons')
  const contextAllowsAttempt = contextKeys
    .slice(0, -1)
    .every(key => contextCheck[key] === true)
  const hasBlockingReasons = (contextCheck.blocking_reasons as unknown[]).length > 0
  if (contextAllowsAttempt === hasBlockingReasons) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      contextAllowsAttempt
        ? 'Разрешенный ход не может содержать blocking_reasons.'
        : 'Заблокированный ход обязан содержать blocking_reasons.',
      ['$.context_check.blocking_reasons'],
    )
  }

  if (!isRecord(value.difficulty))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная difficulty.', ['$.difficulty'])
  const difficultyKeys = ['base', 'environment', 'time_pressure', 'injury', 'opposition', 'skill', 'tools', 'preparation', 'help', 'final_band', 'uncertainty']
  exactKeys(value.difficulty, difficultyKeys, '$.difficulty')
  requiredKeys(value.difficulty, difficultyKeys, '$.difficulty')
  for (const key of difficultyKeys.slice(0, -2))
    boundedInteger(value.difficulty[key], `$.difficulty.${key}`, -5, 5)
  boundedInteger(value.difficulty.final_band, '$.difficulty.final_band', 0, 5)
  if (!['low', 'medium', 'high'].includes(String(value.difficulty.uncertainty)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная uncertainty.', ['$.difficulty.uncertainty'])
  const calculatedBand = Math.max(0, Math.min(5,
    Number(value.difficulty.base)
    + Number(value.difficulty.environment)
    + Number(value.difficulty.time_pressure)
    + Number(value.difficulty.injury)
    + Number(value.difficulty.opposition)
    - Number(value.difficulty.skill)
    - Number(value.difficulty.tools)
    - Number(value.difficulty.preparation)
    - Number(value.difficulty.help),
  ))
  if (value.difficulty.final_band !== calculatedBand)
    throw new ContractError('MODEL_INVARIANT_ERROR', 'Модель неверно рассчитала сложность.', ['$.difficulty.final_band'])

  if (!isRecord(value.resolution))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная resolution.', ['$.resolution'])
  exactKeys(value.resolution, ['summary', 'outcome', 'reason_codes', 'costs_and_consequences'], '$.resolution')
  requiredKeys(value.resolution, ['summary', 'outcome', 'reason_codes', 'costs_and_consequences'], '$.resolution')
  boundedString(value.resolution.summary, '$.resolution.summary', 1, 1000)
  if (!['success', 'partial_success', 'failure', 'impossible'].includes(String(value.resolution.outcome)))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный outcome.', ['$.resolution.outcome'])
  stringArray(value.resolution.reason_codes, '$.resolution.reason_codes')
  stringArray(value.resolution.costs_and_consequences, '$.resolution.costs_and_consequences')
  if (value.status === 'resolved' && (!contextAllowsAttempt || value.resolution.outcome === 'impossible')) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Resolved-ход требует успешной проверки контекста и возможного outcome.',
      ['$.status', '$.context_check', '$.resolution.outcome'],
    )
  }
  if (value.status === 'rejected' && (contextAllowsAttempt || value.resolution.outcome !== 'impossible')) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Rejected-ход требует блокирующей причины и outcome impossible.',
      ['$.status', '$.context_check', '$.resolution.outcome'],
    )
  }
  if (value.status === 'clarification_required' && ['success', 'partial_success'].includes(String(value.resolution.outcome))) {
    throw new ContractError(
      'MODEL_INVARIANT_ERROR',
      'Уточнение не может одновременно быть успешным исходом.',
      ['$.status', '$.resolution.outcome'],
    )
  }

  if (!Array.isArray(value.operations) || value.operations.length !== 0)
    throw new ContractError('MODEL_AUTHORITY_ERROR', 'Preview-сессия запрещает операции канона.', ['$.operations'])

  if (!isRecord(value.narrative_brief))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный narrative_brief.', ['$.narrative_brief'])
  exactKeys(value.narrative_brief, ['must_include', 'must_not_invent', 'tone', 'point_of_view', 'sensory_scope'], '$.narrative_brief')
  requiredKeys(value.narrative_brief, ['must_include', 'must_not_invent', 'tone', 'point_of_view', 'sensory_scope'], '$.narrative_brief')
  stringArray(value.narrative_brief.must_include, '$.narrative_brief.must_include')
  stringArray(value.narrative_brief.must_not_invent, '$.narrative_brief.must_not_invent')
  boundedString(value.narrative_brief.tone, '$.narrative_brief.tone', 1, 80)
  if (value.narrative_brief.point_of_view !== 'second_person')
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректная точка зрения.', ['$.narrative_brief.point_of_view'])
  stringArray(value.narrative_brief.sensory_scope, '$.narrative_brief.sensory_scope')
  boundedString(value.narrative_text, '$.narrative_text', value.status === 'resolved' ? 1 : 0, 6000)

  if (!Array.isArray(value.suggested_actions) || value.suggested_actions.length > 4)
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректные suggested_actions.', ['$.suggested_actions'])
  value.suggested_actions.forEach((action, index) => {
    const path = `$.suggested_actions[${index}]`
    if (!isRecord(action))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректное suggested_action.', [path])
    exactKeys(action, ['label', 'mode', 'intent_hint'], path)
    requiredKeys(action, ['label', 'mode', 'intent_hint'], path)
    boundedString(action.label, `${path}.label`, 1, 160)
    if (!MODES.has(String(action.mode)))
      throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный mode.', [`${path}.mode`])
    boundedString(action.intent_hint, `${path}.intent_hint`, 1, 160)
  })

  if (value.media_candidate !== null)
    throw new ContractError('MODEL_AUTHORITY_ERROR', 'Preview-сессия не разрешает media_candidate без event_id.', ['$.media_candidate'])
  stringArray(value.safety_flags, '$.safety_flags')

  if (!isRecord(value.audit))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Некорректный audit.', ['$.audit'])
  const auditKeys = ['canon_fact_ids_used', 'memory_event_ids_used', 'assumptions', 'unresolved_ambiguities', 'difficulty_regulation_note']
  exactKeys(value.audit, auditKeys, '$.audit')
  requiredKeys(value.audit, auditKeys, '$.audit')
  stringArray(value.audit.canon_fact_ids_used, '$.audit.canon_fact_ids_used')
  stringArray(value.audit.memory_event_ids_used, '$.audit.memory_event_ids_used')
  stringArray(value.audit.assumptions, '$.audit.assumptions')
  stringArray(value.audit.unresolved_ambiguities, '$.audit.unresolved_ambiguities')
  if (value.audit.difficulty_regulation_note !== null)
    boundedString(value.audit.difficulty_regulation_note, '$.audit.difficulty_regulation_note', 1, 500)
}

export function parseTurnOutput(value: unknown, expectedTurnId: string, expectedVersion: number): TurnOutput {
  if (!isRecord(value))
    throw new ContractError('MODEL_CONTRACT_ERROR', 'Модель вернула не JSON-объект.')
  validateTurnOutputShape(value, expectedTurnId, expectedVersion)
  return value as unknown as TurnOutput
}

const stringSchema = { type: 'string', maxLength: 1000 } as const
const stringArraySchema = { type: 'array', items: stringSchema, maxItems: 32 } as const
const strictObject = (properties: Record<string, unknown>, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})

export const TURN_OUTPUT_JSON_SCHEMA = strictObject({
  schema_version: { type: 'string', const: 'turn-output@0.2' },
  turn_id: { type: 'string' },
  expected_session_version: { type: 'integer', minimum: 0 },
  status: { type: 'string', enum: ['resolved', 'clarification_required', 'rejected'] },
  intent: strictObject({
    type: stringSchema,
    targets: stringArraySchema,
    referenced_entities: stringArraySchema,
    atomic_steps: {
      type: 'array',
      maxItems: 12,
      items: strictObject({
        step: stringSchema,
        phase: { type: 'string', enum: ['prepare', 'attempt', 'complete', 'interrupted'] },
        explicit_or_inferred: { type: 'string', enum: ['explicit', 'inferred'] },
        actor_id: stringSchema,
        target_ids: stringArraySchema,
        item_ids: stringArraySchema,
        source_location_id: { anyOf: [stringSchema, { type: 'null' }] },
        destination_location_id: { anyOf: [stringSchema, { type: 'null' }] },
        hands_required: { type: 'integer', minimum: 0, maximum: 2 },
        attention_required: stringSchema,
        duration_seconds: { type: 'integer', minimum: 0, maximum: 86400 },
        noise_band: { type: 'integer', minimum: 0, maximum: 5 },
        visibility: stringSchema,
        precondition_codes: stringArraySchema,
        interruption_points: stringArraySchema,
        completion_evidence: stringArraySchema,
      }),
    },
  }),
  context_check: strictObject({
    actor_can_attempt: { type: 'boolean' },
    actor_conscious: { type: 'boolean' },
    target_reachable: { type: 'boolean' },
    target_perceivable: { type: 'boolean' },
    item_accessible: { type: 'boolean' },
    ownership_valid: { type: 'boolean' },
    knowledge_sources_valid: { type: 'boolean' },
    channel_valid: { type: 'boolean' },
    scope_valid: { type: 'boolean' },
    consent_valid: { type: 'boolean' },
    barriers_allow_attempt: { type: 'boolean' },
    time_sufficient: { type: 'boolean' },
    blocking_reasons: stringArraySchema,
  }),
  difficulty: strictObject({
    base: { type: 'integer', minimum: -5, maximum: 5 },
    environment: { type: 'integer', minimum: -5, maximum: 5 },
    time_pressure: { type: 'integer', minimum: -5, maximum: 5 },
    injury: { type: 'integer', minimum: -5, maximum: 5 },
    opposition: { type: 'integer', minimum: -5, maximum: 5 },
    skill: { type: 'integer', minimum: -5, maximum: 5 },
    tools: { type: 'integer', minimum: -5, maximum: 5 },
    preparation: { type: 'integer', minimum: -5, maximum: 5 },
    help: { type: 'integer', minimum: -5, maximum: 5 },
    final_band: { type: 'integer', minimum: 0, maximum: 5 },
    uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
  }),
  resolution: strictObject({
    summary: stringSchema,
    outcome: { type: 'string', enum: ['success', 'partial_success', 'failure', 'impossible'] },
    reason_codes: stringArraySchema,
    costs_and_consequences: stringArraySchema,
  }),
  operations: { type: 'array', maxItems: 0 },
  narrative_brief: strictObject({
    must_include: stringArraySchema,
    must_not_invent: stringArraySchema,
    tone: stringSchema,
    point_of_view: { type: 'string', const: 'second_person' },
    sensory_scope: stringArraySchema,
  }),
  narrative_text: { type: 'string', maxLength: 6000 },
  suggested_actions: {
    type: 'array',
    maxItems: 4,
    items: strictObject({
      label: stringSchema,
      mode: { type: 'string', enum: ['action', 'speech', 'exploration'] },
      intent_hint: stringSchema,
    }),
  },
  media_candidate: { type: 'null' },
  safety_flags: stringArraySchema,
  audit: strictObject({
    canon_fact_ids_used: stringArraySchema,
    memory_event_ids_used: stringArraySchema,
    assumptions: stringArraySchema,
    unresolved_ambiguities: stringArraySchema,
    difficulty_regulation_note: { anyOf: [stringSchema, { type: 'null' }] },
  }),
})

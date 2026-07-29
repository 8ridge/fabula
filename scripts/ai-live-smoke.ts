type JsonRecord = Record<string, unknown>

const baseUrl = process.argv[2] || 'http://127.0.0.1:3112'
if (new URL(baseUrl).hostname !== '127.0.0.1' && new URL(baseUrl).hostname !== 'localhost')
  throw new Error('LIVE_SMOKE_LOCALHOST_ONLY')
const requestedCases = new Set((process.argv[3] || 'all').split(','))

const cases = [
  {
    expectedModel: 'deepseek/deepseek-v4-flash',
    moduleId: 'journal',
    payload: {
      pack: 'synthetic-pack',
      committed_events: [{
        event_ref: 'event:synthetic-0001',
        summary: 'Игрок открыл пустую дверь после подтвержденной проверки.',
      }],
      player_visible_facts: ['fact:synthetic-door-open'],
      npc_beliefs_and_rumors: [],
      existing_open_threads: [],
      reserved_journal_ids: ['journal:synthetic-0001'],
    },
  },
  {
    expectedModel: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    moduleId: 'scene-plan',
    payload: {
      story_pack_id: 'synthetic-pack',
      scene_id: 'scene:synthetic-0001',
      entity_roles: ['player', 'present_npc'],
      confirmed_fact_refs: ['fact:synthetic-door-open'],
      confirmed_event_refs: ['event:synthetic-0001'],
      resource_bands: ['stable'],
      active_threads: ['thread:synthetic'],
      unresolved_callbacks: [],
      pack_constraints: ['no_new_canon', 'no_pii'],
      recent_outcome_bands: ['success'],
      available_paths: ['action', 'speech', 'exploration'],
      allowed_difficulty_knobs: ['clarity', 'time_pressure'],
    },
  },
  {
    expectedModel: 'nvidia/nemotron-3-ultra-550b-a55b',
    moduleId: 'scene-plan-paid',
    payload: {
      story_pack_id: 'synthetic-pack',
      scene_id: 'scene:synthetic-0002',
      entity_roles: ['player', 'present_npc'],
      confirmed_fact_refs: ['fact:synthetic-door-open'],
      confirmed_event_refs: ['event:synthetic-0001'],
      resource_bands: ['stable'],
      active_threads: ['thread:synthetic'],
      unresolved_callbacks: [],
      pack_constraints: ['no_new_canon', 'no_pii'],
      recent_outcome_bands: ['success'],
      available_paths: ['action', 'speech', 'exploration'],
      allowed_difficulty_knobs: ['clarity', 'time_pressure'],
    },
  },
  {
    expectedModel: 'aion-labs/aion-3.0-mini',
    moduleId: 'narration',
    payload: {
      pack_style: ['Второе лицо', 'Настоящее время', 'Без новых фактов'],
      approved_narrative_brief: {
        result: 'Игрок открыл пустую дверь.',
        costs: [],
        must_not_add: ['Персонажи', 'Предметы', 'Новые угрозы'],
      },
      confirmed_fact_refs: ['fact:synthetic-door-open'],
      previous_scene_ending: 'Игрок стоит перед закрытой дверью.',
      character_voice_cards: [],
    },
  },
  {
    expectedModel: 'mistralai/mistral-small-2603',
    moduleId: 'turn-qa',
    payload: {
      mode: 'CANON_AUDIT',
      pack_overlay: 'Синтетический мир без магии.',
      canon_and_state: {
        facts: ['fact:synthetic-door-open'],
        present_entities: ['player'],
      },
      target_turn_or_scene: {
        claim: 'Игрок открыл пустую дверь.',
        operations: [],
      },
      reserved_ids: [],
      allowed_typed_ops: [],
    },
  },
] as const

for (const testCase of cases) {
  if (!requestedCases.has('all') && !requestedCases.has(testCase.moduleId))
    continue
  const requestBody = {
    schema_version: 'ai-module-request@1.0',
    request_id: `request:${crypto.randomUUID()}`,
    payload: testCase.payload,
    template_variables: {},
  }
  await runModule(testCase, requestBody)
  if (testCase.moduleId === 'journal')
    await runModule(testCase, requestBody, 'journal-replay')
}

if (requestedCases.has('all') || requestedCases.has('authoritative-turn'))
  await runTurn()

async function runModule(
  testCase: typeof cases[number],
  requestBody: JsonRecord,
  summaryModule = testCase.moduleId,
): Promise<void> {
  const startedAt = performance.now()
  const response = await fetch(`${baseUrl}/api/ai/modules/${testCase.moduleId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    cache: 'no-store',
    signal: AbortSignal.timeout(360_000),
  })
  const body = await response.json().catch(() => null) as JsonRecord | null
  const replayed = body?.replayed === true
  const runs = extractModelRuns(body)
  const usage = replayed ? zeroUsage() : aggregateUsage(runs, body?.usage)
  const accepted = runs.find(run => run.status === 'accepted')
  printSummary({
    model: typeof body?.model === 'string'
      ? body.model
      : typeof accepted?.model === 'string'
        ? accepted.model
        : testCase.expectedModel,
    module: summaryModule,
    status: response.ok ? String(body?.status || 'ready') : `HTTP_${response.status}`,
    latency_ms: Math.round(performance.now() - startedAt),
    prompt_tokens: numberOrNull(usage.prompt_tokens),
    completion_tokens: numberOrNull(usage.completion_tokens),
    total_tokens: numberOrNull(usage.total_tokens),
    cost_usd: numberOrNull(usage.cost),
    fallback: body?.fallback_used === true || accepted?.role === 'fallback',
    replayed,
    schema_valid: body?.validation === 'strict_server_contract',
    error_code: response.ok ? null : stringOrNull(body?.code),
    attempts: summarizeRuns(runs),
  })
}

async function runTurn(): Promise<void> {
  const startedAt = performance.now()
  const requestId = crypto.randomUUID()
  const response = await fetch(`${baseUrl}/api/ai/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema_version: 'turn-command@1.0',
      session_id: `session:${requestId}`,
      idempotency_key: `turn:${requestId}`,
      expected_session_version: 0,
      mode: 'exploration',
      text: 'Я проверяю, заперта ли пустая дверь, не утверждая, что уже открыл ее.',
      story_id: 'fant',
      selected_target_ids: [],
      selected_item_ids: [],
      selected_suggestion_id: null,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(420_000),
  })
  const body = await response.json().catch(() => null) as JsonRecord | null
  const runs = extractModelRuns(body)
  const accepted = runs.find(run => run.status === 'accepted' && (run.role === 'primary' || run.role === 'fallback'))
  const usage = aggregateUsage(runs, accepted?.usage)
  printSummary({
    model: typeof body?.model === 'string'
      ? body.model
      : typeof accepted?.model === 'string'
        ? accepted.model
        : 'turn-engine',
    module: 'authoritative-turn',
    status: response.ok ? 'ready' : `HTTP_${response.status}`,
    latency_ms: Math.round(performance.now() - startedAt),
    prompt_tokens: numberOrNull(usage.prompt_tokens),
    completion_tokens: numberOrNull(usage.completion_tokens),
    total_tokens: numberOrNull(usage.total_tokens),
    cost_usd: numberOrNull(usage.cost),
    fallback: body?.fallback_used === true || accepted?.role === 'fallback',
    schema_valid: response.ok
      && body?.schema_version === 'turn-response@1.0'
      && isRecord(body.turn)
      && body.turn.schema_version === 'turn-output@0.2',
    error_code: response.ok ? null : stringOrNull(body?.code),
    attempts: summarizeRuns(runs),
  })
}

function printSummary(summary: JsonRecord): void {
  process.stdout.write(`${JSON.stringify(summary)}\n`)
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function extractModelRuns(body: JsonRecord | null): JsonRecord[] {
  return Array.isArray(body?.model_runs) ? body.model_runs.filter(isRecord) : []
}

function aggregateUsage(runs: JsonRecord[], fallbackUsage: unknown): JsonRecord {
  const usages = runs
    .map(run => run.usage)
    .filter(isRecord)
  if (usages.length === 0 && isRecord(fallbackUsage))
    usages.push(fallbackUsage)
  return {
    prompt_tokens: sumNumbers(usages, 'prompt_tokens'),
    completion_tokens: sumNumbers(usages, 'completion_tokens'),
    total_tokens: sumNumbers(usages, 'total_tokens'),
    cost: sumNumbers(usages, 'cost'),
  }
}

function zeroUsage(): JsonRecord {
  return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 }
}

function sumNumbers(values: JsonRecord[], key: string): number | null {
  const numbers = values
    .map(value => value[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  return numbers.length > 0 ? Number(numbers.reduce((sum, value) => sum + value, 0).toFixed(12)) : null
}

function summarizeRuns(runs: JsonRecord[]): JsonRecord[] {
  return runs.map(run => ({
    model: stringOrNull(run.model),
    role: stringOrNull(run.role),
    status: stringOrNull(run.status),
    error_code: stringOrNull(run.error_code),
    validation_errors: Array.isArray(run.validation_errors)
      ? run.validation_errors.filter((value): value is string => typeof value === 'string')
      : [],
    cost_usd: isRecord(run.usage) ? numberOrNull(run.usage.cost) : null,
  }))
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

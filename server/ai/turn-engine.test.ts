import { describe, expect, test } from 'bun:test'
import type { FabulaAiConfig } from './config'
import type { TurnCommand, TurnOutput } from './contracts'
import { AiExecutionError, FabulaApiError } from './http'
import { OpenRouterError } from './openrouter'
import type { ChatJsonRequest, OpenRouterClient } from './openrouter'
import type { EngineSessionSnapshot } from '../game/session-repository'
import type { RuntimeStoryPackSource } from '../game/storypack-source'
import { TURN_MODEL_TIMEOUTS, TurnEngine } from './turn-engine'

const config: FabulaAiConfig = {
  apiKey: 'test-key-never-log',
  baseUrl: 'https://openrouter.ai/api/v1',
  siteUrl: '',
}

const command: TurnCommand = {
  schema_version: 'turn-command@1.0',
  session_id: 'session:telemetry',
  idempotency_key: 'turn:telemetry',
  expected_session_version: 0,
  mode: 'exploration',
  text: 'Я проверяю дверь.',
  selected_target_ids: [],
  selected_item_ids: [],
  selected_journal_entry_ids: [],
  selected_suggestion_id: null,
}

const snapshot: EngineSessionSnapshot = {
  sessionId: command.session_id,
  storyPackId: 'eighth-seal',
  storyPackVersion: '0.2',
  version: 0,
  persona: {
    name: 'Лея',
    role_id: 'eighth-seal:engineer',
    role_label: 'Инженерное мышление',
    competence: 'Разбирает задачу на этапы',
    limitation: 'Нужны материалы и время',
    motivation: 'Понять восьмой круг',
    embodiment_note: '',
    narration_density: 'balanced',
  },
  scene: {
    id: 'scene:eighth-seal:summoning-hall',
    title: 'Лишний круг',
    location_id: 'location:summoning-hall',
    location_name: 'Зал Призыва',
    story_time: 'Первый час',
    objective: 'Понять природу восьмого круга',
    present_character_ids: [],
  },
  inventory: [],
  journal: [],
  characters: [],
  locations: [{
    id: 'location:summoning-hall',
    name: 'Зал Призыва',
    description: 'Зал восьми кругов.',
    status: 'Текущая локация',
  }],
  history: [{
    turnId: 'turn:scene-opened',
    sceneId: 'scene:eighth-seal:summoning-hall',
    mode: 'exploration',
    playerText: 'Я осматриваюсь.',
    outcome: 'success',
    narrative: 'Зал остается тихим.',
    costsAndConsequences: [],
    unresolvedAmbiguities: [],
  }],
  confirmedEvents: [],
  confirmedFacts: [],
  knowledge: [],
  reservedIds: {
    events: ['event:reserved:0001'],
    facts: ['fact:reserved:0001'],
    itemInstances: [],
    scenes: ['scene:reserved:0001'],
  },
  allowedOperationTypes: ['event.create', 'fact.create'],
}

const storyPackSource: RuntimeStoryPackSource = {
  storyPackId: snapshot.storyPackId,
  sourceFile: '04_storypack_eighth_seal.md',
  sourceHash: `sha256:${'a'.repeat(64)}`,
  technicalPackId: 'fantasy-eighth-seal@0.2',
  promptOverlayVersion: 'fantasy-eighth-seal@0.2#aaaaaaaaaaaa',
  promptOverlay: 'PACK_ID: fantasy-eighth-seal@0.2',
  hardCanon: ['Восьмой круг не дает игроку скрытой божественности.'],
  canonicalCore: '# StoryPack 04\n\n## Сюжет по восьми актам',
}

function modelSuggestedActions(): TurnOutput['suggested_actions'] {
  return [
    {
      label: 'Проверить след на двери',
      mode: 'exploration',
      intent_hint: 'inspect_door_trace',
    },
    {
      label: 'Отойти от двери',
      mode: 'action',
      intent_hint: 'step_back_from_door',
    },
    {
      label: 'Тихо спросить, кто там',
      mode: 'speech',
      intent_hint: 'ask_who_is_there',
    },
  ]
}

function inventoryAdvisoryFor(request: ChatJsonRequest) {
  const playerInput = request.payload.player_input as Record<string, unknown>
  const selectedItemIds = playerInput.selected_item_ids as string[]
  const serverInventory = request.payload.server_inventory as Array<Record<string, unknown>>
  const selectedItems = selectedItemIds.map((itemId) => {
    const item = serverInventory.find(candidate => candidate.item_id === itemId)!
    return {
      item_id: item.item_id,
      exists: true,
      accessible: item.holder_id === 'player'
        && item.location_id === (request.payload.current_scene as Record<string, unknown>).location_id
        && item.condition !== 'spent'
        && Number(item.quantity) > 0
        && item.charges !== 0,
      owner_id: item.owner_id,
      holder_id: item.holder_id,
      location_id: item.location_id,
      quantity: item.quantity,
      charges: item.charges,
      condition: item.condition,
      provenance_summary: item.provenance_summary,
      reason_codes: [],
    }
  })
  return {
    module_version: 'inventory-advisory@1.0',
    action_feasible: selectedItems.every(item => item.accessible),
    reason_codes: selectedItems.length ? [] : ['no_item_interaction'],
    selected_items: selectedItems,
    operation_candidates: [],
    interaction_effects: {
      time_cost: 'none',
      noise: 'none',
      traces: [],
      witness_ids: [],
    },
    consistency_notes: [],
  }
}

function createEngine(client: OpenRouterClient): TurnEngine {
  const clientWithInventoryStub = {
    chatJson: async (request: ChatJsonRequest) => {
      if (request.schema?.name === 'fabula_inventory_advisory_1_0') {
        return {
          requestId: 'request:inventory-stub',
          model: request.model,
          output: inventoryAdvisoryFor(request),
          usage: { total_tokens: 5, cost: 0.0005 },
        }
      }
      return client.chatJson(request)
    },
  } as unknown as OpenRouterClient
  return new TurnEngine(
    config,
    clientWithInventoryStub,
    async () => 'system prompt',
    async () => storyPackSource,
  )
}

function createPipelineEngine(client: OpenRouterClient): TurnEngine {
  return new TurnEngine(
    config,
    client,
    async () => 'system prompt',
    async () => storyPackSource,
  )
}

function successfulTurnOutput(): TurnOutput {
  return {
    schema_version: 'turn-output@0.2',
    turn_id: command.idempotency_key,
    expected_session_version: command.expected_session_version,
    status: 'resolved',
    intent: {
      type: 'inspect_door',
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
      environment: 0,
      time_pressure: 0,
      injury: 0,
      opposition: 0,
      skill: 0,
      tools: 0,
      preparation: 0,
      help: 0,
      final_band: 1,
      uncertainty: 'low',
    },
    resolution: {
      summary: 'Дверь остается закрытой.',
      outcome: 'success',
      reason_codes: ['door_inspected'],
      costs_and_consequences: [],
    },
    operations: [],
    narrative_brief: {
      must_include: ['дверь'],
      must_not_invent: [],
      tone: 'tense',
      point_of_view: 'second_person',
      sensory_scope: ['visible'],
    },
    narrative_text: 'Ты внимательно осматриваешь закрытую дверь.',
    suggested_actions: modelSuggestedActions(),
    media_candidate: null,
    safety_flags: [],
    audit: {
      canon_fact_ids_used: [],
      memory_event_ids_used: [],
      assumptions: [],
      unresolved_ambiguities: [],
      difficulty_regulation_note: null,
    },
  }
}

function quickTurnProposal() {
  return {
    outcome: 'success',
    summary: 'Тишина отвечает на слова игрока. Время замерло.',
    event_kind: 'player_spoke',
    suggested_actions: modelSuggestedActions(),
  }
}

describe('turn engine model telemetry', () => {
  test('runs the inventory resolver before the authoritative model', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: request.schema?.name === 'fabula_inventory_advisory_1_0'
            ? inventoryAdvisoryFor(request)
            : successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createPipelineEngine(client).execute(command, snapshot)

    expect(requests.map(request => request.schema?.name)).toEqual([
      'fabula_inventory_advisory_1_0',
      'fabula_turn_output_0_2',
    ])
    expect(requests[0]).toMatchObject({
      model: 'nvidia/nemotron-3-ultra-550b-a55b',
      timeoutMs: TURN_MODEL_TIMEOUTS.inventoryPrimaryMs,
      payload: {
        schema_version: 'inventory-input@1.0',
        turn_id: command.idempotency_key,
      },
    })
    expect(result.advisoryUsed).toBe(true)
    expect(result.modelRuns.map(run => run.role)).toEqual(['inventory', 'primary'])
  })

  test('uses the inventory fallback before starting the authoritative turn', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        const inventoryAttempt = request.schema?.name === 'fabula_inventory_advisory_1_0'
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: inventoryAttempt && requests.length === 1
            ? { invalid: true }
            : inventoryAttempt
              ? inventoryAdvisoryFor(request)
              : successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createPipelineEngine(client).execute(command, snapshot)

    expect(requests.map(request => request.model)).toEqual([
      'nvidia/nemotron-3-ultra-550b-a55b',
      'mistralai/mistral-small-2603',
      'deepseek/deepseek-v4-flash',
    ])
    expect(requests[1]?.timeoutMs).toBe(TURN_MODEL_TIMEOUTS.inventoryFallbackMs)
    expect(result.fallbackUsed).toBe(true)
    expect(result.modelRuns.map(run => run.role)).toEqual([
      'inventory',
      'inventory-fallback',
      'primary',
    ])
  })

  test('starts a scene-boundary turn with one authoritative model call', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:primary',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(command, {
      ...snapshot,
      history: [],
    })

    expect(requests.map(request => request.model)).toEqual(['deepseek/deepseek-v4-flash'])
    expect(requests[0]).toMatchObject({
      timeoutMs: TURN_MODEL_TIMEOUTS.primaryMs,
      maxOutputTokens: 2000,
    })
    expect(requests[0]?.payload.scene).toMatchObject({
      scene_plan: null,
    })
    expect(result.advisoryUsed).toBe(true)
  })

  test('builds the model packet from the canonical StoryPack source', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:canonical-pack',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const contextualSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      history: [{
        turnId: 'turn:previous',
        sceneId: snapshot.scene.id,
        mode: 'exploration',
        playerText: 'Я проверил печать у восьмого круга.',
        outcome: 'partial_success',
        narrative: 'Печать ответила слабым свечением.',
        costsAndConsequences: ['След на ладони'],
        unresolvedAmbiguities: ['Кто нарушил клятву'],
      }],
      confirmedFacts: [{
        id: 'fact:previous',
        claim: 'Печать реагирует на игрока.',
        truthStatus: 'observed',
        sourceEventIds: ['event:previous'],
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
      knowledge: [{
        characterId: 'character:maelis',
        factId: 'fact:previous',
        sourceEventId: 'event:previous',
        confidence: 0.8,
      }],
    }

    await createEngine(client).execute(command, contextualSnapshot)

    expect(requests[0]?.payload.pack_rules).toMatchObject({
      technical_pack_id: storyPackSource.technicalPackId,
      source_file: storyPackSource.sourceFile,
      source_hash: storyPackSource.sourceHash,
      prompt_overlay: storyPackSource.promptOverlay,
      canonical_core_markdown: storyPackSource.canonicalCore,
    })
    expect(requests[0]?.payload.canon_snapshot).toMatchObject({
      hard_canon: [{
        fact_id: 'canon:eighth-seal:1',
        claim: storyPackSource.hardCanon[0],
      }],
      per_character_knowledge: [{
        character_id: 'character:maelis',
        fact_id: 'fact:previous',
        claim: 'Печать реагирует на игрока.',
      }],
    })
    expect(requests[0]?.payload.relevant_memories).toEqual([{
      turn_id: 'turn:previous',
      mode: 'exploration',
      player_input: 'Я проверил печать у восьмого круга.',
      outcome: 'partial_success',
      narrative_summary: 'Печать ответила слабым свечением.',
      costs_and_consequences: ['След на ладони'],
      unresolved_ambiguities: ['Кто нарушил клятву'],
    }])
  })

  test('passes a journal reference separately from the player text', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:journal-reference',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const journalEntry = {
      id: 'journal:door-sound',
      entry_type: 'clue' as const,
      title: 'Шорох за дверью',
      summary: 'За дверью слышались волочащиеся шаги и тихий стук.',
      uncertainty: 'confirmed' as const,
      source_event_ids: ['event:door-sound'],
      involved_entity_ids: [snapshot.scene.location_id],
      story_time: 'Первый час',
      created_at: '2026-01-01T00:00:00.000Z',
    }
    const journalCommand: TurnCommand = {
      ...command,
      text: 'Я сравниваю этот звук с тем, что слышал раньше.',
      selected_journal_entry_ids: [journalEntry.id],
    }

    await createEngine(client).execute(journalCommand, {
      ...snapshot,
      journal: [journalEntry],
    })

    expect(requests[0]?.payload.player_input).toMatchObject({
      text: journalCommand.text,
      journal_entry_ids: [journalEntry.id],
    })
    expect(requests[0]?.payload.journal_references).toEqual([{
      id: journalEntry.id,
      entry_type: journalEntry.entry_type,
      title: journalEntry.title,
      summary: journalEntry.summary,
      uncertainty: journalEntry.uncertainty,
      source_event_ids: journalEntry.source_event_ids,
      involved_entity_ids: journalEntry.involved_entity_ids,
      story_time: journalEntry.story_time,
    }])
  })

  test('runs the authoritative model once with a bounded timeout', async () => {
    const calls: Array<Pick<ChatJsonRequest, 'model' | 'timeoutMs'>> = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push({ model: request.model, timeoutMs: request.timeoutMs })
        return {
          requestId: 'request:primary',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.execute(command, snapshot)

    expect(calls).toEqual([{
      model: 'deepseek/deepseek-v4-flash',
      timeoutMs: TURN_MODEL_TIMEOUTS.primaryMs,
    }])
    expect(result.advisoryUsed).toBe(true)
    expect(result.fallbackUsed).toBe(false)
  })

  test('uses Aion 3.0 Mini as the dev story model without changing inventory routing', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:aion-story',
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(
      command,
      snapshot,
      undefined,
      undefined,
      undefined,
      'aion',
    )

    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      model: 'aion-labs/aion-3.0-mini',
      jsonMode: 'json-object',
      schema: {
        name: 'fabula_turn_output_0_2',
      },
      devAllowNonZdr: true,
    })
    expect(result.model).toBe('aion-labs/aion-3.0-mini')
  })

  test('projects the confirmed turn into the journal with Nemotron 3 Super', async () => {
    const eventId = snapshot.reservedIds.events[0]!
    const journalId = 'journal:reserved:0001'
    const output = successfulTurnOutput()
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: 'request:journal',
          model: request.model,
          output: {
            module_version: 'journal-compiler@0.2',
            entries: [{
              entry_id: journalId,
              event_refs: [eventId],
              title: 'Проверка двери',
              public_summary: 'Дверь осмотрена, и результат проверки подтвержден текущим событием.',
              location_ref: snapshot.scene.location_id,
              participant_refs: ['player'],
              fact_refs: [],
              item_refs: [],
              relationship_changes_visible_to_player: [],
              rumors: [],
              open_threads: [],
              tags: ['дверь'],
            }],
            character_index_updates: [],
            location_index_updates: [],
            quest_index_updates: [],
            server_only_callback_hooks: [],
          },
          usage: { total_tokens: 12, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.projectJournal(command, {
      snapshot: {
        ...snapshot,
        confirmedEvents: [{
          id: eventId,
          kind: 'door_inspected',
          actorIds: ['player'],
          targetIds: [],
          itemIds: [],
          locationId: snapshot.scene.location_id,
          sourceTurnId: command.idempotency_key,
          createdAt: '2026-01-01T00:00:00.000Z',
        }],
      },
      output,
      sourceEventIds: [eventId],
      reservedJournalIds: [journalId],
    })

    expect(requests[0]).toMatchObject({
      model: 'nvidia/nemotron-3-super-120b-a12b',
      jsonMode: 'json-schema',
      schema: {
        name: 'fabula_journal_compiler_0_2',
      },
    })
    expect(result).toMatchObject({
      fallbackUsed: false,
      entries: [{
        id: journalId,
        title: 'Проверка двери',
        source_event_ids: [eventId],
      }],
      modelRuns: [{
        role: 'journal',
        status: 'accepted',
      }],
    })
  })

  test('passes server-verified inventory state and Honcho recall to the only model call', async () => {
    const itemCommand: TurnCommand = {
      ...command,
      text: 'Я использую аптечку.',
      selected_item_ids: ['item:kit'],
    }
    const itemSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      inventory: [{
        id: 'item:kit',
        template_id: 'item-template:kit',
        name: 'Карманная аптечка',
        category: 'medicine',
        description: 'Аптечка с Земли.',
        quantity: 1,
        charges: 2,
        condition: 'usable',
        owner_id: 'player',
        owner_name: 'Лея',
        holder_id: 'player',
        holder_name: 'Лея',
        location_id: snapshot.scene.location_id,
        location_name: snapshot.scene.location_name,
        slot: 'bag',
        version: 0,
        provenance: {
          kind: 'starting_equipment',
          source_event_id: null,
          summary: 'Получена на Земле до начала истории.',
        },
      }],
    }
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: successfulTurnOutput(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(
      itemCommand,
      itemSnapshot,
      undefined,
      undefined,
      {
        source: 'honcho',
        summary: 'Игрок ранее берег аптечку.',
        peer_representation: 'Игрок предпочитает экономить расходники.',
        peer_card: ['Осторожен с редкими предметами.'],
      },
    )

    expect(requests.map(request => request.schema?.name)).toEqual(['fabula_turn_output_0_2'])
    expect(requests[0]).toMatchObject({
      model: 'deepseek/deepseek-v4-flash',
      payload: {
        inventory_advisory: {
          module_version: 'inventory-advisory@1.0',
          selected_items: [{
            item_id: 'item:kit',
            accessible: true,
            provenance_summary: 'Получена на Земле до начала истории.',
          }],
        },
        external_memory: {
          source: 'honcho',
          trust: 'untrusted_recall_only',
          summary: 'Игрок ранее берег аптечку.',
        },
      },
    })
    expect(result.modelRuns.map(run => run.role)).toEqual(['inventory', 'primary'])
  })

  test('requires a successful acquisition to create the reserved inventory item', async () => {
    const bottleItemId = 'item:reserved:bottle'
    const bottleCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Беру бутылку к себе',
    }
    const bottleSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      reservedIds: {
        ...snapshot.reservedIds,
        itemInstances: [bottleItemId],
      },
      allowedOperationTypes: ['event.create', 'inventory.create_instance'],
    }
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (request.schema?.name === 'fabula_inventory_advisory_1_0') {
          return {
            requestId: 'request:bottle-inventory',
            model: request.model,
            output: inventoryAdvisoryFor(request),
            usage: { total_tokens: 10, cost: 0.001 },
          }
        }
        const output = successfulTurnOutput()
        output.intent.type = 'take_bottle'
        output.resolution.summary = 'Ты берешь бутылку в руку.'
        output.narrative_text = 'Ты берешь бутылку за горлышко. Прохладное стекло остается в твоей руке.'
        output.operations = [
          {
            type: 'event.create',
            operation_index: 0,
            event_id: bottleSnapshot.reservedIds.events[0]!,
            event_kind: 'bottle_taken',
            actor_ids: ['player'],
            target_ids: [],
            item_ids: [bottleItemId],
            location_id: bottleSnapshot.scene.location_id,
            source_turn_id: bottleCommand.idempotency_key,
          },
          {
            type: 'inventory.create_instance',
            operation_index: 1,
            source_event_id: bottleSnapshot.reservedIds.events[0]!,
            item_id: bottleItemId,
            template_id: 'item-template:water-bottle',
            name: 'Бутылка с темной жидкостью',
            category: 'resource',
            description: 'Липкая стеклянная бутылка с темной жидкостью.',
            owner_id: 'player',
            holder_id: 'player',
            location_id: bottleSnapshot.scene.location_id,
            quantity: 1,
            charges: null,
            condition: 'usable',
            slot: 'hand',
          },
        ]
        return {
          requestId: 'request:bottle-turn',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createPipelineEngine(client).execute(bottleCommand, bottleSnapshot)

    expect(requests.map(request => request.schema?.name)).toEqual([
      'fabula_inventory_advisory_1_0',
      'fabula_turn_output_0_2',
    ])
    expect(requests[1]).toMatchObject({
      payload: {
        inventory_advisory: {
          reason_codes: ['portable_object_acquisition'],
          operation_candidates: [{
            type: 'inventory.create_instance',
            item_id: bottleItemId,
            to_entity_id: 'player',
          }],
        },
      },
    })
    expect(result.output.operations.find(operation =>
      operation.type === 'inventory.create_instance')).toMatchObject({
      type: 'inventory.create_instance',
      item_id: bottleItemId,
      holder_id: 'player',
    })
    expect(result.advisoryUsed).toBe(true)
  })

  test('rejects a successful take when the narrator does not give the item to the player', async () => {
    const bottleItemId = 'item:reserved:bottle'
    const bottleCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Беру бутылку к себе',
    }
    const bottleSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      reservedIds: {
        ...snapshot.reservedIds,
        itemInstances: [bottleItemId],
      },
      allowedOperationTypes: ['event.create', 'inventory.create_instance'],
    }
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (request.schema?.name === 'fabula_inventory_advisory_1_0') {
          return {
            requestId: 'request:bottle-inventory',
            model: request.model,
            output: inventoryAdvisoryFor(request),
            usage: { total_tokens: 10, cost: 0.001 },
          }
        }
        if (request.schema?.name === 'fabula_turn_output_0_2') {
          const output = successfulTurnOutput()
          output.resolution.summary = 'Ты берешь бутылку себе.'
          output.narrative_text = 'Ты заворачиваешь бутылку в газету и оставляешь у себя.'
          return {
            requestId: 'request:bottle-turn',
            model: request.model,
            output,
            usage: { total_tokens: 10, cost: 0.001 },
          }
        }
        return {
          requestId: 'request:bottle-fallback',
          model: request.model,
          output: {
            outcome: 'success',
            summary: 'Ты берешь бутылку себе.',
            event_kind: 'bottle_taken',
            suggested_actions: modelSuggestedActions(),
          },
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    let thrown: unknown
    try {
      await createPipelineEngine(client).execute(bottleCommand, bottleSnapshot)
    }
    catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(AiExecutionError)
    expect((thrown as AiExecutionError).code).toBe('MODEL_FALLBACK_EXHAUSTED')
    expect((thrown as AiExecutionError).modelRuns.slice(-2)).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'MODEL_INVENTORY_MISMATCH',
      },
      {
        role: 'fallback',
        status: 'discarded',
        error_code: 'MODEL_INVENTORY_MISMATCH',
      },
    ])
  })

  test('rejects a narrator who makes the player withdraw from taking an object', async () => {
    const takeCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Пойти взять бутылку',
    }
    const takeSnapshot: EngineSessionSnapshot = {
      ...snapshot,
      reservedIds: {
        ...snapshot.reservedIds,
        itemInstances: ['item:reserved:bottle'],
      },
      allowedOperationTypes: ['event.create', 'inventory.create_instance'],
    }
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (requests.length === 1) {
          const output = successfulTurnOutput()
          output.resolution.summary = 'Ты тянешься к бутылке, но не берешь ее.'
          output.narrative_text = 'Ты замечаешь темную жидкость и отдергиваешь руку, не касаясь бутылки.'
          return {
            requestId: 'request:withdraw-primary',
            model: request.model,
            output,
            usage: { total_tokens: 10, cost: 0.001 },
          }
        }
        return {
          requestId: 'request:withdraw-fallback',
          model: request.model,
          output: {
            outcome: 'failure',
            summary: 'Ты тянешься к бутылке, но не касаешься ее.',
            event_kind: 'bottle_left_untouched',
            suggested_actions: modelSuggestedActions(),
          },
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(takeCommand, takeSnapshot)

    expect(requests).toHaveLength(2)
    expect(result.output.resolution).toMatchObject({
      outcome: 'failure',
      reason_codes: ['quick_fallback', 'server_action_guard'],
    })
    expect(result.output.narrative_text).toContain('внешнее препятствие')
    expect(result.modelRuns.slice(-2)).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'MODEL_ACTION_MISMATCH',
      },
      {
        role: 'fallback',
        status: 'accepted',
      },
    ])
  })

  test('preserves usage and safe error codes for discarded paid attempts', async () => {
    const calls: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push(request)
        return {
          requestId: `request:${request.model}`,
          model: request.model,
          output: { invalid: true },
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    let thrown: unknown
    try {
      await engine.execute(command, snapshot)
    }
    catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(AiExecutionError)
    expect((thrown as AiExecutionError).code).toBe('MODEL_FALLBACK_EXHAUSTED')
    expect((thrown as AiExecutionError).modelRuns.slice(-2)).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'INVALID_FIELDS',
        usage: { total_tokens: 10, cost: 0.001 },
      },
      {
        role: 'fallback',
        status: 'discarded',
        error_code: 'MODEL_CONTRACT_ERROR',
        usage: { total_tokens: 10, cost: 0.001 },
      },
    ])
    expect(calls.map(({ model, timeoutMs }) => ({ model, timeoutMs }))).toEqual([
      {
        model: 'deepseek/deepseek-v4-flash',
        timeoutMs: TURN_MODEL_TIMEOUTS.primaryMs,
      },
      {
        model: 'mistralai/mistral-small-2603',
        timeoutMs: TURN_MODEL_TIMEOUTS.fallbackMs,
      },
    ])
    expect(calls[0]?.payload.pack_rules).toMatchObject({
      canonical_core_markdown: storyPackSource.canonicalCore,
    })
    expect(calls[1]).toMatchObject({
      maxOutputTokens: 700,
      schema: {
        name: 'fabula_quick_turn_1_0',
      },
      payload: {
        schema_version: 'quick-turn-input@1.0',
      },
    })
    expect(Array.isArray(calls[1]?.payload.relevant_memories)).toBe(true)
    expect(typeof (calls[1]?.payload.canon_snapshot as Record<string, unknown>)?.title).toBe('string')
    expect(calls[1]?.payload).not.toHaveProperty('external_memory')
    expect(calls[1]?.payload).toMatchObject({
      pack_rules: {
        prompt_overlay: storyPackSource.promptOverlay,
      },
    })
  })

  test('rejects invented entity ids before persistence and lets the registered fallback repair the turn', async () => {
    const calls: string[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls.push(request.model)
        const output = calls.length === 1
          ? successfulTurnOutput()
          : quickTurnProposal()
        if (calls.length === 1 && 'intent' in output)
          output.intent.targets = ['door:invented-by-model']
        return {
          requestId: `request:${calls.length}`,
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.execute(command, snapshot)

    expect(calls).toEqual([
      'deepseek/deepseek-v4-flash',
      'mistralai/mistral-small-2603',
    ])
    expect(result.fallbackUsed).toBe(true)
    expect(result.output.narrative_text).toBe('Тишина отвечает на слова игрока.')
    expect(result.output.suggested_actions).toEqual(modelSuggestedActions())
    expect(result.modelRuns.slice(-2)).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'MODEL_AUTHORITY_ERROR',
        validation_errors: ['$.intent.targets:door:invented-by-model'],
      },
      {
        role: 'fallback',
        status: 'accepted',
        error_code: null,
      },
    ])
  })

  test('does not let either model turn locking the door into opening it', async () => {
    const lockCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Запереть дверь изнутри',
    }
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (requests.length === 1) {
          const output = successfulTurnOutput()
          output.resolution.summary = 'Дверь распахивается шире.'
          output.narrative_text = 'Ты толкаешь дверь плечом, и она распахивается шире.'
          return {
            requestId: 'request:opposite-primary',
            model: request.model,
            output,
            usage: { total_tokens: 10, cost: 0.001 },
          }
        }
        return {
          requestId: 'request:opposite-fallback',
          model: request.model,
          output: {
            outcome: 'success',
            summary: 'Ты нажимаешь на ручку, и дверь открывается.',
            event_kind: 'door_opened',
            suggested_actions: modelSuggestedActions(),
          },
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(lockCommand, snapshot)

    expect(requests).toHaveLength(2)
    expect(result.fallbackUsed).toBe(true)
    expect(result.output.resolution).toMatchObject({
      outcome: 'failure',
      summary: 'Ты пробуешь запереть дверь, но замок не фиксируется. Дверь остается в прежнем положении.',
      reason_codes: ['quick_fallback', 'server_action_guard'],
    })
    expect(result.output.narrative_text).not.toMatch(/откры|распах/iu)
    expect(result.modelRuns.slice(-2)).toMatchObject([
      {
        role: 'primary',
        status: 'discarded',
        error_code: 'MODEL_ACTION_MISMATCH',
      },
      {
        role: 'fallback',
        status: 'accepted',
        error_code: null,
      },
    ])
  })

  test('does not mistake checking a lock for a command to lock the door', async () => {
    const inspectLockCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Проверить, заперта ли дверь',
    }
    let calls = 0
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls += 1
        const output = successfulTurnOutput()
        output.resolution.summary = 'Дверь не заперта.'
        output.narrative_text = 'Ты проверяешь ручку. Дверь не заперта.'
        return {
          requestId: 'request:inspect-lock',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(inspectLockCommand, snapshot)

    expect(calls).toBe(1)
    expect(result.fallbackUsed).toBe(false)
    expect(result.output.narrative_text).toBe('Ты проверяешь ручку. Дверь не заперта.')
  })

  test('accepts a locked door that can no longer be opened', async () => {
    const lockCommand: TurnCommand = {
      ...command,
      mode: 'action',
      text: 'Запереть дверь изнутри',
    }
    let calls = 0
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        calls += 1
        const output = successfulTurnOutput()
        output.resolution.summary = 'Замок фиксируется.'
        output.narrative_text = 'Ты запираешь дверь. Теперь она больше не открывается от нажатия на ручку.'
        return {
          requestId: 'request:aligned-lock',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(lockCommand, snapshot)

    expect(calls).toBe(1)
    expect(result.fallbackUsed).toBe(false)
    expect(result.output.narrative_text).toContain('Ты запираешь дверь.')
  })

  test('allows a confirmed fact as an intent reference without making it a target entity', async () => {
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        const output = successfulTurnOutput()
        output.intent.referenced_entities = ['fact:confirmed']
        return {
          requestId: 'request:confirmed-fact',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(command, {
      ...snapshot,
      confirmedFacts: [{
        id: 'fact:confirmed',
        claim: 'Печать уже реагировала на движение.',
        truthStatus: 'observed',
        sourceEventIds: ['event:confirmed'],
        createdAt: '2026-01-01T00:00:00.000Z',
      }],
    })

    expect(result.output.intent.referenced_entities).toEqual(['fact:confirmed'])
  })

  test('maps exact entity names and drops non-authoritative prose labels from intent hints', async () => {
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        const output = successfulTurnOutput()
        output.intent.targets = ['Зал Призыва', 'the eighth circle']
        output.intent.referenced_entities = ['Зал Призыва', 'unregistered prose label']
        return {
          requestId: 'request:intent-labels',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient

    const result = await createEngine(client).execute(command, snapshot)

    expect(result.output.intent.targets).toEqual(['location:summoning-hall'])
    expect(result.output.intent.referenced_entities).toEqual(['location:summoning-hall'])
  })

  test('passes exact repository rejection paths to the fallback without accepting the invalid turn', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: requests.length === 1
            ? successfulTurnOutput()
            : quickTurnProposal(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)
    let validations = 0

    const result = await engine.execute(command, snapshot, undefined, () => {
      validations += 1
      if (validations === 1) {
        throw new FabulaApiError(
          'MODEL_AUTHORITY_ERROR',
          'Знание назначено неизвестному персонажу.',
          502,
          false,
          ['$.operations[2].character_id'],
        )
      }
    })

    expect(result.fallbackUsed).toBe(true)
    expect(validations).toBe(2)
    expect(requests[1]?.payload.repair_feedback).toEqual({
      previous_role: 'primary',
      error_code: 'MODEL_AUTHORITY_ERROR',
      validation_errors: ['$.operations[2].character_id'],
    })
  })

  test('uses the server-owned turn envelope while preserving strict validation of model content', async () => {
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        const output = successfulTurnOutput()
        output.turn_id = 'turn:model-invented'
        output.expected_session_version = 999
        output.difficulty.final_band = 5
        output.operations = [{
          type: 'event.create',
          operation_index: 0,
          event_id: snapshot.reservedIds.events[0]!,
          event_kind: 'door_inspected',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [],
          location_id: 'location:summoning-hal',
          source_turn_id: 'turn:model-invented',
        }]
        return {
          requestId: 'request:wrong-envelope',
          model: request.model,
          output,
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)

    const result = await engine.execute(command, snapshot)

    expect(result.output.turn_id).toBe(command.idempotency_key)
    expect(result.output.expected_session_version).toBe(command.expected_session_version)
    expect(result.output.difficulty.final_band).toBe(1)
    expect(result.output.operations[0]).toMatchObject({
      type: 'event.create',
      source_turn_id: command.idempotency_key,
      location_id: snapshot.scene.location_id,
    })
  })

  test('does not keep retrying after the bounded fallback is rejected', async () => {
    const requests: ChatJsonRequest[] = []
    const client = {
      chatJson: async (request: ChatJsonRequest) => {
        requests.push(request)
        if (requests.length === 1)
          throw new OpenRouterError('UPSTREAM_TIMEOUT', 'OpenRouter не ответил вовремя.', 504, true)
        return {
          requestId: `request:${requests.length}`,
          model: request.model,
          output: quickTurnProposal(),
          usage: { total_tokens: 10, cost: 0.001 },
        }
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)
    let validations = 0

    const result = engine.execute(command, snapshot, undefined, () => {
      validations += 1
      throw new FabulaApiError(
        'MODEL_AUTHORITY_ERROR',
        'Знание назначено неизвестному персонажу.',
        502,
      )
    })

    await expect(result).rejects.toMatchObject({ code: 'MODEL_FALLBACK_EXHAUSTED' })
    expect(requests).toHaveLength(2)
    expect(validations).toBe(1)
  })

  test('does not start fallback after the caller cancels the turn', async () => {
    let calls = 0
    const client = {
      chatJson: async ({ signal }: ChatJsonRequest) => {
        calls += 1
        await new Promise<never>((_resolve, reject) => {
          const rejectAborted = () => reject(new OpenRouterError('UPSTREAM_ABORTED', 'Запрос отменен.', 499, true))
          if (signal?.aborted)
            rejectAborted()
          else
            signal?.addEventListener('abort', rejectAborted, { once: true })
        })
      },
    } as unknown as OpenRouterClient
    const engine = createEngine(client)
    const controller = new AbortController()
    const request = engine.execute(command, snapshot, controller.signal)
    while (calls === 0)
      await new Promise(resolve => setTimeout(resolve, 1))

    controller.abort()

    await expect(request).rejects.toMatchObject({ code: 'UPSTREAM_ABORTED' })
    expect(calls).toBe(1)
  })
})

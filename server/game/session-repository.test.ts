import { describe, expect, test } from 'bun:test'
import type { CreateGameSessionRequest, GameTurnCommand } from '../../shared/game'
import type { TurnOutput } from '../ai/contracts'
import { validTurnOutput } from '../ai/contracts.test'
import { FabulaApiError } from '../ai/http'
import type { EngineSessionSnapshot, GameSessionStorage, SessionTurnResult } from './session-repository'
import { GameSessionRepository, MemoryGameSessionStorage } from './session-repository'

const ownerId = 'player:11111111-1111-4111-8111-111111111111'

class ReferenceGameSessionStorage implements GameSessionStorage {
  private readonly values = new Map<string, unknown>()

  async getItem<T>(key: string): Promise<T | null> {
    return this.values.has(key) ? this.values.get(key) as T : null
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.values.set(key, value)
  }

  async getKeys(): Promise<string[]> {
    return [...this.values.keys()]
  }
}

const createRequest: CreateGameSessionRequest = {
  schema_version: 'session-create@1.0',
  story_pack_id: 'eighth-seal',
  persona: {
    name: 'Лея',
    role_id: 'eighth-seal:engineer',
    motivation: 'Понять причину восьмого круга',
    embodiment_note: '',
    narration_density: 'balanced',
  },
}

function makeCommand(sessionId: string, overrides: Partial<GameTurnCommand> = {}): GameTurnCommand {
  return {
    schema_version: 'turn-command@1.0',
    session_id: sessionId,
    idempotency_key: 'turn:11111111-1111-4111-8111-111111111111',
    expected_session_version: 0,
    mode: 'exploration',
    text: 'Я изучаю линии восьмого круга.',
    selected_target_ids: [],
    selected_item_ids: [],
    selected_journal_entry_ids: [],
    selected_suggestion_id: null,
    ...overrides,
  }
}

function workerResult(snapshot: EngineSessionSnapshot, command: GameTurnCommand, operations?: TurnOutput['operations']): SessionTurnResult {
  const output = validTurnOutput({
    turn_id: command.idempotency_key,
    expected_session_version: command.expected_session_version,
    operations: operations || [{
      type: 'event.create',
      operation_index: 0,
      event_id: snapshot.reservedIds.events[0],
      event_kind: 'circle_inspected',
      actor_ids: ['player'],
      target_ids: [],
      item_ids: [],
      location_id: snapshot.scene.location_id,
      source_turn_id: command.idempotency_key,
    }],
  }) as unknown as TurnOutput
  return {
    output,
    model: 'deepseek/deepseek-v4-flash',
    fallbackUsed: false,
    advisoryUsed: false,
  }
}

describe('game session repository', () => {
  test('pins the canonical pack version and creates role-owned projections', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)

    expect(session.story_pack_id).toBe('eighth-seal')
    expect(session.story_pack_version).toBe('0.2')
    expect(session.persona.role_label).toBe('Инженерное мышление')
    expect(session.inventory[0]?.name).toBe('Механический карандаш')
    expect(session.inventory[0]?.location_id).toBe(session.scene.location_id)
    expect(session.inventory[0]?.provenance).toMatchObject({
      kind: 'starting_equipment',
      source_event_id: null,
    })
    expect(session.journal[0]?.title).toBe('Восьмой круг')
    expect(session.suggestions).toHaveLength(6)
    expect(new Set(session.suggestions.map(suggestion => suggestion.mode))).toEqual(
      new Set(['action', 'speech', 'exploration']),
    )
    expect(session.characters.map(character => character.id)).toEqual([
      'character:ilva-rein',
      'character:kassar-vel',
    ])
    expect(session.locations.map(location => location.id)).toEqual(['location:summoning-hall'])
    expect(session.scene.present_character_ids).toEqual(['character:ilva-rein', 'character:kassar-vel'])
  })

  test('knows the neighbor without placing her inside the player apartment', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, {
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

    expect(session.characters.map(character => character.id)).toEqual(['character:nina-gromova'])
    expect(session.scene.location_id).toBe('location:player-apartment')
    expect(session.scene.present_character_ids).toEqual([])
  })

  test('repairs the legacy opening that placed the neighbor inside the apartment', async () => {
    const storage = new ReferenceGameSessionStorage()
    const repository = new GameSessionRepository(storage)
    const session = await repository.create(ownerId, {
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
    const key = `sessions:${session.id}`
    const stored = await storage.getItem<Record<string, any>>(key)
    stored!.snapshot.scene.present_character_ids = ['character:nina-gromova']
    delete stored!.stateRevisions
    await storage.setItem(key, stored)

    const restored = await repository.get(ownerId, session.id)

    expect(restored.scene.present_character_ids).toEqual([])
    expect(restored.characters.map(character => character.id)).toEqual(['character:nina-gromova'])
  })

  test('isolates started stories by the server-owned player id', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    await repository.create(ownerId, createRequest)

    expect(await repository.list(ownerId)).toHaveLength(1)
    expect(await repository.list('player:22222222-2222-4222-8222-222222222222')).toHaveLength(0)
  })

  test('coalesces concurrent duplicate turns and stores one committed result', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)
    let calls = 0
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const worker = async (snapshot: EngineSessionSnapshot) => {
      calls += 1
      await gate
      return workerResult(snapshot, command)
    }

    const first = repository.executeTurn(ownerId, command, worker, 'request:first')
    const second = repository.executeTurn(ownerId, command, worker, 'request:second')
    release()
    const [firstResponse, secondResponse] = await Promise.all([first, second])

    expect(calls).toBe(1)
    expect(firstResponse.session_version).toBe(1)
    expect(secondResponse.replayed).toBe(true)
    expect(firstResponse.session.messages).toHaveLength(3)
  })

  test('uses only the next actions returned with the generated story', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)
    const modelActions: TurnOutput['suggested_actions'] = [
      {
        label: 'Сопоставить скол с линиями круга',
        mode: 'exploration',
        intent_hint: 'compare_chip_with_circle',
      },
      {
        label: 'Проверить пыль внутри разрыва',
        mode: 'exploration',
        intent_hint: 'inspect_dust_in_gap',
      },
    ]

    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      const result = workerResult(snapshot, command)
      result.output.suggested_actions = modelActions
      return result
    }, 'request:model-suggestions')

    expect(response.session.suggestions.map(suggestion => ({
      label: suggestion.label,
      mode: suggestion.mode,
      intent_hint: suggestion.intent_hint,
    }))).toEqual(modelActions)
    expect(response.session.suggestions.map(suggestion => suggestion.label)).not.toContain('Сменить позицию')
  })

  test('does not let another player join an in-flight turn', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const ownerTurn = repository.executeTurn(ownerId, command, async (snapshot) => {
      await gate
      return workerResult(snapshot, command)
    }, 'request:owner')
    const otherPlayerTurn = repository.executeTurn(
      'player:22222222-2222-4222-8222-222222222222',
      command,
      async (snapshot) => workerResult(snapshot, command),
      'request:other-player',
    )
    const otherPlayerResult = otherPlayerTurn.catch((error: unknown) => error)

    release()
    await expect(ownerTurn).resolves.toMatchObject({ session_id: session.id })
    expect(await otherPlayerResult).toMatchObject({ code: 'SESSION_NOT_FOUND' })
  })

  test('replays a committed turn with the current session snapshot', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const firstCommand = makeCommand(session.id)
    await repository.executeTurn(
      ownerId,
      firstCommand,
      async snapshot => workerResult(snapshot, firstCommand),
      'request:first-commit',
    )
    const secondCommand = makeCommand(session.id, {
      idempotency_key: 'turn:22222222-2222-4222-8222-222222222222',
      expected_session_version: 1,
      text: 'Я сравниваю линии с записью архивистки.',
    })
    await repository.executeTurn(
      ownerId,
      secondCommand,
      async snapshot => workerResult(snapshot, secondCommand),
      'request:second-commit',
    )

    const replay = await repository.executeTurn(
      ownerId,
      firstCommand,
      async () => {
        throw new Error('replayed turn must not call the worker')
      },
      'request:first-replay',
    )
    expect(replay.replayed).toBe(true)
    expect(replay.session_version).toBe(2)
    expect(replay.session.messages).toHaveLength(5)
  })

  test('rejects a stale version before calling the model', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, { expected_session_version: 1 })
    let called = false

    await expect(repository.executeTurn(ownerId, command, async (snapshot) => {
      called = true
      return workerResult(snapshot, command)
    }, 'request:stale')).rejects.toMatchObject({ code: 'SESSION_VERSION_CONFLICT' })
    expect(called).toBe(false)
  })

  test('rejects forged command references before calling the model', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      selected_target_ids: ['character:forged'],
      selected_item_ids: ['item:forged'],
      selected_journal_entry_ids: ['journal:forged'],
      selected_suggestion_id: 'suggestion:forged',
    })
    let called = false

    await expect(repository.executeTurn(ownerId, command, async (snapshot) => {
      called = true
      return workerResult(snapshot, command)
    }, 'request:forged-references')).rejects.toMatchObject({ code: 'INVALID_COMMAND_REFERENCE' })
    expect(called).toBe(false)
  })

  test('keeps a selected journal entry separate from the player text', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const journalEntry = session.journal[0]!
    const command = makeCommand(session.id, {
      text: 'Я сравниваю следы на арке.',
      selected_journal_entry_ids: [journalEntry.id],
    })

    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      expect(snapshot.journal.find(entry => entry.id === journalEntry.id)).toEqual(journalEntry)
      return workerResult(snapshot, command)
    }, 'request:journal-reference')

    const playerMessage = response.session.messages.findLast(message => message.role === 'player')
    expect(playerMessage?.text).toBe(command.text)
    expect(playerMessage?.selected_journal_entries).toEqual([journalEntry])
  })

  test('rejects an unknown journal reference before calling the model', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      selected_journal_entry_ids: ['journal:forged'],
    })
    let called = false

    await expect(repository.executeTurn(ownerId, command, async (snapshot) => {
      called = true
      return workerResult(snapshot, command)
    }, 'request:forged-journal')).rejects.toMatchObject({ code: 'INVALID_COMMAND_REFERENCE' })
    expect(called).toBe(false)
  })

  test('applies inventory consumption only after CAS validation and a confirmed event', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      mode: 'action',
      text: 'Я делаю схему карандашом.',
      selected_item_ids: [session.inventory[0]!.id],
    })
    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      const item = snapshot.inventory[0]!
      const eventId = snapshot.reservedIds.events[0]!
      return workerResult(snapshot, command, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'item_used',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [item.id],
          location_id: snapshot.scene.location_id,
          source_turn_id: command.idempotency_key,
        },
        {
          type: 'inventory.consume',
          operation_index: 1,
          source_event_id: eventId,
          item_id: item.id,
          amount: 1,
          expected: {
            owner_id: item.owner_id,
            holder_id: item.holder_id,
            location_id: item.location_id,
            container_id: null,
            quantity: item.quantity,
            charges: item.charges,
            condition: item.condition,
            version: item.version,
          },
        },
      ])
    }, 'request:consume')

    expect(response.session.inventory[0]?.charges).toBe(4)
    expect(response.session.inventory[0]?.version).toBe(1)
    const playerMessage = response.session.messages.findLast(message => message.role === 'player')
    expect(playerMessage?.selected_items[0]).toMatchObject({
      id: session.inventory[0]?.id,
      charges: session.inventory[0]?.charges,
      version: 0,
    })
    expect(response.session.journal[0]?.source_event_ids).toHaveLength(1)
  })

  test('builds the journal projection only from the committed snapshot', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)
    let projectedAfterCommit = false

    const response = await repository.executeTurn(
      ownerId,
      command,
      async snapshot => workerResult(snapshot, command),
      'request:journal-projection',
      async (context) => {
        const eventId = context.sourceEventIds[0]!
        const committed = await repository.get(ownerId, session.id)
        projectedAfterCommit = committed.version === 1
          && committed.journal[0]?.id === context.reservedJournalIds[0]
          && context.snapshot.confirmedEvents.some(event => event.id === eventId)
        return {
          entries: [{
            id: context.reservedJournalIds[0]!,
            entry_type: 'clue',
            title: 'Линии круга',
            summary: 'Осмотр линий восьмого круга подтвержден и добавлен в журнал.',
            uncertainty: 'confirmed',
            source_event_ids: [eventId],
            involved_entity_ids: ['player'],
            story_time: context.snapshot.scene.story_time,
          }],
          fallbackUsed: false,
          modelRuns: [{
            role: 'journal',
            model: 'nvidia/nemotron-3-super-120b-a12b',
            request_id: 'request:nemotron-journal',
            usage: { total_tokens: 12 },
            status: 'accepted',
            error_code: null,
            validation_errors: [],
          }],
        }
      },
    )

    expect(projectedAfterCommit).toBe(true)
    expect(response.session.journal[0]).toMatchObject({
      title: 'Линии круга',
    })
    expect(response.session.journal[0]?.source_event_ids[0]?.startsWith('event:')).toBe(true)
    expect(response.fallback_used).toBe(false)
  })

  test('keeps the committed turn when the journal projector fails', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)

    const response = await repository.executeTurn(
      ownerId,
      command,
      async snapshot => workerResult(snapshot, command),
      'request:journal-fallback',
      async () => {
        throw new Error('journal unavailable')
      },
    )

    expect(response.session.version).toBe(1)
    expect(response.fallback_used).toBe(true)
    expect(response.session.journal[0]?.source_event_ids).toHaveLength(1)
    const replay = await repository.executeTurn(
      ownerId,
      command,
      async () => {
        throw new Error('worker must not run for replay')
      },
      'request:journal-fallback-replay',
    )
    expect(replay.replayed).toBe(true)
    expect(replay.fallback_used).toBe(true)
  })

  test('rejects selecting an item the player no longer holds before calling a model', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const item = session.inventory[0]!
    const transferCommand = makeCommand(session.id, {
      mode: 'action',
      text: 'Я передаю карандаш Илве.',
    })
    await repository.executeTurn(ownerId, transferCommand, async (snapshot) => {
      const eventId = snapshot.reservedIds.events[0]!
      return workerResult(snapshot, transferCommand, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'item_transferred',
          actor_ids: ['player'],
          target_ids: ['character:ilva-rein'],
          item_ids: [item.id],
          location_id: snapshot.scene.location_id,
          source_turn_id: transferCommand.idempotency_key,
        },
        {
          type: 'inventory.transfer_custody',
          operation_index: 1,
          source_event_id: eventId,
          item_id: item.id,
          from_holder_id: 'player',
          to_holder_id: 'character:ilva-rein',
          quantity: item.quantity,
          expected: {
            owner_id: item.owner_id,
            holder_id: item.holder_id,
            location_id: item.location_id,
            container_id: null,
            quantity: item.quantity,
            charges: item.charges,
            condition: item.condition,
            version: item.version,
          },
        },
      ])
    }, 'request:transfer-item')

    let called = false
    const inaccessibleCommand = makeCommand(session.id, {
      idempotency_key: 'turn:22222222-2222-4222-8222-222222222222',
      expected_session_version: 1,
      mode: 'action',
      text: 'Я снова использую карандаш.',
      selected_item_ids: [item.id],
    })
    await expect(repository.executeTurn(ownerId, inaccessibleCommand, async (snapshot) => {
      called = true
      return workerResult(snapshot, inaccessibleCommand)
    }, 'request:inaccessible-item')).rejects.toMatchObject({ code: 'ITEM_NOT_ACCESSIBLE' })
    expect(called).toBe(false)
  })

  test('creates a discovered item only from a reserved id and confirmed event', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      mode: 'action',
      text: 'Я поднимаю пустую медную печать.',
    })
    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      const eventId = snapshot.reservedIds.events[0]!
      const itemId = snapshot.reservedIds.itemInstances[0]!
      return workerResult(snapshot, command, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'copper_seal_taken',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [itemId],
          location_id: snapshot.scene.location_id,
          source_turn_id: command.idempotency_key,
        },
        {
          type: 'inventory.create_instance',
          operation_index: 1,
          source_event_id: eventId,
          item_id: itemId,
          template_id: 'item-template:eighth-seal:copper-seal',
          name: 'Пустая медная печать',
          category: 'keepsake',
          description: 'Медная печать без имени и сформулированного договора.',
          owner_id: 'player',
          holder_id: 'player',
          location_id: snapshot.scene.location_id,
          quantity: 1,
          charges: null,
          condition: 'usable',
          slot: 'hand',
        },
      ])
    }, 'request:create-item')

    expect(response.session.inventory).toHaveLength(2)
    expect(response.session.inventory[1]).toMatchObject({
      name: 'Пустая медная печать',
      owner_id: 'player',
      holder_id: 'player',
      version: 0,
      provenance: {
        kind: 'world_event',
        source_event_id: response.session.journal[0]?.source_event_ids[0],
      },
    })
  })

  test('transitions the canonical scene and reveals only reached world state', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      mode: 'action',
      text: 'Я вместе с Илвой добираюсь до архива договоров.',
    })
    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      const eventId = snapshot.reservedIds.events[0]!
      return workerResult(snapshot, command, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'archive_reached',
          actor_ids: ['player', 'character:ilva-rein'],
          target_ids: [],
          item_ids: [],
          location_id: 'location:unfinished-contracts-archive',
          source_turn_id: command.idempotency_key,
        },
        {
          type: 'scene.transition',
          operation_index: 1,
          source_event_id: eventId,
          scene_id: snapshot.reservedIds.scenes[0]!,
          title: 'Дверь архива',
          location_id: 'location:unfinished-contracts-archive',
          story_time: 'Второй час после призыва',
          objective: 'Открыть архив, не принимая чужого договора.',
          present_character_ids: ['character:ilva-rein'],
          expected: {
            scene_id: snapshot.scene.id,
            location_id: snapshot.scene.location_id,
            story_time: snapshot.scene.story_time,
          },
        },
      ])
    }, 'request:scene-transition')

    expect(response.session.scene).toMatchObject({
      title: 'Дверь архива',
      location_id: 'location:unfinished-contracts-archive',
      present_character_ids: ['character:ilva-rein'],
    })
    expect(response.session.scene.id.startsWith('scene:')).toBe(true)
    expect(response.session.locations.find(location => location.id === 'location:summoning-hall')?.status)
      .toBe('Известная локация')
    expect(response.session.locations.find(location => location.id === 'location:unfinished-contracts-archive')?.status)
      .toBe('Текущая локация')
    expect(response.session.inventory[0]).toMatchObject({
      location_id: 'location:unfinished-contracts-archive',
      location_name: 'Архив договоров',
      version: 1,
    })
  })

  test('updates scene presence and moves items with their holders', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id, {
      mode: 'speech',
      text: 'Маэлис входит в зал, а Кассар уносит свиток в архив.',
    })
    const response = await repository.executeTurn(ownerId, command, async (snapshot) => {
      const eventId = snapshot.reservedIds.events[0]!
      const itemId = snapshot.reservedIds.itemInstances[0]!
      return workerResult(snapshot, command, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'ritual_architect_arrived',
          actor_ids: ['character:maelis-arden', 'character:kassar-vel'],
          target_ids: [],
          item_ids: [itemId],
          location_id: snapshot.scene.location_id,
          source_turn_id: command.idempotency_key,
        },
        {
          type: 'inventory.create_instance',
          operation_index: 1,
          source_event_id: eventId,
          item_id: itemId,
          template_id: 'item-template:eighth-seal:royal-scroll',
          name: 'Королевский свиток',
          category: 'document',
          description: 'Свиток с записью семи завершенных договоров.',
          owner_id: 'player',
          holder_id: 'character:kassar-vel',
          location_id: snapshot.scene.location_id,
          quantity: 1,
          charges: null,
          condition: 'usable',
          slot: 'hand',
        },
        {
          type: 'scene.update_presence',
          operation_index: 2,
          source_event_id: eventId,
          present_character_ids: ['character:ilva-rein', 'character:maelis-arden'],
          departures: [{
            character_id: 'character:kassar-vel',
            destination_location_id: 'location:unfinished-contracts-archive',
          }],
          expected: {
            scene_id: snapshot.scene.id,
            present_character_ids: [...snapshot.scene.present_character_ids],
          },
        },
      ])
    }, 'request:scene-presence')

    expect(response.session.scene.present_character_ids).toEqual([
      'character:ilva-rein',
      'character:maelis-arden',
    ])
    expect(response.session.characters.map(character => character.id)).toEqual([
      'character:ilva-rein',
      'character:kassar-vel',
      'character:maelis-arden',
    ])
    expect(response.session.inventory.find(item => item.name === 'Королевский свиток')).toMatchObject({
      holder_id: 'character:kassar-vel',
      location_id: 'location:unfinished-contracts-archive',
      location_name: 'Архив договоров',
      version: 1,
    })
  })

  test('stages operations atomically before writing the session', async () => {
    const repository = new GameSessionRepository(new ReferenceGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    const command = makeCommand(session.id)

    await expect(repository.executeTurn(ownerId, command, async (snapshot) => {
      const eventId = snapshot.reservedIds.events[0]!
      return {
        ...workerResult(snapshot, command, [
        {
          type: 'event.create',
          operation_index: 0,
          event_id: eventId,
          event_kind: 'circle_inspected',
          actor_ids: ['player'],
          target_ids: [],
          item_ids: [],
          location_id: snapshot.scene.location_id,
          source_turn_id: command.idempotency_key,
        },
        {
          type: 'fact.create',
          operation_index: 1,
          fact_id: 'fact:not-reserved',
          claim: 'Эта операция должна откатиться вместе с событием.',
          truth_status: 'observed',
          source_event_ids: [eventId],
        },
        ]),
        modelRuns: [{
          role: 'primary',
          model: 'deepseek/deepseek-v4-flash',
          request_id: 'request:model-authority',
          usage: { total_tokens: 10 },
          status: 'accepted',
          error_code: null,
          validation_errors: [],
        }],
      }
    }, 'request:atomicity')).rejects.toMatchObject({
      code: 'MODEL_AUTHORITY_ERROR',
      modelRuns: [{
        request_id: 'request:model-authority',
        status: 'accepted',
      }],
    })

    const current = await repository.get(ownerId, session.id)
    expect(current.version).toBe(0)
    expect(current.messages).toHaveLength(1)
    expect(current.journal).toHaveLength(1)
  })

  test('does not reveal whether another player owns a session', async () => {
    const repository = new GameSessionRepository(new MemoryGameSessionStorage())
    const session = await repository.create(ownerId, createRequest)
    await expect(repository.get('player:22222222-2222-4222-8222-222222222222', session.id))
      .rejects.toBeInstanceOf(FabulaApiError)
  })
})

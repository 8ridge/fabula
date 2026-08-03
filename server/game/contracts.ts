import {
  PLAYER_ATTRIBUTE_DEFINITIONS,
  PLAYER_ATTRIBUTE_MAX,
  PLAYER_ATTRIBUTE_MIN,
  PLAYER_ATTRIBUTE_POINT_BUDGET,
} from '../../shared/game'
import type { CreateGameSessionRequest, PlayerAttributeScores, PlayerPersonaInput } from '../../shared/game'
import { isStoryPackId, STORY_PACKS } from '../../shared/storypacks'
import type { StoryPackId } from '../../shared/storypacks'
import { ContractError } from '../ai/contracts'

const SESSION_ID = /^session:[0-9a-f-]{36}$/i

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

function cleanString(value: unknown, path: string, min: number, max: number): string {
  if (typeof value !== 'string')
    throw new ContractError('INVALID_FIELD', 'Ожидалась строка.', [path])
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length < min || normalized.length > max)
    throw new ContractError('INVALID_FIELD', 'Некорректная длина строки.', [path])
  return normalized
}

function optionalCleanString(value: unknown, path: string, min: number, max: number): string | undefined {
  return value === undefined ? undefined : cleanString(value, path, min, max)
}

function parseAttributes(value: unknown): PlayerAttributeScores | undefined {
  if (value === undefined)
    return undefined
  if (!isRecord(value))
    throw new ContractError('INVALID_FIELD', 'Некорректные характеристики героя.', ['$.persona.attributes'])

  const keys = PLAYER_ATTRIBUTE_DEFINITIONS.map(attribute => attribute.key)
  exactKeys(value, keys, '$.persona.attributes')
  requiredKeys(value, keys, '$.persona.attributes')

  const attributes = Object.fromEntries(PLAYER_ATTRIBUTE_DEFINITIONS.map(({ key }) => {
    const score = value[key]
    if (typeof score !== 'number' || !Number.isInteger(score) || score < PLAYER_ATTRIBUTE_MIN || score > PLAYER_ATTRIBUTE_MAX) {
      throw new ContractError(
        'INVALID_FIELD',
        `Характеристика должна быть целым числом от ${PLAYER_ATTRIBUTE_MIN} до ${PLAYER_ATTRIBUTE_MAX}.`,
        [`$.persona.attributes.${key}`],
      )
    }
    return [key, score]
  })) as PlayerAttributeScores
  const spent = PLAYER_ATTRIBUTE_DEFINITIONS.reduce(
    (total, { key }) => total + attributes[key] - PLAYER_ATTRIBUTE_MIN,
    0,
  )
  if (spent > PLAYER_ATTRIBUTE_POINT_BUDGET) {
    throw new ContractError(
      'INVALID_FIELD',
      `На характеристики можно потратить не больше ${PLAYER_ATTRIBUTE_POINT_BUDGET} очков.`,
      ['$.persona.attributes'],
    )
  }
  return attributes
}

function parsePersona(value: unknown, storyPackId: StoryPackId): PlayerPersonaInput {
  if (!isRecord(value))
    throw new ContractError('INVALID_FIELD', 'Некорректное воплощение игрока.', ['$.persona'])
  const keys = [
    'name',
    'role_id',
    'role_label',
    'competence',
    'limitation',
    'attributes',
    'motivation',
    'background',
    'embodiment_note',
    'narration_density',
  ] as const
  exactKeys(value, keys, '$.persona')
  requiredKeys(value, ['name', 'role_id', 'motivation', 'embodiment_note', 'narration_density'], '$.persona')
  const roleId = cleanString(value.role_id, '$.persona.role_id', 3, 120)
  const role = STORY_PACKS[storyPackId].roles.find(candidate => candidate.id === roleId)
  if (!role)
    throw new ContractError('INVALID_FIELD', 'Роль не принадлежит выбранному StoryPack.', ['$.persona.role_id'])
  if (!['concise', 'balanced', 'rich'].includes(String(value.narration_density)))
    throw new ContractError('INVALID_FIELD', 'Некорректная плотность повествования.', ['$.persona.narration_density'])
  const embodimentNote = cleanString(value.embodiment_note, '$.persona.embodiment_note', 0, 420)
  const roleLabel = optionalCleanString(value.role_label, '$.persona.role_label', 2, 80)
  const competence = optionalCleanString(value.competence, '$.persona.competence', 8, 480)
  const limitation = optionalCleanString(value.limitation, '$.persona.limitation', 8, 480)
  const background = optionalCleanString(value.background, '$.persona.background', 0, 1_200)
  if (role.id.endsWith(':free') && (competence || embodimentNote).length < 12)
    throw new ContractError('INVALID_FIELD', 'Для свободного воплощения опиши компетенцию и ограничение.', ['$.persona.embodiment_note'])
  return {
    name: cleanString(value.name, '$.persona.name', 2, 40),
    role_id: roleId,
    role_label: roleLabel,
    competence,
    limitation,
    attributes: parseAttributes(value.attributes),
    motivation: cleanString(value.motivation, '$.persona.motivation', 3, 600),
    background,
    embodiment_note: embodimentNote,
    narration_density: value.narration_density as PlayerPersonaInput['narration_density'],
  }
}

export function parseCreateGameSessionRequest(value: unknown): CreateGameSessionRequest {
  if (!isRecord(value))
    throw new ContractError('INVALID_BODY', 'Ожидался JSON-объект.')
  const keys = ['schema_version', 'story_pack_id', 'persona'] as const
  exactKeys(value, keys, '$')
  requiredKeys(value, keys, '$')
  if (value.schema_version !== 'session-create@1.0')
    throw new ContractError('UNSUPPORTED_SCHEMA', 'Неподдерживаемая версия создания сессии.', ['$.schema_version'])
  if (!isStoryPackId(value.story_pack_id))
    throw new ContractError('INVALID_FIELD', 'Неизвестный StoryPack.', ['$.story_pack_id'])
  return {
    schema_version: 'session-create@1.0',
    story_pack_id: value.story_pack_id,
    persona: parsePersona(value.persona, value.story_pack_id),
  }
}

export function parseSessionId(value: unknown): string {
  if (typeof value !== 'string' || !SESSION_ID.test(value))
    throw new ContractError('INVALID_FIELD', 'Некорректный идентификатор сессии.', ['$.session_id'])
  return value
}

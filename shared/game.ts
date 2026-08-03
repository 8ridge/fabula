import type { StoryMode, StoryPackId, StoryPackVersion } from './storypacks'

export type SessionStatus = 'active' | 'completed' | 'archived'
export type MessageRole = 'narrator' | 'character' | 'player' | 'system'
export type JournalEntryType = 'event' | 'character' | 'location' | 'item' | 'clue' | 'promise' | 'objective'
export type JournalUncertainty = 'confirmed' | 'reported' | 'suspected' | 'contradicted'

export const PLAYER_ATTRIBUTE_DEFINITIONS = [
  { key: 'str', label: 'Сила' },
  { key: 'dex', label: 'Ловкость' },
  { key: 'con', label: 'Телосложение' },
  { key: 'int', label: 'Разум' },
  { key: 'wis', label: 'Мудрость' },
  { key: 'cha', label: 'Харизма' },
] as const

export type PlayerAttributeKey = (typeof PLAYER_ATTRIBUTE_DEFINITIONS)[number]['key']
export type PlayerAttributeScores = Record<PlayerAttributeKey, number>

export const PLAYER_ATTRIBUTE_MIN = 8
export const PLAYER_ATTRIBUTE_MAX = 18
export const PLAYER_ATTRIBUTE_POINT_BUDGET = 15
export const PLAYER_ATTRIBUTE_BASE_SCORES: PlayerAttributeScores = {
  str: PLAYER_ATTRIBUTE_MIN,
  dex: PLAYER_ATTRIBUTE_MIN,
  con: PLAYER_ATTRIBUTE_MIN,
  int: PLAYER_ATTRIBUTE_MIN,
  wis: PLAYER_ATTRIBUTE_MIN,
  cha: PLAYER_ATTRIBUTE_MIN,
}

export function playerAttributeModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export interface PlayerPersonaInput {
  name: string
  role_id: string
  role_label?: string
  competence?: string
  limitation?: string
  attributes?: PlayerAttributeScores
  motivation: string
  background?: string
  embodiment_note: string
  narration_density: 'concise' | 'balanced' | 'rich'
}

export interface PlayerPersona extends PlayerPersonaInput {
  role_label: string
  competence: string
  limitation: string
  background: string
}

export interface SuggestedAction {
  id: string
  label: string
  mode: StoryMode
  intent_hint: string
}

export interface GameMessage {
  id: string
  role: MessageRole
  speaker: string
  text: string
  created_at: string
  mode: StoryMode | null
  outcome: 'success' | 'partial_success' | 'failure' | 'impossible' | null
  selected_items: InventoryItemProjection[]
  selected_journal_entries: JournalEntryProjection[]
}

export interface InventoryItemProjection {
  id: string
  template_id: string
  name: string
  category: 'tool' | 'document' | 'medicine' | 'keepsake' | 'resource'
  description: string
  quantity: number
  charges: number | null
  condition: 'pristine' | 'usable' | 'worn' | 'damaged' | 'spent'
  owner_id: string
  owner_name: string
  holder_id: string
  holder_name: string
  location_id: string
  location_name: string
  slot: 'hand' | 'body' | 'bag' | null
  version: number
  provenance: {
    kind: 'starting_equipment' | 'world_event' | 'legacy_snapshot'
    source_event_id: string | null
    summary: string
  }
}

export interface JournalEntryProjection {
  id: string
  entry_type: JournalEntryType
  title: string
  summary: string
  uncertainty: JournalUncertainty
  source_event_ids: string[]
  involved_entity_ids: string[]
  story_time: string
  created_at: string
}

export interface CharacterProjection {
  id: string
  name: string
  role: string
  relation: string
  description: string
  knowledge_summary: string
}

export interface LocationProjection {
  id: string
  name: string
  description: string
  status: string
}

export interface GameSceneProjection {
  id: string
  title: string
  location_id: string
  location_name: string
  story_time: string
  objective: string
  present_character_ids: string[]
}

export interface GameSessionSummary {
  id: string
  story_pack_id: StoryPackId
  story_pack_version: StoryPackVersion
  story_title: string
  story_cover: string
  persona_name: string
  role_label: string
  status: SessionStatus
  version: number
  scene_title: string
  updated_at: string
  last_excerpt: string
}

export interface GameSessionSnapshot {
  schema_version: 'game-session@1.0'
  id: string
  story_pack_id: StoryPackId
  story_pack_version: StoryPackVersion
  status: SessionStatus
  version: number
  created_at: string
  updated_at: string
  persona: PlayerPersona
  scene: GameSceneProjection
  messages: GameMessage[]
  suggestions: SuggestedAction[]
  inventory: InventoryItemProjection[]
  journal: JournalEntryProjection[]
  characters: CharacterProjection[]
  locations: LocationProjection[]
}

export interface CreateGameSessionRequest {
  schema_version: 'session-create@1.0'
  story_pack_id: StoryPackId
  persona: PlayerPersonaInput
}

export interface CreateGameSessionResponse {
  schema_version: 'session-created@1.0'
  session: GameSessionSnapshot
}

export interface ListGameSessionsResponse {
  schema_version: 'session-list@1.0'
  sessions: GameSessionSummary[]
}

export interface GetGameSessionResponse {
  schema_version: 'session-snapshot@1.0'
  session: GameSessionSnapshot
  started_sessions: GameSessionSummary[]
}

export interface GameTurnCommand {
  schema_version: 'turn-command@1.0'
  session_id: string
  idempotency_key: string
  expected_session_version: number
  mode: StoryMode
  text: string
  selected_target_ids: string[]
  selected_item_ids: string[]
  selected_journal_entry_ids: string[]
  selected_suggestion_id: string | null
}

export interface GameTurnResponse {
  schema_version: 'turn-response@1.0'
  request_id: string
  turn_id: string
  session_id: string
  session_version: number
  replayed: boolean
  model: string
  fallback_used: boolean
  advisory_used: boolean
  session: GameSessionSnapshot
}

export type InteractionToolName = 'inventory' | 'journal' | 'character' | 'world' | 'settings'

import type { GameMessage, InteractionToolName as SharedInteractionToolName } from '#shared/game'
import type { StoryMode } from '#shared/storypacks'

export type InteractionMode = StoryMode
export type InteractionFontScale = 'normal' | 'large' | 'xlarge'
export type InteractionStoryModel = 'deepseek' | 'aion'
export type InteractionToolName = SharedInteractionToolName
export type InteractionDrawer = 'threads' | null
export type InteractionMessageData = GameMessage

export interface InteractionTurnDraft {
  text: string
  mode: InteractionMode
  selectedSuggestionId: string | null
  selectedItemIds: string[]
  selectedJournalEntryIds: string[]
}

export interface InteractionQueuedTurn extends InteractionTurnDraft {
  id: string
}

export interface InteractionToolComposePayload {
  text?: string
  itemId?: string
  journalEntryId?: string
}

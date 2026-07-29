import type { GameMessage, InteractionToolName as SharedInteractionToolName } from '#shared/game'
import type { StoryMode } from '#shared/storypacks'

export type InteractionMode = StoryMode
export type InteractionFontScale = 'normal' | 'large' | 'xlarge'
export type InteractionToolName = SharedInteractionToolName
export type InteractionDrawer = 'threads' | null
export type InteractionMessageData = GameMessage

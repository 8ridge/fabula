import type { interactionConfig } from '~/data/interaction'

export type InteractionStoryId = keyof typeof interactionConfig.storyPacks
export type InteractionStory = (typeof interactionConfig.storyPacks)[InteractionStoryId]
export type InteractionTheme = (typeof interactionConfig.themes)[keyof typeof interactionConfig.themes]
export type InteractionMode = 'action' | 'speech' | 'exploration'
export type InteractionFontScale = 'normal' | 'large' | 'xlarge'
export type InteractionToolName = 'models' | 'inventory' | 'journal' | 'character' | 'check' | 'settings'
export type InteractionDrawer = 'threads' | 'details' | null

export type InteractionMessageData = {
  id?: string
  type: 'narrator' | 'character' | 'player'
  name: string
  meta: string
  text: string
  foot: string
  pending?: boolean
}

export type AiCatalog = {
  available?: boolean
  modules?: Array<{
    id: string
    model_id?: string
    enabled?: boolean
    route_available?: boolean
    blocked_reason?: string | null
    internal_only?: boolean
  }>
}

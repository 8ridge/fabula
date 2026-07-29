import type { interactionConfig } from '~/data/interaction'

export type HubScreenName = 'home' | 'packs' | 'inventory' | 'profile'
export type HubStoryId = keyof typeof interactionConfig.storyPacks
export type HubStory = (typeof interactionConfig.storyPacks)[HubStoryId]
export type HubToolName = 'inventory' | 'journal' | 'check' | 'character' | 'settings'
export type HubSheetView = 'story' | HubToolName | null

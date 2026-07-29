import { describe, expect, test } from 'bun:test'
import { STORY_PACK_IDS, STORY_PACK_LIST } from '../../shared/storypacks'
import { ALLOWED_TURN_OPERATION_TYPES, STORY_PACK_CONTEXTS } from './storypack-context'

describe('canonical StoryPack catalog', () => {
  test('contains exactly the four approved beta packs pinned to 0.2', () => {
    expect(STORY_PACK_IDS).toEqual([
      'zero-line',
      'ashes-of-capua',
      'zero-citizen',
      'eighth-seal',
    ])
    expect(STORY_PACK_LIST.map(pack => pack.version)).toEqual(['0.2', '0.2', '0.2', '0.2'])
    expect(new Set(STORY_PACK_LIST.map(pack => pack.id)).size).toBe(4)
  })

  test('maps every runtime pack to a real source file and compiled overlay', async () => {
    for (const storyPackId of STORY_PACK_IDS) {
      const context = STORY_PACK_CONTEXTS[storyPackId]
      const source = await Bun.file(new URL(
        `../../deliverables/PWA_AI_PRESENTATION_KIT/storypacks/${context.sourceFile}`,
        import.meta.url,
      )).text()
      expect(source.length).toBeGreaterThan(5_000)
      expect(context.promptOverlay).toContain(`PACK_ID: ${storyPackId}`)
      expect(context.promptOverlayVersion).toBe(`${storyPackId}-overlay@0.2`)
      expect(context.hardCanon.length).toBeGreaterThanOrEqual(4)
    }
  })

  test('publishes a closed beta operation catalog', () => {
    expect(ALLOWED_TURN_OPERATION_TYPES).toEqual([
      'event.create',
      'scene.transition',
      'scene.update_presence',
      'fact.create',
      'knowledge.grant',
      'inventory.create_instance',
      'inventory.transfer_custody',
      'inventory.transfer_ownership',
      'inventory.consume',
    ])
  })
})

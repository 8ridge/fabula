import { describe, expect, test } from 'bun:test'
import { STORY_PACKS } from '../../shared/storypacks'
import type { StoryPackId } from '../../shared/storypacks'
import { getStoryPackContext } from './storypack-context'
import { compileStoryPackSource } from './storypack-source'

const technicalIds: Record<StoryPackId, string> = {
  'zero-line': 'modern-zombie-velinsk@0.2',
  'ashes-of-capua': 'spartacus-road-from-capua@0.2',
  'zero-citizen': 'cyberpunk-zeroed-limb47@0.2',
  'eighth-seal': 'fantasy-eighth-seal@0.2',
}

describe('runtime StoryPack source', () => {
  for (const storyPackId of Object.keys(STORY_PACKS) as StoryPackId[]) {
    test(`compiles ${storyPackId} from its canonical deliverable`, async () => {
      const { sourceFile } = getStoryPackContext(storyPackId)
      const source = await Bun.file(
        new URL(`../../deliverables/PWA_AI_PRESENTATION_KIT/storypacks/${sourceFile}`, import.meta.url),
      ).text()

      const compiled = await compileStoryPackSource(storyPackId, sourceFile, source)

      expect(compiled.technicalPackId).toBe(technicalIds[storyPackId])
      expect(compiled.sourceHash).toMatch(/^sha256:[a-f0-9]{64}$/)
      expect(compiled.promptOverlay).toContain(`PACK_ID: ${technicalIds[storyPackId]}`)
      expect(compiled.hardCanon.length).toBeGreaterThanOrEqual(5)
      expect(compiled.canonicalCore).toContain('Сюжет по восьми актам')
      expect(compiled.canonicalCore).not.toContain('Pack overlay для текстовых моделей')
    })
  }
})

import { describe, expect, test } from 'bun:test'
import { AI_MODULES } from './catalog'
import { PROMPT_SOURCE_FILES } from './prompt-files'
import { firstFencedBlock, rulesOnly } from './prompt-utils'

describe('prompt contract stripping', () => {
  test('removes a Cyrillic legacy output skeleton before the canonical override', () => {
    const source = [
      'ПРАВИЛА:',
      '- не меняй канон',
      '',
      'ВЕРНИ ТОЛЬКО JSON:',
      '{"plan_version":"scene-plan@0.2"}',
    ].join('\n')
    const stripped = rulesOnly(source)

    expect(stripped).toContain('не меняй канон')
    expect(stripped).not.toContain('scene-plan@0.2')
    expect(stripped).not.toContain('ВЕРНИ ТОЛЬКО JSON')
  })

  test('supports an English OUTPUT marker without consuming ordinary rules', () => {
    const stripped = rulesOnly('RULES\nkeep facts\nOUTPUT:\n{"legacy":true}')
    expect(stripped).toBe('RULES\nkeep facts')
  })

  test('strips the legacy skeleton from the actual Nemotron kit prompt', async () => {
    const source = await Bun.file(new URL(
      '../../deliverables/PWA_AI_PRESENTATION_KIT/prompts/02_nemotron_scene_and_arc_planner.md',
      import.meta.url,
    )).text()
    const stripped = rulesOnly(firstFencedBlock(source))

    expect(stripped).not.toContain('scene-plan@0.2')
    expect(stripped).not.toContain('potential_media_trigger')
  })

  test('maps every server module to an existing prompt file', async () => {
    expect(Object.keys(PROMPT_SOURCE_FILES).sort()).toEqual(Object.keys(AI_MODULES).sort())
    for (const file of new Set(Object.values(PROMPT_SOURCE_FILES))) {
      const source = await Bun.file(new URL(
        `../../deliverables/PWA_AI_PRESENTATION_KIT/prompts/${file}`,
        import.meta.url,
      )).text()
      expect(source.length).toBeGreaterThan(100)
    }
  })
})

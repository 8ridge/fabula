import { describe, expect, test } from 'bun:test'
import { AI_MODELS, AI_MODULES } from './catalog'

describe('AI registry', () => {
  test('registers every model and prompt module from the kit', () => {
    expect(Object.keys(AI_MODELS)).toHaveLength(12)
    expect(Object.keys(AI_MODULES)).toHaveLength(17)
    expect(AI_MODULES['authoritative-turn'].modelId).toBe('deepseek')
    expect(AI_MODULES['exclusive-video-premium'].modelId).toBe('grok-video-premium')
    expect(AI_MODULES['pack-image'].modelId).toBe('krea-pack')
    expect(AI_MODULES['image-repair'].modelId).toBe('riverflow')
    expect(AI_MODULES['item-image'].modelId).toBe('recraft')
    expect(AI_MODULES['scene-plan-paid'].modelId).toBe('nemotron-paid')
  })

  test('keeps premium and advisory routes independently gated', () => {
    expect(AI_MODULES['scene-plan'].gate).toBe('nemotron')
    expect(AI_MODULES['scene-plan-paid'].gate).toBe('nemotron-paid')
    expect(AI_MODULES.narration.gate).toBe('aion')
    expect(AI_MODULES['hero-image'].gate).toBe('premium-media')
  })

  test('marks authoritative prompt fragments as internal-only', () => {
    expect(AI_MODULES.inventory.standalone).toBe(false)
    expect(AI_MODULES['action-tracker'].standalone).toBe(false)
    expect('standalone' in AI_MODULES['turn-qa']).toBe(false)
    expect(AI_MODULES['world-compiler'].disabledReason).toBe('FIXED_STORYPACK_SCHEMA_REQUIRED')
    expect(AI_MODULES.narration.disabledReason).toBe('AION_ZDR_ENDPOINT_UNAVAILABLE')
  })

  test('defines an explicit fallback policy for every route', () => {
    for (const module of Object.values(AI_MODULES))
      expect(module.fallbackPolicy.length).toBeGreaterThan(0)
  })
})

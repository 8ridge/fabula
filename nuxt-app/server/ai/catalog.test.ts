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

  test('does not hide available modules behind runtime feature flags', () => {
    for (const module of Object.values(AI_MODULES)) {
      expect('gate' in module).toBe(false)
      expect(module.fallbackPolicy).not.toContain('when-enabled')
    }
    expect(AI_MODULES['scene-plan'].fallbackModelId).toBe('nemotron-paid')
  })

  test('defines fail-closed media price ceilings in the server catalog', () => {
    for (const module of Object.values(AI_MODULES)) {
      if (module.kind === 'image') {
        expect(module.maxPrice?.image).toBeGreaterThan(0)
        expect(module.estimatedMaxCostUsd).toBeLessThanOrEqual(module.maxPrice?.image || 0)
      }
      if (module.kind === 'video') {
        expect(module.maxPrice?.request).toBeGreaterThan(0)
        expect(module.estimatedMaxCostUsd).toBeLessThanOrEqual(module.maxPrice?.request || 0)
      }
    }
  })

  test('marks authoritative prompt fragments as internal-only', () => {
    expect(AI_MODULES.inventory.standalone).toBe(false)
    expect(AI_MODULES['action-tracker'].standalone).toBe(false)
    expect('standalone' in AI_MODULES['turn-qa']).toBe(false)
    expect(AI_MODULES['world-compiler'].disabledReason).toBe('FIXED_STORYPACK_SCHEMA_REQUIRED')
    expect(AI_MODULES.narration.disabledReason).toBe('AION_ZDR_ENDPOINT_UNAVAILABLE')
    expect(AI_MODULES['exclusive-video'].disabledReason)
      .toBe('VIDEO_REQUIRES_DURABLE_IDEMPOTENCY_AND_HTTPS_ASSET_ORIGIN')
  })

  test('defines an explicit fallback policy for every route', () => {
    for (const module of Object.values(AI_MODULES))
      expect(module.fallbackPolicy.length).toBeGreaterThan(0)
  })
})

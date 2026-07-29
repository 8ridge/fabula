import { describe, expect, test } from 'bun:test'
import { AI_MODELS, AI_MODULES } from './catalog'

describe('AI registry', () => {
  test('registers every model and prompt module from the kit', () => {
    expect(Object.keys(AI_MODELS)).toHaveLength(9)
    expect(Object.keys(AI_MODULES)).toHaveLength(13)
    expect(AI_MODULES['authoritative-turn'].modelId).toBe('deepseek')
    expect(AI_MODULES['exclusive-video-premium'].modelId).toBe('grok-video-premium')
  })

  test('keeps premium and advisory routes independently gated', () => {
    expect(AI_MODULES['scene-plan'].gate).toBe('nemotron')
    expect(AI_MODULES.narration.gate).toBe('aion')
    expect(AI_MODULES['hero-image'].gate).toBe('premium-media')
  })

  test('marks authoritative prompt fragments as internal-only', () => {
    expect(AI_MODULES.inventory.standalone).toBe(false)
    expect(AI_MODULES['action-tracker'].standalone).toBe(false)
    expect('standalone' in AI_MODULES['turn-qa']).toBe(false)
  })
})

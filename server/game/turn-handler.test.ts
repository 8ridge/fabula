import { describe, expect, test } from 'bun:test'
import { FabulaApiError } from '../ai/http'
import { resolveDevStoryModel } from './dev-story-model'

describe('dev story model routing', () => {
  test('keeps DeepSeek as the default in every runtime', () => {
    expect(resolveDevStoryModel(undefined, false)).toBe('deepseek')
    expect(resolveDevStoryModel(undefined, true)).toBe('deepseek')
  })

  test('allows Aion only in dev mode', () => {
    expect(resolveDevStoryModel('aion', true)).toBe('aion')

    let thrown: unknown
    try {
      resolveDevStoryModel('aion', false)
    }
    catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(FabulaApiError)
    expect((thrown as FabulaApiError).code).toBe('DEV_MODEL_OVERRIDE_FORBIDDEN')
  })

  test('rejects unknown dev model slugs', () => {
    expect(() => resolveDevStoryModel('unknown', true)).toThrow('Неизвестная dev-модель сюжета.')
  })
})

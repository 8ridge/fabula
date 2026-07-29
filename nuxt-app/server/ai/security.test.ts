import { describe, expect, test } from 'bun:test'
import { FabulaApiError } from './http'
import { sanitizeNemotronPayload } from './security'

describe('Nemotron privacy projection', () => {
  test('keeps only server allowlisted aggregate fields', () => {
    const sanitized = sanitizeNemotronPayload({
      story_pack_id: 'eighth-seal',
      scene_id: 'scene:1',
      recent_outcome_bands: ['failure', 'partial_success'],
      player_text: 'raw player input',
      account_email: 'hidden@example.com',
    })
    expect(sanitized).toEqual({
      story_pack_id: 'eighth-seal',
      scene_id: 'scene:1',
      recent_outcome_bands: ['failure', 'partial_success'],
    })
  })

  test('rejects PII-like values even inside allowed fields', () => {
    expect(() => sanitizeNemotronPayload({
      active_threads: ['write me at hidden@example.com'],
    })).toThrow(FabulaApiError)
  })
})

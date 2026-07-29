import { describe, expect, test } from 'bun:test'
import { resolveAiConfig } from './config'
import { FabulaApiError } from './http'
import { assertAiConfigured, assertApprovedAssetUrls, sanitizeNemotronPayload } from './security'

describe('Nemotron privacy projection', () => {
  test('requires only the server OpenRouter key to make AI available', () => {
    expect(() => assertAiConfigured(resolveAiConfig({
      openrouterApiKey: 'test-key-never-log',
      fabulaAiEnabled: false,
      fabulaAiAllowUnauthenticated: false,
    }))).not.toThrow()
    expect(() => assertAiConfigured(resolveAiConfig({}))).toThrow(FabulaApiError)
  })

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

  test('accepts only HTTPS references from the configured asset origin', () => {
    const config = resolveAiConfig({
      openrouterSiteUrl: 'https://fabula.example/app',
    })
    expect(assertApprovedAssetUrls(
      ['https://fabula.example/assets/frame.jpg'],
      config,
      1,
      true,
    )).toEqual(['https://fabula.example/assets/frame.jpg'])
    expect(() => assertApprovedAssetUrls(
      ['https://external.example/frame.jpg'],
      config,
      1,
      true,
    )).toThrow(FabulaApiError)
  })
})

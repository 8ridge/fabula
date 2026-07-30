import { describe, expect, test } from 'bun:test'
import { resolveAiConfig } from './config'
import { FabulaApiError } from './http'
import {
  assertAiConfigured,
  assertApprovedAssetUrls,
  assertFreeModelPayloadSafe,
  sanitizeNemotronPayload,
} from './security'

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

  test('allows detailed fictional inventory context but rejects direct identifiers', () => {
    expect(() => assertFreeModelPayloadSafe({
      turn_id: 'turn:f816fa03-3052-49d9-9b67-51e2ae8c7881',
      player_input: { text: 'Взять бутылку в инвентарь' },
      journal_state: [{
        entry_id: 'journal:0d4d7d66-3f7b-4e6f-830e-3b65685da440',
      }],
      server_inventory: [{
        item_id: 'item:bottle',
        name: 'Бутылка',
        holder_id: 'entity:player',
      }],
    })).not.toThrow()

    expect(() => assertFreeModelPayloadSafe({
      player_input: { text: 'Напиши мне на hidden@example.com' },
    })).toThrow(FabulaApiError)

    expect(() => assertFreeModelPayloadSafe({
      player_input: { text: 'Позвони по номеру +7 (999) 123-45-67' },
    })).toThrow(FabulaApiError)
  })

  test('does not treat canonical turn UUIDs as phone numbers', () => {
    const turnId = 'turn:d5e54471-7159-4454-923c-cbff3dcaa6d8'

    expect(() => assertFreeModelPayloadSafe({
      player_input: { text: 'Я взял бутылку в инвентарь' },
      recent_turns: [{ turn_id: turnId }],
      confirmed_events: [{ source_turn_id: turnId }],
    })).not.toThrow()

    expect(() => assertFreeModelPayloadSafe({
      recent_turns: [{ turn_id: turnId }],
      player_input: { text: 'Позвони по номеру +7 (999) 123-45-67' },
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

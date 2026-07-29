export interface FabulaAiConfig {
  apiKey: string
  baseUrl: string
  siteUrl: string
  appName: string
  enabled: boolean
  allowUnauthenticated: boolean
  nemotronEnabled: boolean
  nemotronPaidEnabled: boolean
  aionEnabled: boolean
  mediaEnabled: boolean
  premiumMediaEnabled: boolean
  imageMaxCostUsd: number
  videoMaxCostUsd: number
  textTimeoutMs: number
  imageTimeoutMs: number
  videoSubmitTimeoutMs: number
  videoPollTimeoutMs: number
  requestsPerMinute: number
}

function envBoolean(value: unknown): boolean {
  return value === true || String(value).toLowerCase() === 'true'
}

function envNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function boundedNumber(value: unknown, fallback: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, envNumber(value, fallback)))
}

function openRouterBaseUrl(value: unknown): string {
  const normalized = String(value || 'https://openrouter.ai/api/v1').replace(/\/+$/, '')
  if (normalized !== 'https://openrouter.ai/api/v1')
    throw new Error('OPENROUTER_BASE_URL_REJECTED')
  return normalized
}

export function resolveAiConfig(runtimeConfig: Record<string, unknown>): FabulaAiConfig {
  return {
    apiKey: String(runtimeConfig.openrouterApiKey || ''),
    baseUrl: openRouterBaseUrl(runtimeConfig.openrouterBaseUrl),
    siteUrl: String(runtimeConfig.openrouterSiteUrl || ''),
    appName: String(runtimeConfig.openrouterAppName || 'Fabula'),
    enabled: envBoolean(runtimeConfig.fabulaAiEnabled),
    allowUnauthenticated: envBoolean(runtimeConfig.fabulaAiAllowUnauthenticated),
    nemotronEnabled: envBoolean(runtimeConfig.fabulaAiNemotronEnabled),
    nemotronPaidEnabled: envBoolean(runtimeConfig.fabulaAiNemotronPaidEnabled),
    aionEnabled: envBoolean(runtimeConfig.fabulaAiAionEnabled),
    mediaEnabled: envBoolean(runtimeConfig.fabulaAiMediaEnabled),
    premiumMediaEnabled: envBoolean(runtimeConfig.fabulaAiPremiumMediaEnabled),
    imageMaxCostUsd: boundedNumber(runtimeConfig.fabulaAiImageMaxCostUsd, 0, 0, 1),
    videoMaxCostUsd: boundedNumber(runtimeConfig.fabulaAiVideoMaxCostUsd, 0, 0, 5),
    textTimeoutMs: boundedNumber(runtimeConfig.fabulaAiTextTimeoutMs, 180_000, 5_000, 300_000),
    imageTimeoutMs: boundedNumber(runtimeConfig.fabulaAiImageTimeoutMs, 120_000, 10_000, 300_000),
    videoSubmitTimeoutMs: boundedNumber(runtimeConfig.fabulaAiVideoSubmitTimeoutMs, 30_000, 5_000, 120_000),
    videoPollTimeoutMs: boundedNumber(runtimeConfig.fabulaAiVideoPollTimeoutMs, 20_000, 5_000, 120_000),
    requestsPerMinute: boundedNumber(runtimeConfig.fabulaAiRequestsPerMinute, 8, 1, 60),
  }
}

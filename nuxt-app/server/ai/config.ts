export interface FabulaAiConfig {
  apiKey: string
  baseUrl: string
  siteUrl: string
  appName: string
  enabled: boolean
  allowUnauthenticated: boolean
  nemotronEnabled: boolean
  aionEnabled: boolean
  mediaEnabled: boolean
  premiumMediaEnabled: boolean
  requestsPerMinute: number
}

function envBoolean(value: unknown): boolean {
  return value === true || String(value).toLowerCase() === 'true'
}

function envNumber(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function resolveAiConfig(runtimeConfig: Record<string, unknown>): FabulaAiConfig {
  return {
    apiKey: String(runtimeConfig.openrouterApiKey || ''),
    baseUrl: String(runtimeConfig.openrouterBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/+$/, ''),
    siteUrl: String(runtimeConfig.openrouterSiteUrl || ''),
    appName: String(runtimeConfig.openrouterAppName || 'Fabula'),
    enabled: envBoolean(runtimeConfig.fabulaAiEnabled),
    allowUnauthenticated: envBoolean(runtimeConfig.fabulaAiAllowUnauthenticated),
    nemotronEnabled: envBoolean(runtimeConfig.fabulaAiNemotronEnabled),
    aionEnabled: envBoolean(runtimeConfig.fabulaAiAionEnabled),
    mediaEnabled: envBoolean(runtimeConfig.fabulaAiMediaEnabled),
    premiumMediaEnabled: envBoolean(runtimeConfig.fabulaAiPremiumMediaEnabled),
    requestsPerMinute: Math.max(1, Math.min(60, envNumber(runtimeConfig.fabulaAiRequestsPerMinute, 8))),
  }
}

export interface FabulaAiConfig {
  apiKey: string
  baseUrl: string
  siteUrl: string
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
  }
}

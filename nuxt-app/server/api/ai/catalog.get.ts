import { setHeader } from 'h3'
import { AI_MODELS, AI_MODULES } from '../../ai/catalog'
import type { AiModuleDefinition } from '../../ai/catalog'
import { resolveAiConfig } from '../../ai/config'

export default defineEventHandler((event) => {
  const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
  const previewAvailable = config.enabled && config.allowUnauthenticated && Boolean(config.apiKey)
  setHeader(event, 'Cache-Control', 'no-store')
  return {
    schema_version: 'ai-catalog@1.0',
    provider: 'OpenRouter',
    configured: Boolean(config.apiKey),
    enabled: config.enabled,
    public_access: config.allowUnauthenticated,
    preview_only: true,
    persistence: 'process_memory',
    idempotency: 'process_memory_24h',
    media_cost_ceiling_usd: {
      image: config.imageMaxCostUsd,
      video: config.videoMaxCostUsd,
    },
    models: Object.values(AI_MODELS).map(model => ({
      id: model.id,
      label: model.label,
      slug: model.slug,
      role: model.role,
      modality: model.modality,
      json_mode: model.jsonMode,
    })),
    modules: Object.values(AI_MODULES).map((definition) => {
      const module = definition as AiModuleDefinition
      const invokable = module.id !== 'authoritative-turn'
        && module.standalone !== false
        && !module.disabledReason
      const gateEnabled = module.gate === 'core'
        ? previewAvailable
        : module.gate === 'nemotron'
          ? previewAvailable && config.nemotronEnabled
          : module.gate === 'nemotron-paid'
            ? previewAvailable && config.nemotronPaidEnabled
            : module.gate === 'aion'
              ? previewAvailable && config.aionEnabled
              : module.gate === 'media'
                ? previewAvailable && config.mediaEnabled
                : previewAvailable && config.mediaEnabled && config.premiumMediaEnabled
      const budgetEnabled = module.kind === 'image'
        ? config.imageMaxCostUsd > 0
        : module.kind === 'video'
          ? config.videoMaxCostUsd > 0
          : true
      return {
        id: module.id,
        prompt_number: module.promptNumber,
        title: module.title,
        model_id: module.modelId,
        kind: module.kind,
        feature_flag: module.gate,
        target_contract: module.contract,
        response_contract: module.kind === 'image'
            ? 'media-preview-result@1.0'
            : module.kind === 'video'
              ? 'media-preview-job@1.0'
              : module.contract,
        validation: module.kind === 'text' ? 'strict_server_contract' : 'provider_shape_and_price_preflight',
        internal_only: !invokable,
        invokable,
        enabled: invokable && gateEnabled && budgetEnabled,
        fallback_model_id: module.fallbackModelId || null,
        fallback_policy: module.fallbackPolicy,
        blocked_reason: module.disabledReason
          || (!budgetEnabled && module.kind !== 'text' ? 'MEDIA_BUDGET_DISABLED' : null),
      }
    }),
  }
})

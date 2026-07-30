import { setHeader } from 'h3'
import { AI_MODELS, AI_MODULES } from '../../ai/catalog'
import type { AiModuleDefinition } from '../../ai/catalog'
import { resolveAiConfig } from '../../ai/config'

export default defineEventHandler((event) => {
  const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
  const available = Boolean(config.apiKey)
  setHeader(event, 'Cache-Control', 'no-store')
  return {
    schema_version: 'ai-catalog@1.0',
    provider: 'OpenRouter',
    configured: available,
    available,
    access: 'same-origin-rate-limited',
    preview_only: true,
    persistence: 'process_memory',
    idempotency: 'process_memory_24h',
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
      const costCeilingUsd = module.kind === 'image'
        ? module.maxPrice?.image
        : module.kind === 'video'
          ? module.maxPrice?.request
          : undefined
      return {
        id: module.id,
        prompt_number: module.promptNumber,
        title: module.title,
        model_id: module.modelId,
        kind: module.kind,
        target_contract: module.contract,
        response_contract: module.kind === 'image'
            ? 'media-preview-result@1.0'
            : module.kind === 'video'
              ? 'media-preview-job@1.0'
              : module.contract,
        validation: module.kind === 'text' ? 'strict_server_contract' : 'provider_shape_and_price_preflight',
        internal_only: !invokable,
        invokable,
        route_available: available && !module.disabledReason,
        enabled: available && invokable,
        cost_ceiling_usd: costCeilingUsd || null,
        fallback_model_id: module.fallbackModelId || null,
        dev_alternative_model_id: module.devAlternativeModelId || null,
        fallback_policy: module.fallbackPolicy,
        blocked_reason: module.disabledReason || (!available ? 'OPENROUTER_KEY_REQUIRED' : null),
      }
    }),
  }
})

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
    models: Object.values(AI_MODELS).map(model => ({
      id: model.id,
      label: model.label,
      slug: model.slug,
      role: model.role,
      modality: model.modality,
    })),
    modules: Object.values(AI_MODULES).map((definition) => {
      const module = definition as AiModuleDefinition
      const invokable = module.standalone !== false
      return {
        id: module.id,
        title: module.title,
        model_id: module.modelId,
        kind: module.kind,
        target_contract: module.contract,
        response_contract: module.kind === 'text'
          ? 'unvalidated-model-json@1.0'
          : module.kind === 'image'
            ? 'media-preview-result@1.0'
            : 'media-preview-job@1.0',
        validation: module.kind === 'text' ? 'json_syntax_only' : 'provider_shape_only',
        internal_only: !invokable,
        invokable,
        enabled: invokable && (module.gate === 'core'
          ? previewAvailable
          : module.gate === 'nemotron'
            ? previewAvailable && config.nemotronEnabled
            : module.gate === 'aion'
              ? previewAvailable && config.aionEnabled
              : module.gate === 'media'
                ? previewAvailable && config.mediaEnabled
                : previewAvailable && config.mediaEnabled && config.premiumMediaEnabled),
      }
    }),
  }
})

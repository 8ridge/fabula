import { getAiModel, getAiModule } from './catalog'
import type { AiModuleId } from './catalog'
import type { FabulaAiConfig } from './config'
import type { ModuleRequest } from './contracts'
import { FabulaApiError } from './http'
import { OpenRouterClient } from './openrouter'
import { assertApprovedStillUrl, assertModuleGate, sanitizeNemotronPayload } from './security'
import { rememberVideoJob } from './video-jobs'

const IMAGE_ASPECT_RATIOS = new Set(['1:1', '4:3', '3:2', '16:9', '4:5', '2:3', '9:16'])
const IMAGE_RESOLUTIONS = new Set(['1K'])
const VIDEO_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'])
const VIDEO_RESOLUTIONS = new Set(['480p', '720p'])
type PromptLoader = (moduleId: AiModuleId) => Promise<string>

export class AiModuleService {
  private readonly config: FabulaAiConfig
  private readonly client: OpenRouterClient
  private readonly promptLoader: PromptLoader

  constructor(
    config: FabulaAiConfig,
    client = new OpenRouterClient(config),
    promptLoader: PromptLoader = async moduleId => (await import('./prompts')).getSystemPrompt(moduleId),
  ) {
    this.config = config
    this.client = client
    this.promptLoader = promptLoader
  }

  async invoke(moduleId: string, request: ModuleRequest) {
    const module = getAiModule(moduleId)
    if (!module)
      throw new FabulaApiError('MODULE_NOT_FOUND', 'Неизвестный AI-модуль.', 404)
    if (module.id === 'authoritative-turn') {
      throw new FabulaApiError(
        'USE_TURN_ENDPOINT',
        'Авторитетный ход доступен только через /api/ai/turn.',
        409,
      )
    }
    if (module.standalone === false) {
      throw new FabulaApiError(
        'TURN_FRAGMENT_ONLY',
        'Этот prompt-фрагмент выполняется только внутри авторитетного хода.',
        409,
      )
    }
    assertModuleGate(module, this.config)
    const model = getAiModel(module.modelId)

    if (module.kind === 'text') {
      const payload = module.gate === 'nemotron'
        ? sanitizeNemotronPayload(request.payload)
        : request.payload
      const result = await this.client.chatJson({
        model: model.slug,
        system: await this.promptLoader(module.id as AiModuleId),
        payload,
        maxOutputTokens: module.maxOutputTokens || 2000,
        maxPrice: module.maxPrice,
        sanitizedFreeEndpoint: module.gate === 'nemotron',
      })
      return {
        schema_version: 'ai-module-response@1.0',
        request_id: request.request_id,
        module: module.id,
        contract: 'unvalidated-model-json@1.0',
        target_contract: module.contract,
        validation: 'json_syntax_only',
        authority: 'non_authoritative',
        model: result.model,
        status: 'preview_raw',
        output: result.output,
        usage: result.usage,
        provider_request_id: result.requestId,
      }
    }

    const prompt = await (await import('./prompts')).renderMediaPrompt(
      module.id as 'scene-image' | 'hero-image' | 'exclusive-video' | 'exclusive-video-premium',
      request.template_variables,
    )
    if (module.kind === 'image') {
      const aspectRatio = enumValue(request.payload.aspect_ratio, IMAGE_ASPECT_RATIOS, 'aspect_ratio', '16:9')
      const resolution = enumValue(request.payload.resolution, IMAGE_RESOLUTIONS, 'resolution', '1K')
      const result = await this.client.generateImage({
        model: model.slug,
        prompt,
        aspectRatio,
        resolution,
        maxPrice: module.maxPrice?.image,
      })
      return {
        schema_version: 'ai-module-response@1.0',
        request_id: request.request_id,
        module: module.id,
        contract: 'media-preview-result@1.0',
        target_contract: module.contract,
        validation: 'provider_shape_only',
        persistence: 'none',
        authority: 'non_authoritative',
        model: result.model,
        status: 'ready',
        output: { images: result.images },
        usage: result.usage,
        provider_request_id: result.requestId,
      }
    }

    const duration = integerValue(request.payload.duration_seconds, 'duration_seconds', 3, 5, 4)
    const aspectRatio = enumValue(request.payload.aspect_ratio, VIDEO_ASPECT_RATIOS, 'aspect_ratio', '16:9')
    const resolution = enumValue(request.payload.resolution, VIDEO_RESOLUTIONS, 'resolution', '720p')
    const approvedStillUrl = assertApprovedStillUrl(request.payload.approved_still_url, this.config)
    const result = await this.client.submitVideo({
      model: model.slug,
      prompt,
      duration,
      aspectRatio,
      resolution,
      approvedStillUrl,
    })
    rememberVideoJob(result.id, request.request_id, model.slug)
    return {
      schema_version: 'ai-module-response@1.0',
      request_id: request.request_id,
      module: module.id,
      contract: 'media-preview-job@1.0',
      target_contract: module.contract,
      validation: 'provider_shape_only',
      persistence: 'process_memory',
      authority: 'non_authoritative',
      model: model.slug,
      status: 'pending',
      output: {
        job_id: result.id,
        status: result.status,
        polling_path: `/api/ai/video/${encodeURIComponent(result.id)}`,
      },
      usage: result.usage,
      provider_request_id: result.generationId,
    }
  }
}

function enumValue(value: unknown, allowed: Set<string>, field: string, fallback: string): string {
  const resolved = value === undefined ? fallback : value
  if (typeof resolved !== 'string' || !allowed.has(resolved))
    throw new FabulaApiError('INVALID_MODULE_OPTION', `Некорректный ${field}.`, 422, false, [`$.payload.${field}`])
  return resolved
}

function integerValue(value: unknown, field: string, min: number, max: number, fallback: number): number {
  const resolved = value === undefined ? fallback : value
  if (!Number.isInteger(resolved) || Number(resolved) < min || Number(resolved) > max)
    throw new FabulaApiError('INVALID_MODULE_OPTION', `Некорректный ${field}.`, 422, false, [`$.payload.${field}`])
  return Number(resolved)
}

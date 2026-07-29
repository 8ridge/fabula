import { getAiModel, getAiModule } from './catalog'
import type { AiModuleId } from './catalog'
import type { FabulaAiConfig } from './config'
import { ContractError } from './contracts'
import type { JsonValue, ModuleRequest } from './contracts'
import { AiExecutionError, FabulaApiError } from './http'
import type { SafeModelRun } from './http'
import { OpenRouterClient, OpenRouterError } from './openrouter'
import type { MediaModuleId } from './prompts'
import { assertApprovedAssetUrls, assertApprovedStillUrl, sanitizeNemotronPayload } from './security'
import { getStandaloneContract, parseStandaloneOutput } from './standalone-contracts'
import { rememberVideoJob } from './video-jobs'

const VIDEO_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'])
const VIDEO_RESOLUTIONS = new Set(['480p', '720p'])
type PromptLoader = (moduleId: AiModuleId) => Promise<string>
const IMAGE_CAPABILITIES: Record<string, {
  providerSlug: string
  aspectRatios: Set<string>
  resolutions: Set<string> | null
  defaultResolution?: string
  outputFormat?: 'jpeg'
  background?: 'auto'
}> = {
  'krea/krea-2-medium-turbo': {
    providerSlug: 'krea',
    aspectRatios: new Set(['1:1', '4:3', '3:2', '16:9', '4:5', '2:3', '9:16']),
    resolutions: new Set(['1K']),
    defaultResolution: '1K',
  },
  'krea/krea-2-medium': {
    providerSlug: 'krea',
    aspectRatios: new Set(['1:1', '4:3', '3:2', '16:9', '4:5', '2:3', '9:16']),
    resolutions: new Set(['1K']),
    defaultResolution: '1K',
  },
  'krea/krea-2-large': {
    providerSlug: 'krea',
    aspectRatios: new Set(['1:1', '4:3', '3:2', '16:9', '4:5', '2:3', '9:16']),
    resolutions: new Set(['1K']),
    defaultResolution: '1K',
  },
  'sourceful/riverflow-v2.5-fast': {
    providerSlug: 'sourceful',
    aspectRatios: new Set(['1:1', '4:3', '3:4', '3:2', '2:3', '16:9', '9:16', '21:9', 'auto']),
    resolutions: new Set(['1K', '2K']),
    defaultResolution: '1K',
    outputFormat: 'jpeg',
    background: 'auto',
  },
  'recraft/recraft-v4.1-utility': {
    providerSlug: 'recraft',
    aspectRatios: new Set(['1:1', '4:3', '3:4', '16:9', '9:16', 'auto']),
    resolutions: null,
  },
}

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
    if (module.disabledReason) {
      throw new FabulaApiError(
        'MODULE_RUNTIME_BLOCKED',
        'Модуль честно отключен до выполнения обязательных условий.',
        503,
        false,
        [module.disabledReason],
      )
    }
    if (module.standalone === false) {
      throw new FabulaApiError(
        'TURN_FRAGMENT_ONLY',
        'Этот prompt-фрагмент выполняется только внутри авторитетного хода.',
        409,
      )
    }
    const model = getAiModel(module.modelId)

    if (module.kind === 'text') {
      if (module.id === 'turn-qa' && request.payload.mode !== 'CANON_AUDIT') {
        throw new FabulaApiError(
          'QA_MODE_REQUIRED',
          'Standalone-модуль Mistral разрешает только неавторитетный режим CANON_AUDIT.',
          422,
        )
      }
      const payload = module.modelId === 'nemotron-free' || module.modelId === 'nemotron-paid'
        ? sanitizeNemotronPayload(request.payload)
        : request.payload
      const result = await this.invokeTextWithFallback(module.id as AiModuleId, payload)
      return {
        schema_version: 'ai-module-response@1.0',
        request_id: request.request_id,
        module: module.id,
        contract: module.contract,
        target_contract: module.contract,
        validation: 'strict_server_contract',
        authority: 'non_authoritative',
        model: result.model,
        fallback_used: result.fallbackUsed,
        attempted_models: result.attemptedModels,
        model_runs: result.modelRuns,
        status: 'ready',
        output: result.output,
        usage: result.usage,
        provider_request_id: result.requestId,
      }
    }

    if (module.kind === 'image') {
      const maxCostUsd = moduleCostCeiling(module, 'image')
      const capabilities = IMAGE_CAPABILITIES[model.slug]
      if (!capabilities)
        throw new FabulaApiError('IMAGE_CAPABILITIES_UNKNOWN', 'Для image route не настроены проверяемые параметры.', 503)
      const aspectRatio = enumValue(request.payload.aspect_ratio, capabilities.aspectRatios, 'aspect_ratio', '16:9')
      const resolution = optionalEnumValue(
        request.payload.resolution,
        capabilities.resolutions,
        'resolution',
        capabilities.defaultResolution,
      )
      const inputReferences = assertApprovedAssetUrls(
        request.payload.approved_reference_urls,
        this.config,
        module.maxInputReferences || 0,
        module.requiresInputReference === true,
      )
      const prompt = await (await import('./prompts')).renderMediaPrompt(
        module.id as MediaModuleId,
        {
          ...request.template_variables,
          aspect_ratio: aspectRatio,
          output_format: capabilities.outputFormat || 'provider default',
        },
      )
      const result = await this.client.generateImage({
        model: model.slug,
        prompt,
        aspectRatio,
        resolution,
        inputReferences,
        outputFormat: capabilities.outputFormat,
        background: capabilities.background,
        providerSlug: capabilities.providerSlug,
        maxCostUsd,
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
        output: {
          images: result.images,
          estimated_cost_usd: result.estimatedCostUsd,
          server_cost_ceiling_usd: maxCostUsd,
        },
        usage: result.usage,
        provider_request_id: result.requestId,
      }
    }

    const duration = integerValue(request.payload.duration_seconds, 'duration_seconds', 3, 5, 3)
    const aspectRatio = enumValue(request.payload.aspect_ratio, VIDEO_ASPECT_RATIOS, 'aspect_ratio', '16:9')
    const resolution = enumValue(request.payload.resolution, VIDEO_RESOLUTIONS, 'resolution', '480p')
    const approvedStillUrl = assertApprovedStillUrl(request.payload.approved_still_url, this.config)
    const maxCostUsd = moduleCostCeiling(module, 'video')
    const prompt = await (await import('./prompts')).renderMediaPrompt(
      module.id as MediaModuleId,
      {
        ...request.template_variables,
        '3_to_5_seconds': `${duration} seconds`,
        end_minus_1: Math.max(1, duration - 1),
      },
    )
    const result = await this.client.submitVideo({
      model: model.slug,
      prompt,
      duration,
      aspectRatio: model.slug === 'x-ai/grok-imagine-video-1.5' ? undefined : aspectRatio,
      resolution,
      approvedStillUrl,
      maxCostUsd,
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
        estimated_cost_usd: result.estimatedCostUsd,
      },
      usage: result.usage,
      provider_request_id: result.generationId,
    }
  }

  private async invokeTextWithFallback(moduleId: AiModuleId, payload: Record<string, JsonValue>) {
    const module = getAiModule(moduleId)
    if (!module)
      throw new FabulaApiError('MODULE_NOT_FOUND', 'Неизвестный AI-модуль.', 404)
    const candidates = [getAiModel(module.modelId)]
    if (module.fallbackModelId)
      candidates.push(getAiModel(module.fallbackModelId))
    const contract = getStandaloneContract(moduleId)
    const modelRuns: SafeModelRun[] = []
    let lastError: unknown
    for (const [index, candidate] of candidates.entries()) {
      let result: Awaited<ReturnType<OpenRouterClient['chatJson']>> | null = null
      try {
        result = await this.client.chatJson({
          model: candidate.slug,
          system: await this.promptLoader(moduleId),
          payload,
          maxOutputTokens: module.maxOutputTokens || 2000,
          maxPrice: candidate.id === module.modelId
            ? module.maxPrice
            : textPriceCeiling(candidate.id),
          sanitizedFreeEndpoint: candidate.id === 'nemotron-free',
          jsonMode: candidate.jsonMode,
          schema: candidate.jsonMode === 'json-schema' ? contract : undefined,
        })
        const output = parseStandaloneOutput(moduleId, result.output)
        modelRuns.push({
          role: index === 0 ? 'primary' : 'fallback',
          model: result.model,
          request_id: result.requestId,
          usage: result.usage,
          status: 'accepted',
          error_code: null,
          validation_errors: [],
        })
        return {
          ...result,
          output,
          fallbackUsed: index > 0,
          attemptedModels: modelRuns.map(run => run.model),
          modelRuns,
        }
      }
      catch (error) {
        lastError = error
        modelRuns.push({
          role: index === 0 ? 'primary' : 'fallback',
          model: result?.model || openRouterModel(error) || candidate.slug,
          request_id: result?.requestId || openRouterRequestId(error),
          usage: result?.usage || openRouterUsage(error),
          status: 'discarded',
          error_code: safeModelErrorCode(error),
          validation_errors: safeValidationErrors(error),
        })
      }
    }
    throw new AiExecutionError(
      'MODEL_FALLBACK_EXHAUSTED',
      'Модуль не вернул ответ по строгому контракту.',
      modelRuns,
      lastError instanceof OpenRouterError && lastError.retryable,
    )
  }

}

function safeModelErrorCode(error: unknown): string {
  if (error instanceof ContractError || error instanceof OpenRouterError || error instanceof FabulaApiError)
    return error.code
  return 'UNKNOWN_MODEL_ERROR'
}

function safeValidationErrors(error: unknown): string[] {
  return error instanceof ContractError ? error.fieldErrors.slice(0, 20) : []
}

function openRouterModel(error: unknown): string | null {
  return error instanceof OpenRouterError ? error.upstreamModel : null
}

function openRouterRequestId(error: unknown): string | null {
  return error instanceof OpenRouterError ? error.upstreamRequestId : null
}

function openRouterUsage(error: unknown) {
  return error instanceof OpenRouterError ? error.upstreamUsage : null
}

function moduleCostCeiling(
  module: NonNullable<ReturnType<typeof getAiModule>>,
  kind: 'image' | 'video',
): number {
  const ceiling = kind === 'image' ? module.maxPrice?.image : module.maxPrice?.request
  const estimatedCost = module.estimatedMaxCostUsd || 0
  if (!ceiling || ceiling <= 0) {
    throw new FabulaApiError(
      'MEDIA_PRICE_CEILING_MISSING',
      `Для ${kind === 'image' ? 'image' : 'video'}-модуля не задан серверный предел стоимости.`,
      503,
    )
  }
  if (estimatedCost > ceiling) {
    throw new FabulaApiError(
      'MEDIA_PRICE_CEILING_INVALID',
      'Оценка стоимости превышает серверный предел модуля.',
      503,
    )
  }
  return ceiling
}

function enumValue(value: unknown, allowed: Set<string>, field: string, fallback: string): string {
  const resolved = value === undefined ? fallback : value
  if (typeof resolved !== 'string' || !allowed.has(resolved))
    throw new FabulaApiError('INVALID_MODULE_OPTION', `Некорректный ${field}.`, 422, false, [`$.payload.${field}`])
  return resolved
}

function optionalEnumValue(
  value: unknown,
  allowed: Set<string> | null,
  field: string,
  fallback?: string,
): string | undefined {
  if (allowed === null) {
    if (value !== undefined)
      throw new FabulaApiError('INVALID_MODULE_OPTION', `Параметр ${field} не поддерживается выбранной моделью.`, 422)
    return undefined
  }
  const defaultValue = fallback || allowed.values().next().value
  if (!defaultValue)
    throw new FabulaApiError('IMAGE_CAPABILITIES_UNKNOWN', 'Для image route не настроено значение по умолчанию.', 503)
  return enumValue(value, allowed, field, defaultValue)
}

function integerValue(value: unknown, field: string, min: number, max: number, fallback: number): number {
  const resolved = value === undefined ? fallback : value
  if (!Number.isInteger(resolved) || Number(resolved) < min || Number(resolved) > max)
    throw new FabulaApiError('INVALID_MODULE_OPTION', `Некорректный ${field}.`, 422, false, [`$.payload.${field}`])
  return Number(resolved)
}

function textPriceCeiling(modelId: string): { prompt?: number, completion?: number } {
  if (modelId === 'deepseek')
    return { prompt: 0.15, completion: 0.3 }
  if (modelId === 'mistral')
    return { prompt: 0.25, completion: 0.8 }
  if (modelId === 'nemotron-paid')
    return { prompt: 0.55, completion: 2.3 }
  throw new FabulaApiError('FALLBACK_PRICE_UNKNOWN', 'Для fallback-модели не настроен тарифный предел.', 503)
}

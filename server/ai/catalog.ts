export type AiModuleKind = 'text' | 'image' | 'video'
export type AiJsonMode = 'json-schema' | 'json-object' | 'tool-call' | 'prompt-only'

export interface AiModelDefinition {
  id: string
  label: string
  slug: string
  role: string
  modality: AiModuleKind
  jsonMode: AiJsonMode
}

export interface AiModuleDefinition {
  id: string
  promptNumber: string
  title: string
  modelId: string
  kind: AiModuleKind
  contract: string
  standalone?: boolean
  maxOutputTokens?: number
  maxPrice?: {
    prompt?: number
    completion?: number
    image?: number
    request?: number
  }
  estimatedMaxCostUsd?: number
  maxInputReferences?: number
  requiresInputReference?: boolean
  fallbackModelId?: string
  devAlternativeModelId?: string
  fallbackPolicy: string
  disabledReason?: string
}

export const AI_MODELS = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek V4 Flash',
    slug: 'deepseek/deepseek-v4-flash',
    role: 'Авторитетный ход и структурные модули',
    modality: 'text',
    jsonMode: 'json-schema',
  },
  nemotronFree: {
    id: 'nemotron-free',
    label: 'Nemotron 3 Ultra Free',
    slug: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    role: 'Инвентарь, предметы, планирование и директор сложности',
    modality: 'text',
    jsonMode: 'tool-call',
  },
  nemotronPaid: {
    id: 'nemotron-paid',
    label: 'Nemotron 3 Ultra',
    slug: 'nvidia/nemotron-3-ultra-550b-a55b',
    role: 'Платный fallback планировщика и инвентаря',
    modality: 'text',
    jsonMode: 'json-schema',
  },
  nemotronInventoryFallback: {
    id: 'nemotron-inventory-fallback',
    label: 'Nemotron 3 Super',
    slug: 'nvidia/nemotron-3-super-120b-a12b',
    role: 'Резервная предметная сверка',
    modality: 'text',
    jsonMode: 'json-schema',
  },
  aion: {
    id: 'aion',
    label: 'Aion 3.0 Mini',
    slug: 'aion-labs/aion-3.0-mini',
    role: 'Dev-альтернатива модели создания сюжета',
    modality: 'text',
    jsonMode: 'json-object',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral Small 4',
    slug: 'mistralai/mistral-small-2603',
    role: 'Журнал, персонажи, fallback хода и QA',
    modality: 'text',
    jsonMode: 'json-schema',
  },
  kreaScene: {
    id: 'krea-scene',
    label: 'Krea 2 Medium Turbo',
    slug: 'krea/krea-2-medium-turbo',
    role: 'Дешевый ключевой кадр',
    modality: 'image',
    jsonMode: 'prompt-only',
  },
  kreaHero: {
    id: 'krea-hero',
    label: 'Krea 2 Large',
    slug: 'krea/krea-2-large',
    role: 'Premium key art',
    modality: 'image',
    jsonMode: 'prompt-only',
  },
  kreaPack: {
    id: 'krea-pack',
    label: 'Krea 2 Medium',
    slug: 'krea/krea-2-medium',
    role: 'Визуальная библия, окружение и паковый арт',
    modality: 'image',
    jsonMode: 'prompt-only',
  },
  riverflow: {
    id: 'riverflow',
    label: 'Riverflow V2.5 Fast',
    slug: 'sourceful/riverflow-v2.5-fast',
    role: 'Ремонт и согласование изображений',
    modality: 'image',
    jsonMode: 'prompt-only',
  },
  recraft: {
    id: 'recraft',
    label: 'Recraft V4.1 Utility',
    slug: 'recraft/recraft-v4.1-utility',
    role: 'Предметные иконки и Premium item art',
    modality: 'image',
    jsonMode: 'prompt-only',
  },
  grokVideo: {
    id: 'grok-video',
    label: 'Grok Imagine Video',
    slug: 'x-ai/grok-imagine-video',
    role: 'Эксклюзивное видео',
    modality: 'video',
    jsonMode: 'prompt-only',
  },
  grokVideoPremium: {
    id: 'grok-video-premium',
    label: 'Grok Imagine Video 1.5',
    slug: 'x-ai/grok-imagine-video-1.5',
    role: 'Premium-видео кульминации',
    modality: 'video',
    jsonMode: 'prompt-only',
  },
} as const satisfies Record<string, AiModelDefinition>

export const AI_MODULES = {
  'authoritative-turn': {
    id: 'authoritative-turn',
    promptNumber: '01',
    title: 'Авторитетный игровой ход',
    modelId: 'deepseek',
    kind: 'text',
    contract: 'turn-output@0.2',
    maxOutputTokens: 4000,
    maxPrice: { prompt: 0.15, completion: 0.3 },
    fallbackModelId: 'mistral',
    devAlternativeModelId: 'aion',
    fallbackPolicy: 'same-contract-model',
  },
  'scene-plan': {
    id: 'scene-plan',
    promptNumber: '02',
    title: 'План сцены и сюжетной дуги',
    modelId: 'nemotron-free',
    kind: 'text',
    contract: 'scene-plan@0.2',
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0, completion: 0 },
    fallbackModelId: 'nemotron-paid',
    fallbackPolicy: 'paid-model-on-primary-rejection',
  },
  'scene-plan-paid': {
    id: 'scene-plan-paid',
    promptNumber: '02',
    title: 'Платный fallback плана сцены',
    modelId: 'nemotron-paid',
    kind: 'text',
    contract: 'scene-plan@0.2',
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0.55, completion: 2.3 },
    fallbackPolicy: 'discard-advisory',
  },
  narration: {
    id: 'narration',
    promptNumber: '03',
    title: 'Художественный рассказчик',
    modelId: 'aion',
    kind: 'text',
    contract: 'aion-narrative@0.2',
    maxOutputTokens: 1600,
    maxPrice: { prompt: 0.8, completion: 1.6 },
    fallbackPolicy: 'disabled-no-zdr-endpoint',
    disabledReason: 'AION_ZDR_ENDPOINT_UNAVAILABLE',
  },
  'turn-qa': {
    id: 'turn-qa',
    promptNumber: '04',
    title: 'Fallback и канонический аудит',
    modelId: 'mistral',
    kind: 'text',
    contract: 'canon-audit@0.2',
    maxOutputTokens: 2200,
    maxPrice: { prompt: 0.25, completion: 0.8 },
    fallbackModelId: 'deepseek',
    fallbackPolicy: 'same-contract-model',
  },
  'scene-image': {
    id: 'scene-image',
    promptNumber: '05',
    title: 'Дешевый ключевой кадр',
    modelId: 'krea-scene',
    kind: 'image',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.025 },
    estimatedMaxCostUsd: 0.025,
    maxInputReferences: 1,
    fallbackPolicy: 'keep-existing-scene-without-new-image',
  },
  'pack-image': {
    id: 'pack-image',
    promptNumber: '13',
    title: 'Паковый арт и визуальная библия',
    modelId: 'krea-pack',
    kind: 'image',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.05 },
    estimatedMaxCostUsd: 0.05,
    maxInputReferences: 1,
    fallbackPolicy: 'keep-text-visual-bible',
  },
  'hero-image': {
    id: 'hero-image',
    promptNumber: '06',
    title: 'Premium key art',
    modelId: 'krea-hero',
    kind: 'image',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.1 },
    estimatedMaxCostUsd: 0.1,
    maxInputReferences: 1,
    fallbackPolicy: 'keep-approved-lower-tier-art',
  },
  'image-repair': {
    id: 'image-repair',
    promptNumber: '14',
    title: 'Ремонт и согласование изображения',
    modelId: 'riverflow',
    kind: 'image',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.025 },
    estimatedMaxCostUsd: 0.025,
    maxInputReferences: 4,
    requiresInputReference: true,
    fallbackPolicy: 'keep-source-image-and-flag-review',
  },
  'item-image': {
    id: 'item-image',
    promptNumber: '15',
    title: 'Предметная иконка',
    modelId: 'recraft',
    kind: 'image',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.04 },
    estimatedMaxCostUsd: 0.035,
    maxInputReferences: 1,
    fallbackPolicy: 'use-generic-library-icon',
  },
  'exclusive-video': {
    id: 'exclusive-video',
    promptNumber: '07',
    title: 'Эксклюзивное видео',
    modelId: 'grok-video',
    kind: 'video',
    contract: 'media-job-result@1.0',
    maxPrice: { request: 0.152 },
    estimatedMaxCostUsd: 0.152,
    fallbackPolicy: 'keep-approved-still',
    disabledReason: 'VIDEO_REQUIRES_DURABLE_IDEMPOTENCY_AND_HTTPS_ASSET_ORIGIN',
  },
  'exclusive-video-premium': {
    id: 'exclusive-video-premium',
    promptNumber: '07',
    title: 'Premium-видео кульминации',
    modelId: 'grok-video-premium',
    kind: 'video',
    contract: 'media-job-result@1.0',
    maxPrice: { request: 0.25 },
    estimatedMaxCostUsd: 0.25,
    fallbackPolicy: 'keep-approved-still',
    disabledReason: 'VIDEO_REQUIRES_DURABLE_IDEMPOTENCY_AND_HTTPS_ASSET_ORIGIN',
  },
  inventory: {
    id: 'inventory',
    promptNumber: '08',
    title: 'Предметы и инвентарь',
    modelId: 'nemotron-free',
    kind: 'text',
    contract: 'inventory-advisory@1.1',
    standalone: false,
    maxOutputTokens: 3200,
    maxPrice: { prompt: 0, completion: 0 },
    fallbackModelId: 'nemotron-paid',
    fallbackPolicy: 'same-family-model-then-fail-turn',
  },
  journal: {
    id: 'journal',
    promptNumber: '09',
    title: 'Журнал и персонажи',
    modelId: 'mistral',
    kind: 'text',
    contract: 'journal-character-compiler@1.0',
    standalone: false,
    maxOutputTokens: 2200,
    maxPrice: { prompt: 0.25, completion: 0.8 },
    fallbackPolicy: 'deterministic-server-projection',
  },
  'world-compiler': {
    id: 'world-compiler',
    promptNumber: '10',
    title: 'Компилятор StoryPack',
    modelId: 'deepseek',
    kind: 'text',
    contract: 'storypack-compiled@1.0',
    standalone: false,
    disabledReason: 'FIXED_STORYPACK_SCHEMA_REQUIRED',
    maxOutputTokens: 4000,
    maxPrice: { prompt: 0.15, completion: 0.3 },
    fallbackPolicy: 'manual-author-review',
  },
  'action-tracker': {
    id: 'action-tracker',
    promptNumber: '11',
    title: 'Трекер действий и микросостояний',
    modelId: 'deepseek',
    kind: 'text',
    contract: 'turn-output-fragment@0.2',
    standalone: false,
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0.15, completion: 0.3 },
    fallbackPolicy: 'authoritative-turn-only',
  },
  difficulty: {
    id: 'difficulty',
    promptNumber: '12',
    title: 'Директор сложности',
    modelId: 'nemotron-free',
    kind: 'text',
    contract: 'difficulty-advisory@0.2',
    maxOutputTokens: 1400,
    maxPrice: { prompt: 0, completion: 0 },
    fallbackModelId: 'nemotron-paid',
    fallbackPolicy: 'paid-model-on-primary-rejection-otherwise-no-adjustment',
  },
} as const satisfies Record<string, AiModuleDefinition>

export type AiModuleId = keyof typeof AI_MODULES

export function getAiModule(moduleId: string): AiModuleDefinition | null {
  return Object.prototype.hasOwnProperty.call(AI_MODULES, moduleId)
    ? AI_MODULES[moduleId as AiModuleId]
    : null
}

export function getAiModel(modelId: string): AiModelDefinition {
  const model = Object.values(AI_MODELS).find(candidate => candidate.id === modelId)
  if (!model)
    throw new Error(`Unknown server-owned model id: ${modelId}`)
  return model
}

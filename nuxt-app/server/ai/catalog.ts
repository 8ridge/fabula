export type AiModuleKind = 'text' | 'image' | 'video'
export type AiModuleGate = 'core' | 'nemotron' | 'aion' | 'media' | 'premium-media'

export interface AiModelDefinition {
  id: string
  label: string
  slug: string
  role: string
  modality: AiModuleKind
}

export interface AiModuleDefinition {
  id: string
  promptNumber: string
  title: string
  modelId: string
  kind: AiModuleKind
  gate: AiModuleGate
  contract: string
  standalone?: boolean
  maxOutputTokens?: number
  maxPrice?: {
    prompt?: number
    completion?: number
    image?: number
    request?: number
  }
}

export const AI_MODELS = {
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek V4 Flash',
    slug: 'deepseek/deepseek-v4-flash',
    role: 'Авторитетный ход и структурные модули',
    modality: 'text',
  },
  nemotronFree: {
    id: 'nemotron-free',
    label: 'Nemotron 3 Ultra Free',
    slug: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    role: 'Обезличенный планировщик и директор сложности',
    modality: 'text',
  },
  nemotronPaid: {
    id: 'nemotron-paid',
    label: 'Nemotron 3 Ultra',
    slug: 'nvidia/nemotron-3-ultra-550b-a55b',
    role: 'Платный fallback планировщика',
    modality: 'text',
  },
  aion: {
    id: 'aion',
    label: 'Aion 3.0 Mini',
    slug: 'aion-labs/aion-3.0-mini',
    role: 'Рассказчик подтвержденного исхода',
    modality: 'text',
  },
  mistral: {
    id: 'mistral',
    label: 'Mistral Small 4',
    slug: 'mistralai/mistral-small-2603',
    role: 'Fallback хода и QA',
    modality: 'text',
  },
  kreaScene: {
    id: 'krea-scene',
    label: 'Krea 2 Medium Turbo',
    slug: 'krea/krea-2-medium-turbo',
    role: 'Дешевый ключевой кадр',
    modality: 'image',
  },
  kreaHero: {
    id: 'krea-hero',
    label: 'Krea 2 Large',
    slug: 'krea/krea-2-large',
    role: 'Premium key art',
    modality: 'image',
  },
  grokVideo: {
    id: 'grok-video',
    label: 'Grok Imagine Video',
    slug: 'x-ai/grok-imagine-video',
    role: 'Эксклюзивное видео',
    modality: 'video',
  },
  grokVideoPremium: {
    id: 'grok-video-premium',
    label: 'Grok Imagine Video 1.5',
    slug: 'x-ai/grok-imagine-video-1.5',
    role: 'Premium-видео кульминации',
    modality: 'video',
  },
} as const satisfies Record<string, AiModelDefinition>

export const AI_MODULES = {
  'authoritative-turn': {
    id: 'authoritative-turn',
    promptNumber: '01',
    title: 'Авторитетный игровой ход',
    modelId: 'deepseek',
    kind: 'text',
    gate: 'core',
    contract: 'turn-output@0.2',
    maxOutputTokens: 4000,
    maxPrice: { prompt: 0.15, completion: 0.3 },
  },
  'scene-plan': {
    id: 'scene-plan',
    promptNumber: '02',
    title: 'План сцены и сюжетной дуги',
    modelId: 'nemotron-free',
    kind: 'text',
    gate: 'nemotron',
    contract: 'scene-plan@1.0',
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0, completion: 0 },
  },
  narration: {
    id: 'narration',
    promptNumber: '03',
    title: 'Художественный рассказчик',
    modelId: 'aion',
    kind: 'text',
    gate: 'aion',
    contract: 'narration@1.0',
    maxOutputTokens: 1600,
    maxPrice: { prompt: 0.8, completion: 1.6 },
  },
  'turn-qa': {
    id: 'turn-qa',
    promptNumber: '04',
    title: 'Fallback и канонический аудит',
    modelId: 'mistral',
    kind: 'text',
    gate: 'core',
    contract: 'turn-qa@1.0',
    maxOutputTokens: 2200,
    maxPrice: { prompt: 0.25, completion: 0.8 },
  },
  'scene-image': {
    id: 'scene-image',
    promptNumber: '05',
    title: 'Дешевый ключевой кадр',
    modelId: 'krea-scene',
    kind: 'image',
    gate: 'media',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.025 },
  },
  'hero-image': {
    id: 'hero-image',
    promptNumber: '06',
    title: 'Premium key art',
    modelId: 'krea-hero',
    kind: 'image',
    gate: 'premium-media',
    contract: 'media-job-result@1.0',
    maxPrice: { image: 0.1 },
  },
  'exclusive-video': {
    id: 'exclusive-video',
    promptNumber: '07',
    title: 'Эксклюзивное видео',
    modelId: 'grok-video',
    kind: 'video',
    gate: 'media',
    contract: 'media-job-result@1.0',
  },
  'exclusive-video-premium': {
    id: 'exclusive-video-premium',
    promptNumber: '07',
    title: 'Premium-видео кульминации',
    modelId: 'grok-video-premium',
    kind: 'video',
    gate: 'premium-media',
    contract: 'media-job-result@1.0',
  },
  inventory: {
    id: 'inventory',
    promptNumber: '08',
    title: 'Предметы и инвентарь',
    modelId: 'deepseek',
    kind: 'text',
    gate: 'core',
    contract: 'turn-output-fragment@0.2',
    standalone: false,
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0.15, completion: 0.3 },
  },
  journal: {
    id: 'journal',
    promptNumber: '09',
    title: 'Журнал и память',
    modelId: 'deepseek',
    kind: 'text',
    gate: 'core',
    contract: 'journal-projection@1.0',
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0.15, completion: 0.3 },
  },
  'world-compiler': {
    id: 'world-compiler',
    promptNumber: '10',
    title: 'Компилятор StoryPack',
    modelId: 'deepseek',
    kind: 'text',
    gate: 'core',
    contract: 'storypack-compiled@1.0',
    maxOutputTokens: 4000,
    maxPrice: { prompt: 0.15, completion: 0.3 },
  },
  'action-tracker': {
    id: 'action-tracker',
    promptNumber: '11',
    title: 'Трекер действий и микросостояний',
    modelId: 'deepseek',
    kind: 'text',
    gate: 'core',
    contract: 'turn-output-fragment@0.2',
    standalone: false,
    maxOutputTokens: 1800,
    maxPrice: { prompt: 0.15, completion: 0.3 },
  },
  difficulty: {
    id: 'difficulty',
    promptNumber: '12',
    title: 'Директор сложности',
    modelId: 'nemotron-free',
    kind: 'text',
    gate: 'nemotron',
    contract: 'difficulty-advisory@0.2',
    maxOutputTokens: 1400,
    maxPrice: { prompt: 0, completion: 0 },
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

import type { DevStoryModel } from '../ai/turn-engine'
import { FabulaApiError } from '../ai/http'

export const DEV_STORY_MODEL_HEADER = 'x-fabula-dev-story-model'

export function resolveDevStoryModel(
  requestedModel: string | undefined,
  devMode = import.meta.dev,
): DevStoryModel {
  if (!requestedModel)
    return 'deepseek'
  if (!devMode) {
    throw new FabulaApiError(
      'DEV_MODEL_OVERRIDE_FORBIDDEN',
      'Переключение сюжетной модели доступно только в dev-режиме.',
      403,
    )
  }
  if (requestedModel !== 'deepseek' && requestedModel !== 'aion') {
    throw new FabulaApiError(
      'INVALID_DEV_STORY_MODEL',
      'Неизвестная dev-модель сюжета.',
      400,
      false,
      [DEV_STORY_MODEL_HEADER],
    )
  }
  return requestedModel
}

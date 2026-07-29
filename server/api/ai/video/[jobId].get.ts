import { getHeader, getRouterParam, setHeader } from 'h3'
import { resolveAiConfig } from '../../../ai/config'
import { respondWithError, FabulaApiError } from '../../../ai/http'
import { OpenRouterClient } from '../../../ai/openrouter'
import { acquireRateLimit, assertAiConfigured, assertSameOrigin } from '../../../ai/security'
import { assertVideoJobOwner } from '../../../ai/video-jobs'

const SAFE_JOB_ID = /^[A-Za-z0-9_-]{1,160}$/
const SAFE_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{7,127}$/

export default defineEventHandler(async (event) => {
  const requestId = globalThis.crypto.randomUUID()
  let release = () => {}
  try {
    assertSameOrigin(event)
    const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
    assertAiConfigured(config)
    release = acquireRateLimit(event)
    const jobId = getRouterParam(event, 'jobId') || ''
    const ownerKey = getHeader(event, 'x-fabula-request-id') || ''
    if (!SAFE_JOB_ID.test(jobId) || !SAFE_REQUEST_ID.test(ownerKey))
      throw new FabulaApiError('VIDEO_JOB_NOT_FOUND', 'Video job не найден.', 404)
    const remembered = assertVideoJobOwner(jobId, ownerKey)
    const result = await new OpenRouterClient(config).pollVideo(jobId)
    setHeader(event, 'Cache-Control', 'no-store')
    return {
      schema_version: 'media-job-result@1.0',
      job_id: result.id,
      provider: 'OpenRouter',
      model: remembered.model,
      status: result.status,
      generation_id: result.generationId,
      unsigned_urls: result.unsignedUrls,
      usage: result.usage,
    }
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
  finally {
    release()
  }
})

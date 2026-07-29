import { getRouterParam, readBody, setHeader } from 'h3'
import { resolveAiConfig } from '../../../ai/config'
import { parseModuleRequest } from '../../../ai/contracts'
import { respondWithError } from '../../../ai/http'
import { AiModuleService } from '../../../ai/module-service'
import { acquireRateLimit, assertAiEnabled, assertRequestSize, assertSameOrigin } from '../../../ai/security'

export default defineEventHandler(async (event) => {
  const requestId = globalThis.crypto.randomUUID()
  let release = () => {}
  try {
    assertSameOrigin(event)
    assertRequestSize(event, 96_000)
    const config = resolveAiConfig(useRuntimeConfig(event) as unknown as Record<string, unknown>)
    assertAiEnabled(config)
    release = acquireRateLimit(event, config)
    const moduleId = getRouterParam(event, 'module') || ''
    const request = parseModuleRequest(await readBody(event))
    const service = new AiModuleService(config)
    const response = await service.invoke(moduleId, request)
    setHeader(event, 'Cache-Control', 'no-store')
    return response
  }
  catch (error) {
    return respondWithError(event, error, requestId)
  }
  finally {
    release()
  }
})

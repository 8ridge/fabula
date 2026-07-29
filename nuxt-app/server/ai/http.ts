import type { H3Event } from 'h3'
import { setHeader, setResponseStatus } from 'h3'
import { ContractError } from './contracts'
import { OpenRouterError } from './openrouter'

export class FabulaApiError extends Error {
  readonly code: string
  readonly status: number
  readonly retryable: boolean
  readonly fieldErrors: string[]

  constructor(code: string, message: string, status = 400, retryable = false, fieldErrors: string[] = []) {
    super(message)
    this.name = 'FabulaApiError'
    this.code = code
    this.status = status
    this.retryable = retryable
    this.fieldErrors = fieldErrors
  }
}

export interface SafeModelRun {
  role: 'advisory' | 'primary' | 'fallback'
  model: string
  request_id: string | null
  usage: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
    cost?: number
  } | null
  status: 'accepted' | 'discarded'
  error_code: string | null
  validation_errors: string[]
}

export class AiExecutionError extends FabulaApiError {
  readonly modelRuns: SafeModelRun[]

  constructor(code: string, message: string, modelRuns: SafeModelRun[], retryable = false) {
    super(code, message, 502, retryable)
    this.name = 'AiExecutionError'
    this.modelRuns = modelRuns
  }
}

export function respondWithError(event: H3Event, error: unknown, requestId: string, turnId?: string) {
  let code = 'INTERNAL_ERROR'
  let message = 'Не удалось обработать запрос.'
  let status = 500
  let retryable = false
  let fieldErrors: string[] = []
  let modelRuns: SafeModelRun[] = []

  if (error instanceof FabulaApiError) {
    code = error.code
    message = error.message
    status = error.status
    retryable = error.retryable
    fieldErrors = error.fieldErrors
    if (error instanceof AiExecutionError)
      modelRuns = error.modelRuns
  }
  else if (error instanceof ContractError) {
    code = error.code
    message = error.message
    status = error.code.startsWith('MODEL_') ? 502 : 400
    retryable = error.code === 'MODEL_CONTRACT_ERROR'
    fieldErrors = error.fieldErrors
  }
  else if (error instanceof OpenRouterError) {
    code = error.code
    message = error.message
    status = error.status
    retryable = error.retryable
    if (error.retryAfter && Number.isFinite(Number(error.retryAfter)))
      setHeader(event, 'Retry-After', Number(error.retryAfter))
  }

  setResponseStatus(event, status)
  setHeader(event, 'Cache-Control', 'no-store')
  return {
    schema_version: 'api-error@1.0',
    code,
    message,
    retryable,
    request_id: requestId,
    turn_id: turnId || null,
    field_errors: fieldErrors,
    model_runs: modelRuns,
  }
}

import { FabulaApiError } from './http'

interface VideoJobRecord {
  ownerKey: string
  model: string
  createdAt: number
}

const jobs = new Map<string, VideoJobRecord>()
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function prune(): void {
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.createdAt > MAX_AGE_MS)
      jobs.delete(id)
  }
}

export function rememberVideoJob(id: string, ownerKey: string, model: string): void {
  prune()
  jobs.set(id, { ownerKey, model, createdAt: Date.now() })
}

export function assertVideoJobOwner(id: string, ownerKey: string): VideoJobRecord {
  prune()
  const job = jobs.get(id)
  if (!job || job.ownerKey !== ownerKey)
    throw new FabulaApiError('VIDEO_JOB_NOT_FOUND', 'Video job не найден в этой preview-сессии.', 404)
  return job
}

import type { StoryPackId } from '../../shared/storypacks'
import { getStoryPackContext } from './storypack-context'

export interface RuntimeStoryPackSource {
  storyPackId: StoryPackId
  sourceFile: string
  sourceHash: string
  technicalPackId: string
  promptOverlayVersion: string
  promptOverlay: string
  hardCanon: string[]
  canonicalCore: string
}

const sourceCache = new Map<StoryPackId, Promise<RuntimeStoryPackSource>>()

function section(source: string, heading: RegExp): string {
  const match = heading.exec(source)
  if (!match || match.index === undefined)
    throw new Error('STORYPACK_REQUIRED_SECTION_MISSING')
  const start = match.index + match[0].length
  const rest = source.slice(start)
  const nextHeading = rest.search(/^##\s+/m)
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim()
}

export async function compileStoryPackSource(
  storyPackId: StoryPackId,
  sourceFile: string,
  source: string,
): Promise<RuntimeStoryPackSource> {
  const normalized = source.replace(/\r\n/g, '\n').trim()
  const overlaySection = section(normalized, /^##\s+\d+\.\s+Pack overlay для текстовых моделей\s*$/m)
  const overlayMatch = /```text\s*\n([\s\S]*?)\n```/m.exec(overlaySection)
  if (!overlayMatch?.[1])
    throw new Error('STORYPACK_OVERLAY_MISSING')
  const promptOverlay = overlayMatch[1].trim()
  const technicalPackId = /^PACK_ID:\s*(.+)$/m.exec(promptOverlay)?.[1]?.trim()
  if (!technicalPackId)
    throw new Error('STORYPACK_PACK_ID_MISSING')

  const mediaHeading = /^##\s+\d+\.\s+Медиа\s*$/m.exec(normalized)
  if (!mediaHeading || mediaHeading.index === undefined)
    throw new Error('STORYPACK_MEDIA_BOUNDARY_MISSING')
  const canonicalCore = normalized.slice(0, mediaHeading.index).trim()
  const hardRules = section(normalized, /^##\s+\d+\.\s+Ж[её]сткие[^\n]*$/m)
  const hardCanon = hardRules
    .split('\n')
    .map(line => /^\d+\.\s+(.+)$/.exec(line.trim())?.[1]?.trim())
    .filter((claim): claim is string => Boolean(claim))
  if (!hardCanon.length)
    throw new Error('STORYPACK_HARD_CANON_MISSING')

  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized))
  const sourceHash = `sha256:${[...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')}`
  return {
    storyPackId,
    sourceFile,
    sourceHash,
    technicalPackId,
    promptOverlayVersion: `${technicalPackId}#${sourceHash.slice(7, 19)}`,
    promptOverlay,
    hardCanon,
    canonicalCore,
  }
}

export function loadRuntimeStoryPack(storyPackId: StoryPackId): Promise<RuntimeStoryPackSource> {
  let cached = sourceCache.get(storyPackId)
  if (!cached) {
    const { sourceFile } = getStoryPackContext(storyPackId)
    cached = import('nitropack/runtime').then(({ useStorage }) =>
      useStorage<string>('assets:fabula-storypacks').getItem(sourceFile)).then((source) => {
      if (!source)
        throw new Error(`StoryPack asset is missing: ${sourceFile}`)
      return compileStoryPackSource(storyPackId, sourceFile, source)
    })
    sourceCache.set(storyPackId, cached)
  }
  return cached
}

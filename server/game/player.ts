import type { H3Event } from 'h3'
import { getCookie, getRequestURL, setCookie } from 'h3'

const PLAYER_COOKIE = 'fabula_player'
const PLAYER_ID = /^player:[0-9a-f-]{36}$/i

export function getOrCreatePlayerId(event: H3Event): string {
  const current = getCookie(event, PLAYER_COOKIE)
  if (current && PLAYER_ID.test(current))
    return current

  const playerId = `player:${globalThis.crypto.randomUUID()}`
  setCookie(event, PLAYER_COOKIE, playerId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getRequestURL(event).protocol === 'https:',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return playerId
}

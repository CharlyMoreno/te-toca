import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { AppEnv, User } from './types'

const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const sessionCookie = 'te_toca_session'
const sessionLifetime = 60 * 60 * 24 * 30

export function now(): number {
  return Math.floor(Date.now() / 1000)
}

export function code(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('')
}

export function inviteCode(): string {
  return code(8).match(/.{4}/g)!.join('-')
}

export function normalizeCode(input: unknown, length: number, prefix = ''): string | null {
  if (typeof input !== 'string') return null
  const normalized = input.toUpperCase().replace(/[\s-]/g, '')
  if (normalized.length !== length + prefix.length || !normalized.startsWith(prefix)) return null
  if (![...normalized].every((character) => alphabet.includes(character) || prefix.includes(character))) return null
  return normalized
}

export async function hash(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function limit(c: Context<AppEnv>, scope: string, identifier: string, maximum: number): Promise<boolean> {
  const key = await hash(`${scope}:${identifier}`)
  const windowStart = Math.floor(now() / 900) * 900
  const result = await c.env.DB.prepare(`
    INSERT INTO auth_rate_limits (key, window_start, hits) VALUES (?, ?, 1)
    ON CONFLICT(key) DO UPDATE SET
      hits = CASE WHEN auth_rate_limits.window_start = excluded.window_start
        THEN auth_rate_limits.hits + 1 ELSE 1 END,
      window_start = excluded.window_start
    RETURNING hits
  `).bind(key, windowStart).first<{ hits: number }>()
  return (result?.hits ?? maximum + 1) <= maximum
}

export function clientIp(c: Context<AppEnv>): string {
  return c.req.header('CF-Connecting-IP') ?? 'local'
}

export async function createSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const raw = code(32)
  await c.env.DB.prepare(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  ).bind(await hash(raw), userId, now(), now() + sessionLifetime).run()
  setSessionCookie(c, raw)
}

export function setSessionCookie(c: Context<AppEnv>, raw: string): void {
  setCookie(c, sessionCookie, raw, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: sessionLifetime,
  })
}

export async function revokeSession(c: Context<AppEnv>): Promise<void> {
  const raw = getCookie(c, sessionCookie)
  if (raw) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(raw)).run()
  }
  deleteCookie(c, sessionCookie, { path: '/' })
}

export const requireUser = createMiddleware<AppEnv>(async (c, next) => {
  const raw = getCookie(c, sessionCookie)
  if (!raw) return c.json({ error: 'Necesitás entrar a tu cuenta.' }, 401)

  const sessionHash = await hash(raw)
  const user = await c.env.DB.prepare(`
    SELECT u.id, u.display_name
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `).bind(sessionHash, now()).first<User>()

  if (!user) {
    deleteCookie(c, sessionCookie, { path: '/' })
    return c.json({ error: 'Tu sesión venció. Volvé a entrar.' }, 401)
  }

  c.set('user', user)
  c.set('sessionHash', sessionHash)
  await next()
})

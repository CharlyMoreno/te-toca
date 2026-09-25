import { Hono } from 'hono'
import { clientIp, code, createSession, hash, limit, normalizeCode, now, personalCode, requireUser, revokeSession, setSessionCookie } from './security'
import type { AppEnv, User } from './types'

export const auth = new Hono<AppEnv>()

auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null) as { displayName?: unknown } | null
  const displayName = typeof body?.displayName === 'string' ? body.displayName.trim().replace(/\s+/g, ' ') : ''
  if (displayName.length < 2 || displayName.length > 40) {
    return c.json({ error: 'Escribí un nombre de 2 a 40 caracteres.' }, 400)
  }
  if (!await limit(c, 'register', clientIp(c), 10)) {
    return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  }

  const user: User = { id: crypto.randomUUID(), display_name: displayName }
  const accessCode = personalCode()
  const session = code(32)
  const timestamp = now()
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO users (id, display_name, created_at, updated_at) VALUES (?, ?, ?, ?)')
      .bind(user.id, user.display_name, timestamp, timestamp),
    c.env.DB.prepare('INSERT INTO access_keys (key_hash, user_id, created_at) VALUES (?, ?, ?)')
      .bind(await hash(accessCode.replace(/-/g, '')), user.id, timestamp),
    c.env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(await hash(session), user.id, timestamp, timestamp + 60 * 60 * 24 * 30),
  ])

  setSessionCookie(c, session)
  return c.json({ user, accessCode }, 201)
})

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null) as { accessCode?: unknown } | null
  const normalized = normalizeCode(body?.accessCode, 20, 'TT')
  if (!await limit(c, 'login', clientIp(c), 20)) {
    return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  }
  if (!normalized) return c.json({ error: 'La clave no es válida.' }, 401)

  const user = await c.env.DB.prepare(`
    SELECT u.id, u.display_name FROM access_keys k
    JOIN users u ON u.id = k.user_id
    WHERE k.key_hash = ? AND k.revoked_at IS NULL
  `).bind(await hash(normalized)).first<User>()
  if (!user) return c.json({ error: 'La clave no es válida.' }, 401)

  await createSession(c, user.id)
  return c.json({ user })
})

auth.get('/me', requireUser, (c) => c.json({ user: c.get('user') }))

auth.post('/logout', async (c) => {
  await revokeSession(c)
  return c.json({ ok: true })
})

import { Hono } from 'hono'
import { clientIp, hash, inviteCode, limit, normalizeCode, now, requireUser } from './security'
import type { AppEnv } from './types'

type HomeRow = {
  id: string
  name: string
  timezone: string
  role: 'admin' | 'member'
}

export const homes = new Hono<AppEnv>()
homes.use('*', requireUser)

async function currentHome(db: D1Database, userId: string): Promise<HomeRow | null> {
  return db.prepare(`
    SELECT h.id, h.name, h.timezone, m.role
    FROM home_members m JOIN homes h ON h.id = m.home_id
    WHERE m.user_id = ?
  `).bind(userId).first<HomeRow>()
}

homes.get('/current', async (c) => {
  const home = await currentHome(c.env.DB, c.get('user').id)
  if (!home) return c.json({ home: null, members: [] })

  const members = await c.env.DB.prepare(`
    SELECT u.id, u.display_name, m.role
    FROM home_members m JOIN users u ON u.id = m.user_id
    WHERE m.home_id = ? ORDER BY m.joined_at, u.id
  `).bind(home.id).all<{ id: string; display_name: string; role: string }>()
  return c.json({ home, members: members.results })
})

homes.post('/', async (c) => {
  const user = c.get('user')
  if (await currentHome(c.env.DB, user.id)) {
    return c.json({ error: 'Ya pertenecés a una casa.' }, 409)
  }

  const body = await c.req.json().catch(() => null) as { name?: unknown; timezone?: unknown } | null
  const name = typeof body?.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : ''
  const timezone = typeof body?.timezone === 'string' ? body.timezone : ''
  if (name.length < 2 || name.length > 60) return c.json({ error: 'Escribí un nombre de 2 a 60 caracteres.' }, 400)
  try {
    new Intl.DateTimeFormat('es', { timeZone: timezone })
  } catch {
    return c.json({ error: 'La zona horaria no es válida.' }, 400)
  }

  const id = crypto.randomUUID()
  const timestamp = now()
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO homes (id, name, timezone, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(id, name, timezone, user.id, timestamp),
    c.env.DB.prepare('INSERT INTO home_members (home_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)')
      .bind(id, user.id, 'admin', timestamp),
  ])
  return c.json({ home: { id, name, timezone, role: 'admin' } }, 201)
})

homes.post('/invite', async (c) => {
  const home = await currentHome(c.env.DB, c.get('user').id)
  if (!home || home.role !== 'admin') return c.json({ error: 'Solo quien administra la casa puede invitar.' }, 403)

  const invite = inviteCode()
  const timestamp = now()
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE home_invites SET revoked_at = ? WHERE home_id = ? AND revoked_at IS NULL')
      .bind(timestamp, home.id),
    c.env.DB.prepare(`
      INSERT INTO home_invites (code_hash, home_id, created_by, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(await hash(invite.replace(/-/g, '')), home.id, c.get('user').id, timestamp, timestamp + 7 * 86400),
  ])
  return c.json({ inviteCode: invite, expiresAt: timestamp + 7 * 86400 })
})

homes.post('/join', async (c) => {
  const user = c.get('user')
  if (await currentHome(c.env.DB, user.id)) return c.json({ error: 'Ya pertenecés a una casa.' }, 409)
  if (!await limit(c, 'join', clientIp(c), 20)) {
    return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  }
  const body = await c.req.json().catch(() => null) as { inviteCode?: unknown } | null
  const normalized = normalizeCode(body?.inviteCode, 8)
  if (!normalized) return c.json({ error: 'El código no es válido o venció.' }, 400)

  const timestamp = now()
  const result = await c.env.DB.prepare(`
    INSERT INTO home_members (home_id, user_id, role, joined_at)
    SELECT i.home_id, ?, 'member', ? FROM home_invites i
    WHERE i.code_hash = ? AND i.revoked_at IS NULL AND i.expires_at > ?
      AND (SELECT count(*) FROM home_members m WHERE m.home_id = i.home_id) < 6
      AND NOT EXISTS (SELECT 1 FROM home_members m WHERE m.user_id = ?)
  `).bind(user.id, timestamp, await hash(normalized), timestamp, user.id).run()
  if (result.meta.changes !== 1) return c.json({ error: 'El código no es válido, venció o la casa está completa.' }, 400)

  const home = await currentHome(c.env.DB, user.id)
  return c.json({ home }, 201)
})

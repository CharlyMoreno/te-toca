import { Hono } from 'hono'
import { clientIp, code, createSession, hash, limit, normalizeCode, now, requireUser, revokeSession, setSessionCookie } from './security'
import { credentials, hashPassword, verifyPassword } from './password'
import type { AppEnv, User } from './types'

export const auth = new Hono<AppEnv>()

async function usernameTaken(db: D1Database, username: string) {
  return Boolean(await db.prepare('SELECT 1 FROM user_credentials WHERE username=?').bind(username).first())
}

auth.post('/register', async c => {
  if (!await limit(c, 'register', clientIp(c), 10)) return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  const data = credentials(await c.req.json().catch(() => null))
  if ('error' in data) return c.json({ error: data.error }, 400)
  if (await usernameTaken(c.env.DB, data.username)) return c.json({ error: 'Ese usuario ya está en uso. Elegí otro.' }, 409)
  const passwordHash = await hashPassword(data.password)
  const user: User = { id: crypto.randomUUID(), display_name: data.username }
  const session = code(32), timestamp = now()
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO users (id,display_name,created_at,updated_at) VALUES (?,?,?,?)')
        .bind(user.id,user.display_name,timestamp,timestamp),
      c.env.DB.prepare('INSERT INTO user_credentials (user_id,username,password_hash,created_at) VALUES (?,?,?,?)')
        .bind(user.id,data.username,passwordHash,timestamp),
      c.env.DB.prepare('INSERT INTO sessions (token_hash,user_id,created_at,expires_at) VALUES (?,?,?,?)')
        .bind(await hash(session),user.id,timestamp,timestamp+30*86400),
    ])
  } catch (error) {
    if (await usernameTaken(c.env.DB, data.username)) return c.json({ error: 'Ese usuario ya está en uso. Elegí otro.' }, 409)
    throw error
  }
  setSessionCookie(c, session)
  return c.json({ user }, 201)
})

auth.post('/login', async c => {
  if (!await limit(c, 'login', clientIp(c), 20)) return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  const data = credentials(await c.req.json().catch(() => null))
  if ('error' in data) return c.json({ error: 'Usuario o contraseña incorrectos.' }, 401)
  if (!await limit(c, 'login-user', data.username, 30)) return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  const row = await c.env.DB.prepare(`SELECT u.id,u.display_name,k.password_hash FROM user_credentials k
    JOIN users u ON u.id=k.user_id WHERE k.username=?`).bind(data.username).first<User & {password_hash:string}>()
  const valid = await verifyPassword(data.password, row?.password_hash)
  if (!row || !valid) return c.json({ error: 'Usuario o contraseña incorrectos.' }, 401)
  await createSession(c, row.id)
  return c.json({ user: { id: row.id, display_name: row.display_name } })
})

// Existing profiles keep their home/avatar/tasks: the old code only opens the credential setup flow.
auth.post('/legacy-login', async c => {
  if (!await limit(c, 'login', clientIp(c), 20)) return c.json({ error: 'Demasiados intentos. Probá en unos minutos.' }, 429)
  const body = await c.req.json().catch(() => null) as {accessCode?:unknown}|null
  const normalized = normalizeCode(body?.accessCode,20,'TT')
  if (!normalized) return c.json({ error: 'La clave anterior no es válida.' }, 401)
  const user = await c.env.DB.prepare(`SELECT u.id,u.display_name FROM access_keys k JOIN users u ON u.id=k.user_id
    WHERE k.key_hash=? AND k.revoked_at IS NULL AND NOT EXISTS (SELECT 1 FROM user_credentials p WHERE p.user_id=u.id)`)
    .bind(await hash(normalized)).first<User>()
  if (!user) return c.json({ error: 'La clave anterior no es válida o ya configuraste tu contraseña.' }, 401)
  await createSession(c,user.id)
  return c.json({ user, needsCredentials:true })
})

auth.post('/credentials', requireUser, async c => {
  if (!await limit(c,'credentials',c.get('user').id,10)) return c.json({ error:'Demasiados intentos. Probá en unos minutos.' },429)
  if (await c.env.DB.prepare('SELECT 1 FROM user_credentials WHERE user_id=?').bind(c.get('user').id).first()) {
    return c.json({ error: 'Tu cuenta ya tiene usuario y contraseña.' },409)
  }
  const data = credentials(await c.req.json().catch(() => null))
  if ('error' in data) return c.json({ error:data.error },400)
  const passwordHash = await hashPassword(data.password)
  try {
    await c.env.DB.batch([
      c.env.DB.prepare('INSERT INTO user_credentials (user_id,username,password_hash,created_at) VALUES (?,?,?,?)')
        .bind(c.get('user').id,data.username,passwordHash,now()),
      c.env.DB.prepare('UPDATE access_keys SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(now(),c.get('user').id),
    ])
  } catch(error) {
    if (await usernameTaken(c.env.DB,data.username)) return c.json({ error:'Ese usuario ya está en uso. Elegí otro.' },409)
    if (await c.env.DB.prepare('SELECT 1 FROM user_credentials WHERE user_id=?').bind(c.get('user').id).first()) return c.json({error:'Tu cuenta ya tiene usuario y contraseña.'},409)
    throw error
  }
  return c.json({ok:true})
})

auth.get('/me', requireUser, async c => {
  const existing = await c.env.DB.prepare('SELECT 1 FROM user_credentials WHERE user_id=?').bind(c.get('user').id).first()
  return c.json({ user:c.get('user'), needsCredentials:!existing })
})
auth.post('/logout', async c => { await revokeSession(c); return c.json({ ok:true }) })

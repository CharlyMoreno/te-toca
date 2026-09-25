import { Hono } from 'hono'
import { isAvatar, parseAvatar } from '../shared/avatar'
import { now, requireUser } from './security'
import type { AppEnv } from './types'

export const profile = new Hono<AppEnv>()
profile.use('*', requireUser)
profile.get('/avatar', async c => {
  const user = await c.env.DB.prepare('SELECT avatar_json FROM users WHERE id=?')
    .bind(c.get('user').id).first<{ avatar_json: string }>()
  return c.json({ avatar: parseAvatar(user?.avatar_json ?? null) })
})
profile.put('/avatar', async c => {
  const body: unknown = await c.req.json().catch(() => null)
  if (!isAvatar(body)) return c.json({ error: 'Elegí una apariencia válida para tu personaje.' }, 400)
  // Store only the supported fields, never arbitrary client properties.
  const { skin, hairColor, hairStyle, shirt, pants, glasses } = body
  const avatar = { skin, hairColor, hairStyle, shirt, pants, glasses }
  await c.env.DB.prepare('UPDATE users SET avatar_json=?,updated_at=? WHERE id=?')
    .bind(JSON.stringify(avatar), now(), c.get('user').id).run()
  return c.json({ avatar })
})

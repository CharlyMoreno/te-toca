import { roomsApi } from './rooms'
import { Hono } from 'hono'
import { profile } from './profile'
import { presence, notifyHouse } from './presence'
export { HousePresence } from './presence'
import { auth } from './auth'
import { homes } from './homes'
import { tasks } from './tasks'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use('/api/*', async (c, next) => {
  const method = c.req.method.toUpperCase()
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
    const origin = c.req.header('Origin')
    if (origin && origin !== new URL(c.req.url).origin) {
      return c.json({ error: 'Origen no permitido.' }, 403)
    }
    if (!c.req.header('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return c.json({ error: 'Se requiere JSON.' }, 415)
    }
  }
  await next()
  if (c.res.status === 101) return
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && c.res.ok && c.get('user')) {
    c.executionCtx.waitUntil(notifyHouse(c.env, c.get('user').id).catch(error => console.error('Presence notification failed', error)))
  }
  c.res.headers.set('Cache-Control', 'no-store')
  c.res.headers.set('Referrer-Policy', 'no-referrer')
  c.res.headers.set('X-Content-Type-Options', 'nosniff')
})

app.route('/api/presence', presence)
app.route('/api/profile', profile)
app.route('/api/auth', auth)
app.route('/api/homes', homes)
app.route('/api/tasks', tasks)
app.route('/api/rooms', roomsApi)
app.notFound((c) => c.json({ error: 'Ruta no encontrada.' }, 404))
app.onError((error, c) => {
  console.error('API error', error)
  return c.json({ error: 'Ocurrió un error. Probá de nuevo.' }, 500)
})

export default app

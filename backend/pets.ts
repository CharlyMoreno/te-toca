import { Hono } from 'hono'
import { petColors, petKinds, petLimit, type Pet } from '../shared/pets'
import { now, requireUser } from './security'
import { membership } from './tasks'
import type { AppEnv } from './types'

function parsePet(data: Record<string, unknown> | null) {
  const name = typeof data?.name === 'string' ? data.name.trim().replace(/\s+/g, ' ') : ''
  const kind = petKinds.find(kind => kind === data?.kind)
  const color = petColors.find(color => color === data?.color)
  return name.length >= 1 && name.length <= 24 && kind && color ? { name, kind, color } : null
}

export const petsApi = new Hono<AppEnv>()
petsApi.use('*', requireUser)
petsApi.get('/', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const result = await c.env.DB.prepare('SELECT id,name,kind,color,created_at FROM pets WHERE home_id=? ORDER BY created_at,id').bind(home.id).all<Pet>()
  return c.json({ pets: result.results })
})
petsApi.post('/', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const pet = parsePet(await c.req.json().catch(() => null))
  if (!pet) return c.json({ error: 'Elegí perro o gato, un color y un nombre de hasta 24 caracteres.' }, 400)
  const id = crypto.randomUUID()
  const result = await c.env.DB.prepare(`INSERT INTO pets (id,home_id,name,kind,color,created_at)
    SELECT ?,?,?,?,?,? WHERE (SELECT count(*) FROM pets WHERE home_id=?)<?`)
    .bind(id, home.id, pet.name, pet.kind, pet.color, now(), home.id, petLimit).run()
  if (!result.meta.changes) return c.json({ error: `La casa admite hasta ${petLimit} mascotas.` }, 409)
  return c.json({ id }, 201)
})
petsApi.patch('/:id', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const pet = parsePet(await c.req.json().catch(() => null))
  if (!pet) return c.json({ error: 'Revisá el nombre, la especie y el color.' }, 400)
  const result = await c.env.DB.prepare('UPDATE pets SET name=?,kind=?,color=? WHERE id=? AND home_id=?')
    .bind(pet.name, pet.kind, pet.color, c.req.param('id'), home.id).run()
  if (!result.meta.changes) return c.json({ error: 'Mascota no encontrada.' }, 404)
  return c.json({ ok: true })
})
petsApi.delete('/:id', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home || home.role !== 'admin') return c.json({ error: 'Solo quien administra puede quitar mascotas.' }, 403)
  const result = await c.env.DB.prepare(`DELETE FROM pets WHERE id=? AND home_id=?
    AND NOT EXISTS (SELECT 1 FROM tasks WHERE pet_id=pets.id)`).bind(c.req.param('id'), home.id).run()
  if (!result.meta.changes) return c.json({ error: 'Solo se pueden quitar mascotas sin tareas asociadas.' }, 409)
  return c.json({ ok: true })
})

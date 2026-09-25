import type { Context } from 'hono'
import type { GameEvent } from '../shared/game'
import { publishGameEvent } from './realtime'
import { Hono } from 'hono'
import { now, requireUser } from './security'
import type { AppEnv } from './types'

export type Membership = { id: string; timezone: string; role: string }
export async function membership(db: D1Database, userId: string) {
  return db.prepare(`SELECT h.id, h.timezone, m.role FROM home_members m
    JOIN homes h ON h.id=m.home_id WHERE m.user_id=?`).bind(userId).first<Membership>()
}
export function dateInZone(zone: string): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (name: string) => parts.find(p => p.type === name)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
function dayNumber(date: string) { return Date.parse(`${date}T00:00:00Z`) / 86400000 }
function dateString(day: number) { return new Date(day * 86400000).toISOString().slice(0, 10) }

async function materialize(db: D1Database, home: Membership) {
  const routines = await db.prepare(`SELECT t.*, MAX(o.due_date) last_date FROM tasks t
    LEFT JOIN task_occurrences o ON o.task_id=t.id WHERE t.home_id=? AND t.active=1 GROUP BY t.id`)
    .bind(home.id).all<{ id: string; frequency: string; first_date: string; points: number; last_date: string | null }>()
  const participants = await db.prepare(`SELECT p.* FROM task_participants p JOIN tasks t ON t.id=p.task_id
    WHERE t.home_id=? ORDER BY p.position`).bind(home.id).all<{ task_id: string; user_id: string }>()
  const end = dayNumber(dateInZone(home.timezone)) + 7
  let statements: D1PreparedStatement[] = []
  for (const routine of routines.results) {
    const people = participants.results.filter(p => p.task_id === routine.id)
    if (!people.length) continue
    const first = dayNumber(routine.first_date)
    const interval = routine.frequency === 'daily' ? 1 : 7
    const start = routine.last_date ? dayNumber(routine.last_date) + interval : first
    for (let day = start; day <= end; day += interval) {
      const date = dateString(day)
      const assigned = people[((day - first) / interval) % people.length].user_id
      statements.push(db.prepare(`INSERT OR IGNORE INTO task_occurrences
        (id,task_id,due_date,original_assignee,assignee,points) VALUES (?,?,?,?,?,?)`)
        .bind(`${routine.id}:${date}`, routine.id, date, assigned, assigned, routine.points))
      if (statements.length === 50) { await db.batch(statements); statements = [] }
    }
  }
  if (statements.length) await db.batch(statements)
}

export const tasks = new Hono<AppEnv>()
tasks.use('*', requireUser)

tasks.get('/', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 404)
  await materialize(c.env.DB, home)
  const today = dateInZone(home.timezone)
  const result = await c.env.DB.prepare(`SELECT o.*,t.title,t.room_id room,t.icon,t.frequency,t.active,n.created_at nudged_at,n.actor_id nudged_by FROM task_occurrences o
    JOIN tasks t ON t.id=o.task_id LEFT JOIN task_nudges n ON n.occurrence_id=o.id WHERE t.home_id=? AND (o.completed_at IS NULL OR o.completed_at>?)
    ORDER BY o.due_date,t.title`).bind(home.id, now() - 30 * 86400).all()
  const routines = await c.env.DB.prepare('SELECT id,title,room_id room,active,frequency,points FROM tasks WHERE home_id=? ORDER BY created_at DESC').bind(home.id).all()
  const scores = await c.env.DB.prepare(`SELECT m.user_id userId,
    COALESCE(SUM(o.points),0) points, COUNT(o.id) completed FROM home_members m
    LEFT JOIN (task_occurrences o JOIN tasks t ON t.id=o.task_id)
      ON o.completed_by=m.user_id AND o.completed_at IS NOT NULL AND t.home_id=m.home_id
    WHERE m.home_id=? GROUP BY m.user_id ORDER BY points DESC,m.user_id`).bind(home.id).all()
  return c.json({ occurrences: result.results, routines: routines.results, scores: scores.results, today })
})

tasks.post('/', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const data = await c.req.json().catch(() => null) as Record<string, unknown> | null
  const title = typeof data?.title === 'string' ? data.title.trim() : ''
  const room = typeof data?.room === 'string' ? data.room : ''
  const icon = typeof data?.icon === 'string' ? data.icon : ''
  const frequency = typeof data?.frequency === 'string' ? data.frequency : ''
  const firstDate = typeof data?.firstDate === 'string' ? data.firstDate : ''
  const people = Array.isArray(data?.participants) ? data.participants : []
  const points = data?.points ?? 10
  const today = dateInZone(home.timezone)
  const selectedRoom=await c.env.DB.prepare('SELECT kind FROM rooms WHERE id=? AND home_id=?').bind(room,home.id).first<{kind:string}>()
  if (typeof points !== 'number' || !Number.isInteger(points) || points < 5 || points > 100 || title.length < 2 || title.length > 80 || !selectedRoom
    || !['dishes','trash','clean','laundry'].includes(icon) || !['daily','weekly'].includes(frequency)
    || !/^\d{4}-\d{2}-\d{2}$/.test(firstDate) || !Number.isFinite(dayNumber(firstDate))
    || dateString(dayNumber(firstDate)) !== firstDate || firstDate < today || dayNumber(firstDate) > dayNumber(today) + 365
    || people.length < 1 || people.length > 6 || new Set(people).size !== people.length || people.some(p => typeof p !== 'string')) {
    return c.json({ error: 'Revisá los datos de la tarea, la fecha y sus participantes.' }, 400)
  }
  const members = await c.env.DB.prepare('SELECT user_id FROM home_members WHERE home_id=?').bind(home.id).all<{ user_id: string }>()
  if (people.some(p => !members.results.some(m => m.user_id === p))) return c.json({ error: 'Los participantes deben pertenecer a la casa.' }, 400)
  const id = crypto.randomUUID()
  await c.env.DB.batch([
    c.env.DB.prepare('INSERT INTO tasks (id,home_id,title,room,icon,frequency,first_date,created_at,points,room_id) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(id, home.id, title, selectedRoom.kind, icon, frequency, firstDate, now(), points, room),
    ...people.map((p, index) => c.env.DB.prepare('INSERT INTO task_participants (task_id,user_id,position) VALUES (?,?,?)').bind(id, p, index)),
  ])
  const event: GameEvent = { id: crypto.randomUUID(), kind: 'task.created', actorId: c.get('user').id,
    actorName: c.get('user').display_name, targetId: people[0] as string, occurrenceId: `${id}:${firstDate}`,
    title, room: room as GameEvent['room'], points: points as number, createdAt: now() }
  broadcast(c, home.id, event)
  return c.json({ id, event }, 201)
})

tasks.post('/:id/complete', async c => {
  const user = c.get('user')
  const home = await membership(c.env.DB, user.id)
  if (!home) return c.json({ error: 'No tenés una casa.' }, 403)
  const id = c.req.param('id')
  const key = crypto.randomUUID()
  const timestamp = now()
  const result = await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE task_occurrences SET completed_at=?,completed_by=?,action_key=?
      WHERE id=? AND assignee=? AND completed_at IS NULL AND due_date<=?
      AND task_id IN (SELECT id FROM tasks WHERE home_id=?)`).bind(timestamp,user.id,key,id,user.id,dateInZone(home.timezone),home.id),
    c.env.DB.prepare(`INSERT INTO activity_events (id,home_id,occurrence_id,actor_id,action,created_at)
      SELECT ?,?,id,?,'completed',? FROM task_occurrences WHERE id=? AND action_key=?`).bind(key,home.id,user.id,timestamp,id,key),
  ])
  if (!result[0].meta.changes) return c.json({ error: 'La tarea cambió, todavía no vence o no está asignada a vos.' }, 409)
  const event = await occurrenceEvent(c, id, key, 'task.completed')
  broadcast(c, home.id, event)
  return c.json({ ok: true, completedAt: timestamp, event })
})

tasks.post('/:id/undo', async c => {
  const user = c.get('user')
  const home = await membership(c.env.DB, user.id)
  if (!home) return c.json({ error: 'No tenés una casa.' }, 403)
  const key = crypto.randomUUID(), id = c.req.param('id'), timestamp = now()
  const result = await c.env.DB.batch([
    c.env.DB.prepare(`UPDATE task_occurrences SET completed_at=NULL,completed_by=NULL,action_key=?
      WHERE id=? AND assignee=? AND completed_by=? AND completed_at>=?
      AND task_id IN (SELECT id FROM tasks WHERE home_id=?)`).bind(key,id,user.id,user.id,timestamp-10,home.id),
    c.env.DB.prepare(`INSERT INTO activity_events (id,home_id,occurrence_id,actor_id,action,created_at)
      SELECT ?,?,id,?,'undone',? FROM task_occurrences WHERE id=? AND action_key=?`).bind(key,home.id,user.id,timestamp,id,key),
  ])
  if (!result[0].meta.changes) return c.json({ error: 'Ya pasó el tiempo para deshacer.' }, 409)
  const event = await occurrenceEvent(c, id, key, 'task.undone')
  broadcast(c, home.id, event)
  return c.json({ ok: true, event })
})

tasks.post('/:id/pause', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home || home.role !== 'admin') return c.json({ error: 'No tenés permiso.' }, 403)
  const result = await c.env.DB.prepare('UPDATE tasks SET active=0 WHERE id=? AND home_id=?').bind(c.req.param('id'),home.id).run()
  if (!result.meta.changes) return c.json({ error: 'Tarea no encontrada.' }, 404)
  return c.json({ ok: true })
})

tasks.get('/history', async c => {
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'No tenés una casa.' }, 403)
  const result = await c.env.DB.prepare(`SELECT e.*, t.title, t.room_id room, u.display_name, o.due_date
    FROM activity_events e JOIN task_occurrences o ON o.id=e.occurrence_id
    JOIN tasks t ON t.id=o.task_id JOIN users u ON u.id=e.actor_id
    WHERE e.home_id=? ORDER BY e.created_at DESC,e.rowid DESC LIMIT 100`).bind(home.id).all()
  return c.json({ events: result.results })
})

function broadcast(c: Context<AppEnv>, homeId: string, event: GameEvent) {
  c.executionCtx.waitUntil(publishGameEvent(c.env, homeId, event).catch(error => console.error('Game event failed', error)))
}
async function occurrenceEvent(c: Context<AppEnv>, id: string, eventId: string, kind: GameEvent['kind']): Promise<GameEvent> {
  const row = await c.env.DB.prepare(`SELECT o.assignee targetId,t.title,t.room_id room,o.points
    FROM task_occurrences o JOIN tasks t ON t.id=o.task_id WHERE o.id=?`)
    .bind(id).first<{targetId:string;title:string;room:GameEvent['room'];points:number}>()
  if (!row) throw new Error('Occurrence not found after mutation')
  return { ...row, id: eventId, kind, actorId: c.get('user').id, actorName: c.get('user').display_name, occurrenceId: id, createdAt: now() }
}

tasks.post('/:id/nudge', async c => {
  const user = c.get('user'), home = await membership(c.env.DB, user.id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const occurrenceId = c.req.param('id'), id = crypto.randomUUID(), timestamp = now()
  // A household-wide five-minute cooldown per occurrence, checked atomically with task eligibility.
  const result = await c.env.DB.prepare(`INSERT INTO task_nudges (occurrence_id,id,actor_id,target_id,created_at)
    SELECT o.id,?,?,o.assignee,? FROM task_occurrences o JOIN tasks t ON t.id=o.task_id
    WHERE o.id=? AND t.home_id=? AND o.completed_at IS NULL AND o.assignee<>? AND o.due_date<=?
    ON CONFLICT(occurrence_id) DO UPDATE SET id=excluded.id,actor_id=excluded.actor_id,
      target_id=excluded.target_id,created_at=excluded.created_at WHERE task_nudges.created_at<=?`)
    .bind(id,user.id,timestamp,occurrenceId,home.id,user.id,dateInZone(home.timezone),timestamp-300).run()
  if (!result.meta.changes) return c.json({ error: 'Solo podés recordar pendientes de otra persona. Si ya hubo un reto, esperá cinco minutos.' }, 409)
  const event = await occurrenceEvent(c, occurrenceId, id, 'task.nudged')
  broadcast(c, home.id, event)
  return c.json({ ok: true, event })
})

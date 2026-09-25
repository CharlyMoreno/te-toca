import { Hono } from 'hono'
import { initialRoomKinds, roomCatalog, roomKinds, type RoomKind, type RoomRecord } from '../shared/rooms'
import { now, requireUser } from './security'
import { membership } from './tasks'
import type { AppEnv } from './types'

export function initialRooms(db:D1Database,homeId:string,timestamp:number) {
  return initialRoomKinds.map((kind,slot)=>db.prepare('INSERT INTO rooms (id,home_id,name,kind,slot,created_at,room_type) VALUES (?,?,?,?,?,?,?)')
    .bind(`${homeId}:${kind}`,homeId,roomCatalog[kind].name,kind,slot,timestamp,kind))
}
export const roomsApi=new Hono<AppEnv>()
roomsApi.use('*',requireUser)
roomsApi.get('/',async c=>{
  const home=await membership(c.env.DB,c.get('user').id)
  if(!home)return c.json({error:'Primero necesitás una casa.'},403)
  const result=await c.env.DB.prepare('SELECT id,name,room_type kind,slot FROM rooms WHERE home_id=? ORDER BY slot').bind(home.id).all<RoomRecord>()
  return c.json({rooms:result.results})
})
roomsApi.post('/',async c=>{
  const home=await membership(c.env.DB,c.get('user').id)
  if(!home||home.role!=='admin')return c.json({error:'Solo quien administra puede ampliar la casa.'},403)
  const data=await c.req.json().catch(()=>null) as {name?:unknown;kind?:unknown}|null
  const name=typeof data?.name==='string'?data.name.trim().replace(/\s+/g,' '):''
  if(name.length<2||name.length>32||!roomKinds.includes(data?.kind as RoomKind))return c.json({error:'Elegí el tipo y un nombre de 2 a 32 caracteres.'},400)
  const id=crypto.randomUUID()
  const kind=data!.kind as RoomKind
  const legacyKind=kind==='garage'||kind==='garden'?'living':kind
  // Pick a free slot inside one statement to avoid concurrent additions exceeding the limit.
  const result=await c.env.DB.prepare(`WITH RECURSIVE slots(n) AS (SELECT 0 UNION ALL SELECT n+1 FROM slots WHERE n<11)
    INSERT INTO rooms (id,home_id,name,kind,slot,created_at,room_type)
    SELECT ?,?,?,?,n,?,? FROM slots WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE home_id=? AND slot=n)
    ORDER BY n LIMIT 1`).bind(id,home.id,name,legacyKind,now(),kind,home.id).run()
  if(!result.meta.changes)return c.json({error:'La casa admite hasta 12 ambientes.'},409)
  return c.json({id},201)
})
roomsApi.patch('/:id',async c=>{
  const home=await membership(c.env.DB,c.get('user').id)
  if(!home||home.role!=='admin')return c.json({error:'Solo quien administra puede editar ambientes.'},403)
  const data=await c.req.json().catch(()=>null) as {name?:unknown}|null
  const name=typeof data?.name==='string'?data.name.trim().replace(/\s+/g,' '):''
  if(name.length<2||name.length>32)return c.json({error:'Escribí un nombre de 2 a 32 caracteres.'},400)
  const result=await c.env.DB.prepare('UPDATE rooms SET name=? WHERE id=? AND home_id=?').bind(name,c.req.param('id'),home.id).run()
  if(!result.meta.changes)return c.json({error:'Ambiente no encontrado.'},404)
  return c.json({ok:true})
})
roomsApi.delete('/:id',async c=>{
  const home=await membership(c.env.DB,c.get('user').id)
  if(!home||home.role!=='admin')return c.json({error:'Solo quien administra puede quitar ambientes.'},403)
  const result=await c.env.DB.prepare(`DELETE FROM rooms WHERE id=? AND home_id=?
    AND (SELECT count(*) FROM rooms WHERE home_id=?)>1
    AND NOT EXISTS (SELECT 1 FROM tasks WHERE room_id=rooms.id)`).bind(c.req.param('id'),home.id,home.id).run()
  if(!result.meta.changes)return c.json({error:'Solo se puede quitar un ambiente sin tareas, conservando al menos uno en la casa.'},409)
  return c.json({ok:true})
})

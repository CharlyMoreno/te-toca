import { emotes, type EmoteEvent, type Emote } from '../shared/emotes'
import { Hono } from 'hono'
import { requireUser } from './security'
import { membership } from './tasks'
import type { AppEnv } from './types'

type Connection = {
  userId: string; homeId: string; sessionHash: string;
  room: string | null; active: boolean; movedAt: number; seenAt: number;
  windowStart: number; messages: number; lastEmoteAt?: number;
}
const roomIds = ['kitchen', 'bathroom', 'bedroom', 'living']
const timeout = 70_000

// One object per household; all identity headers are supplied by our authenticated Worker.
export class HousePresence implements DurableObject {
  constructor(private state: DurableObjectState, private env: AppEnv['Bindings']) {}

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname
    if (path === '/event' && request.method === 'POST') {
      this.broadcast({ type: 'game', event: await request.json() })
      return new Response(null, { status: 204 })
    }
    if (path === '/invalidate' && request.method === 'POST') {
      this.broadcast({ type: 'changed' })
      return new Response(null, { status: 204 })
    }
    if (path !== '/connect' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket required', { status: 426 })
    }
    const userId = request.headers.get('X-User-Id')!
    const homeId = request.headers.get('X-Home-Id')!
    const sessionHash = request.headers.get('X-Session-Hash')!
    if (!userId || !homeId || !sessionHash || !await this.authorized({ userId, homeId, sessionHash })) {
      return new Response('Unauthorized', { status: 401 })
    }
    const sockets = this.state.getWebSockets()
    if (sockets.length >= 24 || sockets.filter(ws => this.data(ws).userId === userId).length >= 4) {
      return new Response('Demasiadas pestañas abiertas.', { status: 429 })
    }
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    const timestamp = Date.now()
    this.state.acceptWebSocket(server)
    server.serializeAttachment({ userId, homeId, sessionHash, room: null, active: true,
      movedAt: timestamp, seenAt: timestamp, windowStart: timestamp, messages: 0 } satisfies Connection)
    const alarm = await this.state.storage.getAlarm()
    if (alarm === null || alarm > timestamp + 30_000) await this.state.storage.setAlarm(timestamp + 30_000)
    this.snapshot()
    return new Response(null, { status: 101, webSocket: client })
  }

  private data(ws: WebSocket): Connection { return ws.deserializeAttachment() as Connection }
  private async authorized(data: Pick<Connection, 'userId' | 'homeId' | 'sessionHash'>) {
    return Boolean(await this.env.DB.prepare(`SELECT 1 FROM sessions s JOIN home_members m ON m.user_id=s.user_id
      WHERE s.token_hash=? AND s.user_id=? AND s.expires_at>? AND m.home_id=?`)
      .bind(data.sessionHash, data.userId, Math.floor(Date.now() / 1000), data.homeId).first())
  }
  private broadcast(message: unknown, exclude?: WebSocket) {
    const text = JSON.stringify(message)
    for (const ws of this.state.getWebSockets()) {
      if (ws === exclude || ws.readyState !== 1) continue
      try { ws.send(text) } catch { try { ws.close(1011, 'Connection lost') } catch { /* Already closed. */ } }
    }
  }
  private snapshot(exclude?: WebSocket) {
    const people = new Map<string, Connection>()
    for (const ws of this.state.getWebSockets()) {
      if (ws === exclude || ws.readyState !== 1) continue
      const data = this.data(ws)
      if (Date.now() - data.seenAt > timeout) continue
      const previous = people.get(data.userId)
      // Prefer a visible tab; otherwise the most recently moved tab wins.
      if (!previous || (data.active && !previous.active) || (data.active === previous.active && data.movedAt > previous.movedAt)) {
        people.set(data.userId, data)
      }
    }
    this.broadcast({ type: 'presence', people: [...people.values()].map(p => ({ userId: p.userId, room: p.room, active: p.active })) }, exclude)
  }
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string' || message.length > 512) { ws.close(1009, 'Message too large'); this.snapshot(ws); return }
    const data = this.data(ws), timestamp = Date.now()
    if (timestamp - data.windowStart > 10_000) { data.windowStart = timestamp; data.messages = 0 }
    if (++data.messages > 60) { ws.close(1008, 'Too many messages'); this.snapshot(ws); return }
    let event: { type?: unknown; room?: unknown; active?: unknown; emoji?: unknown; targetId?: unknown }
    try { event = JSON.parse(message) } catch { ws.close(1008, 'Invalid message'); this.snapshot(ws); return }
    if (!event || (event.type !== 'ping' && event.type !== 'move' && event.type !== 'emote')) { ws.close(1008, 'Invalid message'); this.snapshot(ws); return }
    if (event.type === 'emote') {
      if (!emotes.some(item=>item.emoji===event.emoji) || typeof event.targetId!=='string' || event.targetId.length>64) {
        ws.close(1008,'Invalid reaction');this.snapshot(ws);return
      }
      // Persist rate limits before the asynchronous checks so rapid messages cannot race them.
      if(timestamp-(data.lastEmoteAt??0)<1500)return
      data.lastEmoteAt=timestamp;data.seenAt=timestamp;ws.serializeAttachment(data)
      if(!await this.authorized(data)){ws.close(4001,'Session ended');this.snapshot(ws);return}
      const target=await this.env.DB.prepare('SELECT 1 FROM home_members WHERE home_id=? AND user_id=?')
        .bind(data.homeId,event.targetId).first()
      if(!target)return
      const reaction:EmoteEvent={id:crypto.randomUUID(),userId:data.userId,targetId:event.targetId,emoji:event.emoji as Emote}
      this.broadcast({type:'emote',event:reaction})
      return
    }
    if (event.type === 'move') {
      if ((event.room !== null && !roomIds.includes(event.room as string)) || typeof event.active !== 'boolean') {
        ws.close(1008, 'Invalid room'); this.snapshot(ws); return
      }
      data.room = event.room as string | null; data.active = event.active; data.movedAt = timestamp
    }
    data.seenAt = timestamp
    ws.serializeAttachment(data)
    if (event.type === 'move') this.snapshot()
    else ws.send(JSON.stringify({ type: 'pong' }))
  }
  webSocketClose(ws: WebSocket, code: number) {
    try { ws.close(code === 1006 ? 1000 : code, 'Disconnected') } catch { /* Already closed. */ }
    this.snapshot(ws)
  }
  webSocketError(ws: WebSocket) { try { ws.close(1011, 'Connection lost') } catch { /* Already closed. */ }; this.snapshot(ws) }
  async alarm() {
    for (const ws of this.state.getWebSockets()) {
      const data = this.data(ws)
      if (!await this.authorized(data)) ws.close(4001, 'Session ended')
      else if (Date.now() - data.seenAt > timeout) ws.close(4000, 'Connection timed out')
    }
    this.snapshot()
    if (this.state.getWebSockets().some(ws => ws.readyState === 1)) await this.state.storage.setAlarm(Date.now() + 30_000)
  }
}

export const presence = new Hono<AppEnv>()
presence.get('/', requireUser, async c => {
  if (c.req.header('Origin') !== new URL(c.req.url).origin) return c.json({ error: 'Origen no permitido.' }, 403)
  if (c.req.header('Upgrade')?.toLowerCase() !== 'websocket') return c.json({ error: 'Se requiere WebSocket.' }, 426)
  const home = await membership(c.env.DB, c.get('user').id)
  if (!home) return c.json({ error: 'Primero necesitás una casa.' }, 403)
  const id = c.env.HOUSE_PRESENCE.idFromName(home.id)
  return c.env.HOUSE_PRESENCE.get(id).fetch(new Request('https://presence/connect', {
    headers: { Upgrade: 'websocket', 'X-User-Id': c.get('user').id, 'X-Home-Id': home.id, 'X-Session-Hash': c.get('sessionHash') },
  }))
})

export async function notifyHouse(env: AppEnv['Bindings'], userId: string) {
  const home = await membership(env.DB, userId)
  if (home) await env.HOUSE_PRESENCE.get(env.HOUSE_PRESENCE.idFromName(home.id))
    .fetch(new Request('https://presence/invalidate', { method: 'POST' }))
}

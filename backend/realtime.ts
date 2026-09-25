import type { GameEvent } from '../shared/game'
import type { AppEnv } from './types'

// Only server code can access this Durable Object binding.
export async function publishGameEvent(env: AppEnv['Bindings'], homeId: string, event: GameEvent) {
  const response = await env.HOUSE_PRESENCE.get(env.HOUSE_PRESENCE.idFromName(homeId)).fetch(
    new Request('https://presence/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }),
  )
  if (!response.ok) throw new Error('Could not publish household event')
}

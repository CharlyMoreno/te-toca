import type { AvatarConfig } from '../../../shared/avatar'
export type RoomId = string
export type { HouseRoom, RoomRecord } from '../../../shared/rooms'
export type Person = { id: string; display_name: string; role?: string; avatar?: AvatarConfig }
export type House = { id: string; name: string; timezone: string; role: 'admin' | 'member' }
export type Occurrence = {
  id: string; task_id: string; title: string; room: RoomId; icon: string;
  due_date: string; assignee: string; completed_at: number | null; completed_by: string | null;
  frequency: string; active: number; points: number; nudged_at: number | null; nudged_by: string | null
}
export type Routine = { id: string; title: string; room: RoomId; active: number; frequency: string }
export const colors = ['#ec896a','#a18bcd','#74b1a1','#e5b665','#7da4ca','#d895b4']
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method, credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error ?? 'No pudimos guardar el cambio.')
  return data as T
}

export type RoomId = 'kitchen' | 'bathroom' | 'bedroom' | 'living'
export type Person = { id: string; display_name: string; role?: string }
export type House = { id: string; name: string; timezone: string; role: 'admin' | 'member' }
export type Occurrence = {
  id: string; task_id: string; title: string; room: RoomId; icon: string;
  due_date: string; assignee: string; completed_at: number | null; completed_by: string | null;
  frequency: string; active: number
}
export type Routine = { id: string; title: string; room: RoomId; active: number; frequency: string }
export const rooms: { id: RoomId; name: string; color: string; floor: string; position: [number, number]; icon: string; suggestion: string }[] = [
  { id: 'kitchen', name: 'Cocina', color: '#e39464', floor: '#eed8bd', position: [-3.2,-3.2], icon: 'dishes', suggestion: 'Lavar los platos' },
  { id: 'bathroom', name: 'Baño', color: '#69a6a0', floor: '#d4e7e2', position: [3.2,-3.2], icon: 'clean', suggestion: 'Limpiar el baño' },
  { id: 'bedroom', name: 'Dormitorio', color: '#9b87bf', floor: '#e1d9eb', position: [-3.2,3.2], icon: 'laundry', suggestion: 'Ordenar el dormitorio' },
  { id: 'living', name: 'Living', color: '#d87e73', floor: '#f0d9ce', position: [3.2,3.2], icon: 'clean', suggestion: 'Barrer el living' },
]
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

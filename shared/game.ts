export type GameEvent = {
  id: string
  kind: 'task.created' | 'task.completed' | 'task.undone' | 'task.nudged'
  actorId: string
  actorName: string
  targetId: string
  occurrenceId: string
  title: string
  room: string
  points: number
  createdAt: number
}
export type Score = { userId: string; points: number; completed: number }

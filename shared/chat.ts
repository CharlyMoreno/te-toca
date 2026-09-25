export const chatMaxLength = 160
export const chatBubbleDuration = 8000
export type ChatMessage = { id: string; userId: string; text: string }
export function chatText(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > chatMaxLength) return null
  const text = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return text || null
}

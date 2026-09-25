export const skinColors = ['#f7d9bd', '#edbb98', '#d79c74', '#b87c56', '#885536', '#55382c'] as const
export const hairColors = ['#302a30', '#624133', '#9b6039', '#d9b66f', '#d3d0c8', '#a981c7', '#d8809a'] as const
export const shirtColors = ['#ec896a', '#a18bcd', '#74b1a1', '#e5b665', '#7da4ca', '#d895b4', '#445368'] as const
export const pantsColors = ['#4b4b64', '#364e62', '#7a6553', '#eee1cd'] as const
export const hairStyles = ['short', 'curly', 'long', 'bun', 'bald'] as const
export type AvatarConfig = {
  skin: string
  hairColor: string
  hairStyle: typeof hairStyles[number]
  shirt: string
  pants: string
  glasses: boolean
}
export const defaultAvatar: AvatarConfig = {
  skin: skinColors[1], hairColor: hairColors[0], hairStyle: 'short',
  shirt: shirtColors[0], pants: pantsColors[0], glasses: false,
}
export function isAvatar(value: unknown): value is AvatarConfig {
  if (!value || typeof value !== 'object') return false
  const a = value as Record<string, unknown>
  return [
    [skinColors, a.skin], [hairColors, a.hairColor], [hairStyles, a.hairStyle],
    [shirtColors, a.shirt], [pantsColors, a.pants],
  ].every(([choices, selected]) => (choices as readonly unknown[]).includes(selected)) && typeof a.glasses === 'boolean'
}
export function parseAvatar(json: string | null): AvatarConfig {
  try { const value: unknown = JSON.parse(json ?? '{}'); return isAvatar(value) ? value : { ...defaultAvatar } }
  catch { return { ...defaultAvatar } }
}

export const petKinds = ['dog', 'cat'] as const
export type PetKind = typeof petKinds[number]
export const petCatalog = { dog: { name: 'Perro', emoji: '🐶' }, cat: { name: 'Gato', emoji: '🐱' } }
export const petColors = ['#b78354', '#e6d2ad', '#55545a', '#ede8df', '#c77540', '#8d8580'] as const
export const petLimit = 6
export type Pet = { id: string; name: string; kind: PetKind; color: string; created_at: number }

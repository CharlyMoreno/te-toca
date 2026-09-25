import { compare, hash, truncates } from 'bcryptjs'

export const passwordCost = 12
// Public dummy hash used to do the same expensive work for unknown usernames.
const dummyHash = '$2b$12$S3EphBvornb8nAzgUjB1quzi2ZV1hZK35a0m5twTXCTff7W6OaPM2'
export function credentials(body: unknown) {
  const value = body as { username?: unknown; password?: unknown } | null
  const username = typeof value?.username === 'string' ? value.username.trim().toLowerCase() : ''
  const password = typeof value?.password === 'string' ? value.password : ''
  if (!/^[a-z0-9_.-]{3,24}$/.test(username)) return { error: 'Elegí un usuario de 3 a 24 caracteres: letras, números, punto, guion o guion bajo.' } as const
  if (password.length < 6 || password.length > 64 || truncates(password)) return { error: 'Usá una contraseña de 6 a 64 caracteres (hasta 72 bytes).' } as const
  return { username, password } as const
}
export function hashPassword(password: string) { return hash(password, passwordCost) }
export function verifyPassword(password: string, stored: string | undefined) { return compare(password, stored ?? dummyHash) }

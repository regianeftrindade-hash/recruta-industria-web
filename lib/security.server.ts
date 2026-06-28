import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const resetTokens = new Map<
  string,
  {
    email: string
    expires: number
  }
>()

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generatePasswordResetToken(email: string): string {
  const token = crypto.randomBytes(32).toString('hex')

  resetTokens.set(token, {
    email,
    expires: Date.now() + 1000 * 60 * 30 // 30 minutos
  })

  return token
}

export async function verifyPasswordResetToken(
  token: string
): Promise<string | null> {
  const data = resetTokens.get(token)

  if (!data) return null

  if (Date.now() > data.expires) {
    resetTokens.delete(token)
    return null
  }

  return data.email
}

export function consumePasswordResetToken(token: string): void {
  resetTokens.delete(token)
}
import bcrypt from 'bcryptjs';

// senha
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// reset de senha
const resetTokens = new Map<string, string>();

export function generatePasswordResetToken(email: string) {
  const token = Math.random().toString(36).substring(2);
  resetTokens.set(token, email);
  return token;
}

export function verifyPasswordResetToken(token: string) {
  return resetTokens.get(token) || null;
}

export function consumePasswordResetToken(token: string) {
  resetTokens.delete(token);
}
// Server-only security helpers (must not be imported by client components)

import bcrypt from 'bcryptjs';

// Hash senha
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Password reset tokens (memória)
const passwordResetTokens = new Map<string, { token: string; email: string; timestamp: number }>();

export function generatePasswordResetToken(email: string): string {
  const token = Buffer.from(`${email}-${Date.now()}-${Math.random()}`).toString('base64');
  passwordResetTokens.set(token, { token, email, timestamp: Date.now() });
  return token;
}

export function verifyPasswordResetToken(token: string): string | null {
  const stored = passwordResetTokens.get(token);
  if (!stored) return null;
  if ((Date.now() - stored.timestamp) > 3600000) {
    passwordResetTokens.delete(token);
    return null;
  }
  return stored.email;
}

export function consumePasswordResetToken(token: string): void {
  passwordResetTokens.delete(token);
}

// CSRF tokens
const csrfTokens = new Map<string, { token: string; timestamp: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  csrfTokens.set(sessionId, { token, timestamp: Date.now() });
  return token;
}

export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;

  if ((Date.now() - stored.timestamp) > 3600000) {
    csrfTokens.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

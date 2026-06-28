// Server-only security helpers (must not be imported by client components)

// Hash de senha usando bcryptjs (dinâmico)
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined') throw new Error('hashPassword só pode ser executada no servidor');
  const bcryptjs = await import('bcryptjs');
  return await bcryptjs.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof window !== 'undefined') throw new Error('verifyPassword só pode ser executada no servidor');
  const bcryptjs = await import('bcryptjs');
  return await bcryptjs.compare(password, hash);
}

// Password reset token storage (in-memory). Server-only.
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

// CSRF tokens (server-only)
const csrfTokens = new Map<string, { token: string; timestamp: number }>();

export function generateCSRFToken(sessionId: string): string {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  createAdmin2faToken,
  verifyAdmin2faToken,
} from '@/lib/security/admin-2fa-edge';

describe('admin 2FA token', () => {
  const prev = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = 'teste-secreto-admin-2fa';
  });

  afterEach(() => {
    process.env.NEXTAUTH_SECRET = prev;
  });

  it('valida token do mesmo e-mail', () => {
    const token = createAdmin2faToken('Admin@Recruta.com');
    expect(verifyAdmin2faToken(token, 'admin@recruta.com')).toBe(true);
  });

  it('rejeita e-mail diferente ou token inválido', () => {
    const token = createAdmin2faToken('admin@recruta.com');
    expect(verifyAdmin2faToken(token, 'outro@recruta.com')).toBe(false);
    expect(verifyAdmin2faToken(undefined, 'admin@recruta.com')).toBe(false);
    expect(verifyAdmin2faToken('lixo', 'admin@recruta.com')).toBe(false);
  });
});

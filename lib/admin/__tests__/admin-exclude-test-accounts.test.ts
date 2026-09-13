import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getAdminExactTestEmails,
  isAdminExcludedTestAccount,
  sumPaidExcludingTestEmails,
} from '@/lib/admin/admin-exclude-test-accounts';

describe('admin-exclude-test-accounts', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('exclui bypass paizaonacozinha sem precisar de env', () => {
    expect(isAdminExcludedTestAccount({ email: 'paizaonacozinha@gmail.com' })).toBe(true);
    expect(isAdminExcludedTestAccount({ companyName: 'Paizao Na Cozinha LTDA' })).toBe(true);
    expect(isAdminExcludedTestAccount({ email: 'cliente-real@empresa.com.br' })).toBe(false);
  });

  it('exclui e-mails E2E e ADMIN_EXCLUDE_TEST_EMAILS', () => {
    vi.stubEnv('E2E_COMPANY_EMAIL', 'empresa-e2e@teste.com');
    vi.stubEnv('E2E_PROFESSIONAL_EMAIL', 'pro-e2e@teste.com');
    vi.stubEnv('ADMIN_EXCLUDE_TEST_EMAILS', 'extra@teste.com, outro@teste.com');

    expect(getAdminExactTestEmails()).toEqual(
      expect.arrayContaining([
        'empresa-e2e@teste.com',
        'pro-e2e@teste.com',
        'extra@teste.com',
        'outro@teste.com',
      ]),
    );
    expect(isAdminExcludedTestAccount({ email: 'empresa-e2e@teste.com' })).toBe(true);
    expect(isAdminExcludedTestAccount({ email: 'extra@teste.com' })).toBe(true);
  });

  it('soma pagamentos ignorando customer de teste', () => {
    const result = sumPaidExcludingTestEmails(
      [
        { amount: 10000, customer: JSON.stringify({ email: 'paizaonacozinha@gmail.com' }) },
        { amount: 5000, customer: JSON.stringify({ email: 'real@empresa.com.br' }) },
        { amount: 2000, customer: null },
      ],
      [],
    );
    expect(result.collectedCentavos).toBe(7000);
    expect(result.collectedPayments).toBe(2);
  });
});

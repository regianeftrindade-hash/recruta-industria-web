import { describe, expect, it } from 'vitest';
import { paymentBelongsToUser } from '@/lib/payment/payment-activation';

describe('paymentBelongsToUser', () => {
  it('aceita meta de assinatura empresa do dono', () => {
    const meta = JSON.stringify({
      type: 'company_subscription',
      planTier: 'BASIC',
      companyUserId: 'u1',
      expectedAmount: 24900,
    });
    expect(paymentBelongsToUser(meta, 'u1')).toBe(true);
    expect(paymentBelongsToUser(meta, 'outro')).toBe(false);
  });

  it('aceita meta de assentos extras', () => {
    const meta = JSON.stringify({
      type: 'company_extra_seats',
      companyUserId: 'u2',
      quantity: 1,
      expectedAmount: 2990,
    });
    expect(paymentBelongsToUser(meta, 'u2')).toBe(true);
  });

  it('aceita meta profissional', () => {
    const meta = JSON.stringify({
      type: 'professional_subscription',
      planTier: 'PREMIUM',
      professionalUserId: 'p1',
      expectedAmount: 1990,
    });
    expect(paymentBelongsToUser(meta, 'p1')).toBe(true);
    expect(paymentBelongsToUser(meta, 'p2')).toBe(false);
  });

  it('rejeita meta inválida', () => {
    expect(paymentBelongsToUser(null, 'u1')).toBe(false);
    expect(paymentBelongsToUser('{', 'u1')).toBe(false);
    expect(paymentBelongsToUser(JSON.stringify({ type: 'x' }), 'u1')).toBe(false);
  });
});

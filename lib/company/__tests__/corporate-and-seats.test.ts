import { describe, expect, it } from 'vitest';
import {
  corporateEmailError,
  isCorporateEmail,
} from '@/lib/company/corporate-email';
import { calcExtraSeatsAmountCentavos } from '@/lib/company/company-extra-seats';
import { asCompanyExtraSeatsPaymentMeta } from '@/lib/payment-config';

describe('e-mail corporativo', () => {
  it('aceita domínio de empresa', () => {
    expect(isCorporateEmail('rh@industria.com.br')).toBe(true);
    expect(corporateEmailError('rh@industria.com.br')).toBeNull();
  });

  it('bloqueia Gmail e similares', () => {
    expect(isCorporateEmail('a@gmail.com')).toBe(false);
    expect(corporateEmailError('a@gmail.com')).toMatch(/corporativo/i);
  });

  it('libera Gmail com ALLOW_FREE_CORPORATE_EMAIL', () => {
    const prev = process.env.ALLOW_FREE_CORPORATE_EMAIL;
    process.env.ALLOW_FREE_CORPORATE_EMAIL = 'true';
    expect(corporateEmailError('a@gmail.com')).toBeNull();
    if (prev === undefined) delete process.env.ALLOW_FREE_CORPORATE_EMAIL;
    else process.env.ALLOW_FREE_CORPORATE_EMAIL = prev;
  });

  it('libera Gmail na conta bypass paizaonacozinha', () => {
    expect(corporateEmailError('paizaonacozinha@gmail.com')).toBeNull();
  });
});

describe('assentos extras', () => {
  it('calcula pacotes 1/3/5', () => {
    expect(calcExtraSeatsAmountCentavos(1)).toBe(2990);
    expect(calcExtraSeatsAmountCentavos(3)).toBe(7990);
    expect(calcExtraSeatsAmountCentavos(5)).toBe(11990);
  });

  it('rejeita quantidade sem pacote', () => {
    expect(() => calcExtraSeatsAmountCentavos(2)).toThrow(/INVALID_PACKAGE/);
  });

  it('parseia meta de assentos', () => {
    const meta = JSON.stringify({
      type: 'company_extra_seats',
      companyUserId: 'c1',
      quantity: 3,
      expectedAmount: 7990,
    });
    expect(asCompanyExtraSeatsPaymentMeta(meta)?.quantity).toBe(3);
    expect(asCompanyExtraSeatsPaymentMeta(JSON.stringify({ type: 'x' }))).toBeNull();
  });
});

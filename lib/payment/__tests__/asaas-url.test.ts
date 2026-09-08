import { describe, expect, it } from 'vitest';
import { normalizeAsaasApiUrl } from '@/lib/payment/asaas-client';

describe('normalizeAsaasApiUrl', () => {
  it('usa produção quando vazio', () => {
    expect(normalizeAsaasApiUrl('', true)).toBe('https://api.asaas.com');
  });

  it('usa sandbox quando vazio fora de produção', () => {
    expect(normalizeAsaasApiUrl('', false)).toBe('https://api-sandbox.asaas.com');
  });

  it('remove /v3 duplicado', () => {
    expect(normalizeAsaasApiUrl('https://api.asaas.com/v3', true)).toBe('https://api.asaas.com');
    expect(normalizeAsaasApiUrl('https://api-sandbox.asaas.com/v3/', false)).toBe(
      'https://api-sandbox.asaas.com',
    );
  });

  it('corrige URL do site www.asaas.com/api/v3', () => {
    expect(normalizeAsaasApiUrl('https://www.asaas.com/api/v3', true)).toBe('https://api.asaas.com');
    expect(normalizeAsaasApiUrl('https://asaas.com/api', true)).toBe('https://api.asaas.com');
  });
});

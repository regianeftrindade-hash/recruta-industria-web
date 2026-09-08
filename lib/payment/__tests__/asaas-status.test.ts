import { describe, expect, it } from 'vitest';
import {
  extractAsaasPaymentId,
  extractAsaasPaymentStatus,
  mapAsaasPaymentStatus,
} from '@/lib/payment/asaas-client';

describe('mapAsaasPaymentStatus', () => {
  it('mapeia status pagos e cancelados', () => {
    expect(mapAsaasPaymentStatus('RECEIVED')).toBe('PAID');
    expect(mapAsaasPaymentStatus('CONFIRMED')).toBe('PAID');
    expect(mapAsaasPaymentStatus('REFUNDED')).toBe('DECLINED');
    expect(mapAsaasPaymentStatus('CANCELLED')).toBe('CANCELED');
    expect(mapAsaasPaymentStatus('PENDING')).toBe('PENDING');
  });
});

describe('extractAsaasPayment*', () => {
  it('lê id e status aninhados em payment', () => {
    expect(
      extractAsaasPaymentId({ payment: { id: 'pay_123', status: 'RECEIVED' } }),
    ).toBe('pay_123');
    expect(
      extractAsaasPaymentStatus({ payment: { id: 'pay_123', status: 'RECEIVED' } }),
    ).toBe('RECEIVED');
  });

  it('lê id direto quando começa com pay_', () => {
    expect(extractAsaasPaymentId({ id: 'pay_abc' })).toBe('pay_abc');
    expect(extractAsaasPaymentId({ id: 'other' })).toBeNull();
  });
});

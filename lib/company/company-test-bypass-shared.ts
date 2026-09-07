const DEFAULT_TEST_KEYS = ['paizaonacozinha'];

export function normalizeCompanyTestKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

export function getCompanyTestBypassKeys(): string[] {
  const fromEnv = (typeof process !== 'undefined'
    ? (process.env.COMPANY_TEST_BYPASS_KEYS
      || process.env.COMPANY_TEST_BYPASS_EMAILS
      || process.env.NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS
      || '')
    : '')
    .split(',')
    .map((item) => normalizeCompanyTestKey(item))
    .filter(Boolean);

  return [...new Set([
    ...DEFAULT_TEST_KEYS.map(normalizeCompanyTestKey),
    ...fromEnv,
  ])];
}

/** Conta de teste empresarial (ex.: paizaonacozinha@gmail.com) — sem cadastro obrigatório */
export function matchesCompanyTestBypass(params: {
  email?: string | null;
  companyName?: string | null;
  userName?: string | null;
}): boolean {
  const keys = getCompanyTestBypassKeys();
  if (keys.length === 0) return false;

  const email = params.email?.toLowerCase().trim() || '';
  const candidates = [
    email ? normalizeCompanyTestKey(email.split('@')[0] || email) : '',
    email ? normalizeCompanyTestKey(email) : '',
    params.companyName ? normalizeCompanyTestKey(params.companyName) : '',
    params.userName ? normalizeCompanyTestKey(params.userName) : '',
  ].filter(Boolean);

  return keys.some((key) => candidates.some((candidate) => candidate === key || candidate.includes(key)));
}

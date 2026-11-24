const DEFAULT_TEST_KEYS = ['paizaonacozinha'];

export function normalizeCompanyTestKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

export function getCompanyTestBypassKeys(): string[] {
  const fromEnv = (typeof process !== 'undefined'
    ? (process.env.COMPANY_TEST_BYPASS_KEYS
      || process.env.COMPANY_TEST_BYPASS_EMAILS
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
  const emails = [
    email ? normalizeCompanyTestKey(email.split('@')[0] || '') : '',
    email ? normalizeCompanyTestKey(email) : '',
  ].filter(Boolean);
  const names = [
    params.companyName ? normalizeCompanyTestKey(params.companyName) : '',
    params.userName ? normalizeCompanyTestKey(params.userName) : '',
  ].filter(Boolean);
  return keys.some((key) => emails.some((candidate) => candidate === key) || names.some((candidate) => nameMatchesKey(candidate, key)));
}

const NAME_SUFFIXES = ['ltda', 'me', 'mei', 'eireli', 'sa'];

function nameMatchesKey(candidate: string, key: string): boolean {
  if (candidate === key) return true;
  return NAME_SUFFIXES.some((suffix) => candidate === `${key}${suffix}`);
}

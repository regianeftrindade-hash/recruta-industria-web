import { isValidEmail } from '@/lib/security';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.com.br',
  'ymail.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'bol.com.br',
  'uol.com.br',
  'terra.com.br',
  'ig.com.br',
  'r7.com',
  'globo.com',
  'globomail.com',
]);

export function getAppBaseUrl(): string {
  return (process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function normalizeCorporateEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function getEmailDomain(email: string): string | null {
  const normalized = normalizeCorporateEmail(email);
  const at = normalized.lastIndexOf('@');
  if (at <= 0 || at === normalized.length - 1) return null;
  return normalized.slice(at + 1);
}

export function isCorporateEmail(email: string): boolean {
  if (!isValidEmail(email)) return false;
  const domain = getEmailDomain(email);
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export function corporateEmailError(email: string): string | null {
  const normalized = normalizeCorporateEmail(email);
  if (!normalized) return 'Informe o e-mail corporativo da empresa.';
  if (!isValidEmail(normalized)) return 'E-mail inválido.';
  if (!isCorporateEmail(normalized)) {
    return 'Use um e-mail corporativo da empresa (não use Gmail, Hotmail, Outlook, Yahoo etc.).';
  }
  return null;
}

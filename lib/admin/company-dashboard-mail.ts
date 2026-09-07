/** Marcadores de e-mails enviados pela caixa de contato do dashboard empresa. */

export const COMPANY_DASHBOARD_SUBJECT_RE = /^(?:\s*Re:\s*)*\[Empresa\b/i;

export const COMPANY_DASHBOARD_BODY_MARKER =
  'Nova mensagem da empresa via painel Recruta Indústria';

export const COMPANY_DASHBOARD_HEADER = 'X-Recruta-Source';
export const COMPANY_DASHBOARD_HEADER_VALUE = 'company-dashboard-contact';

export function isCompanyDashboardEmail(params: {
  subject?: string | null;
  text?: string | null;
  headers?: Record<string, string | string[] | undefined> | null;
}): boolean {
  const subject = params.subject || '';
  if (COMPANY_DASHBOARD_SUBJECT_RE.test(subject)) return true;

  const text = params.text || '';
  if (text.includes(COMPANY_DASHBOARD_BODY_MARKER)) return true;

  const header = params.headers?.[COMPANY_DASHBOARD_HEADER];
  if (!header) return false;
  const value = Array.isArray(header) ? header.join(' ') : header;
  return value.toLowerCase().includes(COMPANY_DASHBOARD_HEADER_VALUE);
}

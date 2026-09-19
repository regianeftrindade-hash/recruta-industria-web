/**
 * Google Ads (gtag) — IDs e conversões do Recruta Indústria.
 * A tag global fica em app/layout.tsx; aqui só helpers de evento.
 */

export const GOOGLE_ADS_ID = 'AW-18447724143';

/** Label oficial da conversão de cadastro de profissional (Google Ads). */
export const GOOGLE_ADS_PROFESSIONAL_SIGNUP_CONVERSION_LABEL = 'wOWWCIv86vwcEO_cx9xE';

const PROFESSIONAL_SIGNUP_SENT_KEY = 'ri_gads_pro_signup_conversion_v1';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __riGadsProSignupSent?: boolean;
  }
}

/**
 * Dispara a conversão de cadastro profissional uma única vez por aba/sessão.
 * send_to: AW-18447724143/wOWWCIv86vwcEO_cx9xE
 */
export function trackProfessionalSignupConversion(): void {
  if (typeof window === 'undefined') return;

  const label = GOOGLE_ADS_PROFESSIONAL_SIGNUP_CONVERSION_LABEL.trim();
  if (!label) return;

  if (window.__riGadsProSignupSent) return;

  try {
    if (window.sessionStorage.getItem(PROFESSIONAL_SIGNUP_SENT_KEY) === '1') {
      window.__riGadsProSignupSent = true;
      return;
    }
    window.sessionStorage.setItem(PROFESSIONAL_SIGNUP_SENT_KEY, '1');
  } catch {
    // sessionStorage indisponível — segue com dedupe em memória
  }

  window.__riGadsProSignupSent = true;

  window.gtag?.('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
  });
}

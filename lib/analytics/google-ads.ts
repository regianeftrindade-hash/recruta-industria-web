/**
 * Google Ads (gtag) — IDs e conversões do Recruta Indústria.
 * A tag global fica em app/layout.tsx; aqui só helpers de evento.
 */

export const GOOGLE_ADS_ID = 'AW-18447724143';

/** Label oficial da conversão de cadastro de profissional (Google Ads). */
export const GOOGLE_ADS_PROFESSIONAL_SIGNUP_CONVERSION_LABEL = 'wOWWCIv86vwcEO_cx9xE';

const PROFESSIONAL_SIGNUP_SENT_KEY = 'ri_gads_pro_signup_conversion_v2';
const PROFESSIONAL_SIGNUP_PENDING_KEY = 'ri_gads_pro_signup_pending_v1';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __riGadsProSignupSent?: boolean;
  }
}

/** Garante dataLayer + gtag (fila) mesmo antes do script externo carregar. */
function ensureGtag(): (...args: unknown[]) => void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') {
    return window.gtag;
  }
  window.gtag = function gtag() {
    // Mesmo stub do snippet oficial do Google (usa arguments, não rest).
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments as unknown as never);
  };
  return window.gtag;
}

function alreadySent(): boolean {
  if (window.__riGadsProSignupSent) return true;
  try {
    return window.sessionStorage.getItem(PROFESSIONAL_SIGNUP_SENT_KEY) === '1';
  } catch {
    return false;
  }
}

function markSent(): void {
  window.__riGadsProSignupSent = true;
  try {
    window.sessionStorage.setItem(PROFESSIONAL_SIGNUP_SENT_KEY, '1');
  } catch {
    // ignore
  }
}

/** Marca que um cadastro acabou de concluir (para reenviar na página de boas-vindas). */
export function markProfessionalSignupConversionPending(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(PROFESSIONAL_SIGNUP_PENDING_KEY, '1');
  } catch {
    // ignore
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

  if (alreadySent()) return;

  const gtag = ensureGtag();
  gtag('event', 'conversion', {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
  });

  markSent();
}

/** Marca pendente + dispara (uso no submit do cadastro). */
export function reportProfessionalSignupConversion(): void {
  markProfessionalSignupConversionPending();
  trackProfessionalSignupConversion();
}

/** Se o cadastro marcou pendente, garante o disparo na boas-vindas e limpa a flag. */
export function flushProfessionalSignupConversionIfPending(): void {
  if (typeof window === 'undefined') return;
  let pending = false;
  try {
    pending = window.sessionStorage.getItem(PROFESSIONAL_SIGNUP_PENDING_KEY) === '1';
  } catch {
    return;
  }
  if (!pending) return;

  // Se o gtag ainda não tinha carregado no submit, o stub/dataLayer + este 2º ponto cobrem.
  if (!alreadySent()) {
    trackProfessionalSignupConversion();
  }

  try {
    window.sessionStorage.removeItem(PROFESSIONAL_SIGNUP_PENDING_KEY);
  } catch {
    // ignore
  }
}

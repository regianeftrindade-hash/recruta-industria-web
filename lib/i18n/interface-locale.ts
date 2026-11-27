import {
  DEFAULT_LOCALE,
  matchSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";
import { negotiateAcceptLanguage } from "@/lib/i18n/accept-language";

export type InterfaceLocaleInput = {
  authenticated: boolean;
  accountLocale?: string | null;
  accountReadFailed?: boolean;
  cookieLocale?: string | null;
  /** Cabeçalho Accept-Language bruto do navegador. */
  acceptLanguage?: string | null;
  /**
   * Código de país do visitante (ISO 3166-1 alpha-2), quando a infraestrutura
   * fornecer (ex.: x-vercel-ip-country, cf-ipcountry). Não substitui cookie.
   */
  visitorCountry?: string | null;
};

/**
 * Prioridade:
 * 1. Conta autenticada com locale válido (escolha persistida do usuário)
 * 2. Cookie ri-locale (escolha manual do visitante)
 * 3. Visitante no Brasil (geo) → pt-BR, mesmo com navegador em inglês
 * 4. Accept-Language do navegador (primeiro suportado)
 * 5. pt-BR
 *
 * Não força italiano nem qualquer outro idioma como padrão global.
 */
export function selectInterfaceLocale(input: InterfaceLocaleInput): SupportedLocale {
  const cookie = matchSupportedLocale(input.cookieLocale);
  const fromBrowser = negotiateAcceptLanguage(input.acceptLanguage);
  const country = (input.visitorCountry || "").trim().toUpperCase();
  const fromGeoBrazil = country === "BR" ? DEFAULT_LOCALE : null;

  if (input.accountReadFailed) {
    return cookie ?? fromGeoBrazil ?? fromBrowser ?? DEFAULT_LOCALE;
  }
  if (input.authenticated) {
    return (
      matchSupportedLocale(input.accountLocale) ??
      cookie ??
      fromGeoBrazil ??
      fromBrowser ??
      DEFAULT_LOCALE
    );
  }
  return cookie ?? fromGeoBrazil ?? fromBrowser ?? DEFAULT_LOCALE;
}

/** Extrai país de cabeçalhos comuns de edge (Vercel, Cloudflare, etc.). */
export function visitorCountryFromHeaders(
  getHeader: (name: string) => string | null,
): string | null {
  const candidates = [
    getHeader("x-vercel-ip-country"),
    getHeader("cf-ipcountry"),
    getHeader("x-country-code"),
    getHeader("cloudfront-viewer-country"),
  ];
  for (const raw of candidates) {
    const code = (raw || "").trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1") {
      return code;
    }
  }
  return null;
}

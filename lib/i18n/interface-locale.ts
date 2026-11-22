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
};

/**
 * Prioridade:
 * 1. Conta autenticada com locale válido (escolha persistida do usuário)
 * 2. Cookie ri-locale (escolha manual do visitante)
 * 3. Accept-Language do navegador (primeiro suportado)
 * 4. pt-BR
 *
 * Não força italiano nem qualquer outro idioma como padrão global.
 */
export function selectInterfaceLocale(input: InterfaceLocaleInput): SupportedLocale {
  const cookie = matchSupportedLocale(input.cookieLocale);
  const fromBrowser = negotiateAcceptLanguage(input.acceptLanguage);

  if (input.accountReadFailed) {
    return cookie ?? fromBrowser ?? DEFAULT_LOCALE;
  }
  if (input.authenticated) {
    return matchSupportedLocale(input.accountLocale) ?? cookie ?? fromBrowser ?? DEFAULT_LOCALE;
  }
  return cookie ?? fromBrowser ?? DEFAULT_LOCALE;
}

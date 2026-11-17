import { DEFAULT_LOCALE, matchSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

export type InterfaceLocaleInput = {
  authenticated: boolean;
  accountLocale?: string | null;
  accountReadFailed?: boolean;
  cookieLocale?: string | null;
};

/**
 * Conta autenticada com idioma válido vence o cookie.
 * Cookie válido permanece se a conta falhar ou vier com código inválido.
 * Visitante sem cookie cai em pt-BR.
 */
export function selectInterfaceLocale(input: InterfaceLocaleInput): SupportedLocale {
  const cookie = matchSupportedLocale(input.cookieLocale);
  if (input.accountReadFailed) return cookie ?? DEFAULT_LOCALE;
  if (input.authenticated) {
    return matchSupportedLocale(input.accountLocale) ?? cookie ?? DEFAULT_LOCALE;
  }
  return cookie ?? DEFAULT_LOCALE;
}

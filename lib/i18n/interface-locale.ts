import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";

export type InterfaceLocaleInput = {
  authenticated: boolean;
  accountLocale?: string | null;
  accountReadFailed?: boolean;
  cookieLocale?: string | null;
};

/**
 * Conta autenticada vence o cookie.
 * Visitante usa o cookie ri-locale.
 * Falha ao ler a conta, cookie inválido ou ausência de preferência caem em pt-BR.
 */
export function selectInterfaceLocale(input: InterfaceLocaleInput): SupportedLocale {
  if (input.accountReadFailed) return DEFAULT_LOCALE;
  if (input.authenticated) return resolveLocale(input.accountLocale);
  if (typeof input.cookieLocale === "string" && input.cookieLocale.trim()) {
    return resolveLocale(input.cookieLocale);
  }
  return DEFAULT_LOCALE;
}

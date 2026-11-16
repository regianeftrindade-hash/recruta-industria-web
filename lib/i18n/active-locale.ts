import { AsyncLocalStorage } from "node:async_hooks";
import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";

const requestLocale = new AsyncLocalStorage<SupportedLocale>();
let browserLocale: SupportedLocale = DEFAULT_LOCALE;

/** Vale para a renderização atual. No servidor, fica isolado por pedido. */
export function bindLocale(input?: string | null): SupportedLocale {
  const locale = resolveLocale(input);
  if (typeof window === "undefined") requestLocale.enterWith(locale);
  else browserLocale = locale;
  return locale;
}

export function getBoundLocale(): SupportedLocale {
  if (typeof window === "undefined") return requestLocale.getStore() ?? DEFAULT_LOCALE;
  return browserLocale;
}

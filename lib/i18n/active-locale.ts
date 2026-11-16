import { AsyncLocalStorage } from "node:async_hooks";
import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";

const requestLocale = new AsyncLocalStorage<SupportedLocale>();
let browserLocale: SupportedLocale = DEFAULT_LOCALE;

/**
 * Vale só para a execução atual.
 * No servidor, enterWith não atravessa a função de outra página.
 * Páginas servidor passam o locale direto para t().
 */
export function bindLocale(input?: string | null): SupportedLocale {
  const locale = resolveLocale(input);
  if (typeof window === "undefined") requestLocale.enterWith(locale);
  else browserLocale = locale;
  return locale;
}

/** Isola o locale no trecho executado agora, sem depender do layout. */
export function runWithLocale<T>(input: string | null | undefined, render: (locale: SupportedLocale) => T): T {
  const locale = resolveLocale(input);
  if (typeof window === "undefined") return requestLocale.run(locale, () => render(locale));
  const previous = browserLocale;
  browserLocale = locale;
  try {
    return render(locale);
  } finally {
    browserLocale = previous;
  }
}

export function getBoundLocale(): SupportedLocale {
  if (typeof window === "undefined") return requestLocale.getStore() ?? DEFAULT_LOCALE;
  return browserLocale;
}

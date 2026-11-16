import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";

type LocaleHooks = {
  getStore(): SupportedLocale | undefined;
  enterWith(locale: SupportedLocale): void;
  run<T>(locale: SupportedLocale, fn: () => T): T;
};

type LocaleSlot = {
  hooks?: LocaleHooks;
  browser: SupportedLocale;
};

const SLOT = "__recrutaInterfaceLocale";

function slot(): LocaleSlot {
  const g = globalThis as typeof globalThis & { [SLOT]?: LocaleSlot };
  if (!g[SLOT]) g[SLOT] = { browser: DEFAULT_LOCALE };
  return g[SLOT];
}

/** O módulo de servidor registra o isolamento por pedido. O cliente não importa Node. */
export function registerLocaleHooks(hooks: LocaleHooks): void {
  slot().hooks = hooks;
}

/**
 * Vale só para a execução atual.
 * No servidor, enterWith não atravessa a função de outra página.
 * Páginas servidor passam o locale direto para t().
 */
export function bindLocale(input?: string | null): SupportedLocale {
  const locale = resolveLocale(input);
  if (typeof window === "undefined") {
    slot().hooks?.enterWith(locale);
    return locale;
  }
  slot().browser = locale;
  return locale;
}

/** Isola o locale no trecho executado agora, sem depender do layout. */
export function runWithLocale<T>(input: string | null | undefined, render: (locale: SupportedLocale) => T): T {
  const locale = resolveLocale(input);
  const hooks = slot().hooks;
  if (typeof window === "undefined" && hooks) return hooks.run(locale, () => render(locale));
  const previous = slot().browser;
  slot().browser = locale;
  try {
    return render(locale);
  } finally {
    slot().browser = previous;
  }
}

export function getBoundLocale(): SupportedLocale {
  if (typeof window === "undefined") return slot().hooks?.getStore() ?? DEFAULT_LOCALE;
  return slot().browser;
}

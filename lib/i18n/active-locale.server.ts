import { AsyncLocalStorage } from "node:async_hooks";
import { registerLocaleHooks } from "@/lib/i18n/active-locale";
import type { SupportedLocale } from "@/lib/i18n/locales";

const requestLocale = new AsyncLocalStorage<SupportedLocale>();

registerLocaleHooks({
  getStore: () => requestLocale.getStore(),
  enterWith: (locale) => requestLocale.enterWith(locale),
  run: (locale, fn) => requestLocale.run(locale, fn),
});

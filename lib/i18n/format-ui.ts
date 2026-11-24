import { getBoundLocale } from "@/lib/i18n/active-locale";

/**
 * Idioma da apresentação. Não altera o instante, o fuso nem o valor.
 * Árabe e hindi mantêm algarismos ocidentais.
 */
export function uiIntlLocale(): string {
  const locale = getBoundLocale();
  if (locale === "ar") return "ar-u-nu-latn";
  if (locale === "hi") return "hi-u-nu-latn";
  return locale;
}

const DEFAULT_UI_TIME_ZONE = "America/Sao_Paulo";

export function formatUiDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(uiIntlLocale(), {
    timeZone: options?.timeZone || DEFAULT_UI_TIME_ZONE,
    ...options,
  });
}

export function formatUiDateTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(uiIntlLocale(), {
    timeZone: options?.timeZone || DEFAULT_UI_TIME_ZONE,
    ...options,
  });
}

export function formatUiNumber(value: number): string {
  return value.toLocaleString(uiIntlLocale());
}

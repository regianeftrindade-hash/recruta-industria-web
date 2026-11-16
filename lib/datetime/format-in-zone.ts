/** Fuso usado quando a conta ou a vaga não informa outro. */
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export function formatInTimeZone(
  value: Date | string | number,
  locale = "pt-BR",
  timeZone = DEFAULT_TIME_ZONE,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date);
}

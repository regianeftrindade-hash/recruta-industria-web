import { matchSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

const BLOCKED_FIELDS = ["countryCode", "currency", "timeZone", "cpf", "cnpj", "phone"] as const;

export type LocalePreferenceResult =
  | { ok: true; locale: SupportedLocale }
  | { ok: false; error: "invalid" | "region" };

function requestedLocale(value: string): SupportedLocale | null {
  return matchSupportedLocale(value);
}

/** Aceita só o idioma. País, moeda, fuso e documentos não entram neste pedido. */
export function parseLocalePreference(body: unknown): LocalePreferenceResult {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid" };
  const record = body as Record<string, unknown>;
  if (BLOCKED_FIELDS.some((field) => field in record)) return { ok: false, error: "region" };
  if (typeof record.locale !== "string") return { ok: false, error: "invalid" };
  const locale = requestedLocale(record.locale);
  if (!locale) return { ok: false, error: "invalid" };
  return { ok: true, locale };
}

/**
 * O corpo JSON é a fonte principal.
 * A query só entra quando o corpo não trouxe `locale` (corpo vazio depois do proxy).
 */
export function readLocaleChoice(body: unknown, queryLocale?: string | null): LocalePreferenceResult {
  if (body && typeof body === "object" && "locale" in body) {
    return parseLocalePreference(body);
  }
  if (typeof queryLocale === "string" && queryLocale.trim()) {
    return parseLocalePreference({ locale: queryLocale });
  }
  return parseLocalePreference(body);
}

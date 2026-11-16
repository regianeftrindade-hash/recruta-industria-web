import { canonicalizeLocale, isSupportedLocale, type SupportedLocale } from "@/lib/i18n/locales";

const BLOCKED_FIELDS = ["countryCode", "currency", "timeZone", "cpf", "cnpj", "phone"] as const;

export type LocalePreferenceResult =
  | { ok: true; locale: SupportedLocale }
  | { ok: false; error: "invalid" | "region" };

function requestedLocale(value: string): SupportedLocale | null {
  const canonical = canonicalizeLocale(value);
  if (!canonical || !isSupportedLocale(canonical)) return null;
  return canonical;
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

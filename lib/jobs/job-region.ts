import {
  BRAZIL_REGISTRATION_REGION,
  buildRegistrationRegion,
  resolveNewRegistrationCountry,
} from "@/lib/identity/registration-region";

export const JOB_REGION_DEFAULTS = BRAZIL_REGISTRATION_REGION;

const COMMON_JOB_CURRENCIES = [
  "BRL",
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "MXN",
  "ARS",
  "CLP",
  "COP",
  "PEN",
  "JPY",
  "CNY",
  "KRW",
  "AUD",
  "INR",
  "AED",
  "SAR",
] as const;

let cachedTimeZones: Set<string> | null = null;

function knownTimeZones(): Set<string> {
  if (cachedTimeZones) return cachedTimeZones;
  try {
    const values =
      typeof Intl !== "undefined" && "supportedValuesOf" in Intl
        ? (Intl as typeof Intl & { supportedValuesOf(key: string): string[] }).supportedValuesOf(
            "timeZone",
          )
        : [];
    cachedTimeZones = new Set(values.length ? values : [JOB_REGION_DEFAULTS.timeZone, "UTC"]);
  } catch {
    cachedTimeZones = new Set([JOB_REGION_DEFAULTS.timeZone, "UTC"]);
  }
  return cachedTimeZones;
}

export type JobRegionParse =
  | { ok: true; countryCode: string; locale: string; timeZone: string }
  | { ok: false; error: string };

/** País da vaga. Vazio → BR (compatível com vagas antigas). */
export function normalizeJobCountryCode(value: unknown, mode: "read" | "write" = "read"): string {
  if (value == null || (typeof value === "string" && !value.trim())) {
    return JOB_REGION_DEFAULTS.countryCode;
  }
  const resolved = resolveNewRegistrationCountry(value);
  if (!resolved.ok) {
    if (mode === "write") return ""; // caller trata
    return JOB_REGION_DEFAULTS.countryCode;
  }
  return resolved.region.countryCode;
}

export function parseJobRegionFields(input: {
  countryCode?: unknown;
  locale?: unknown;
  timeZone?: unknown;
}): JobRegionParse {
  const countryResolved = resolveNewRegistrationCountry(
    input.countryCode == null ||
      (typeof input.countryCode === "string" && !input.countryCode.trim())
      ? "BR"
      : input.countryCode,
  );
  if (!countryResolved.ok) return { ok: false, error: countryResolved.error };
  const countryCode = countryResolved.region.countryCode;
  const defaults = buildRegistrationRegion(countryCode);

  let locale = defaults.locale;
  if (input.locale != null && !(typeof input.locale === "string" && !input.locale.trim())) {
    if (typeof input.locale !== "string") {
      return { ok: false, error: "Informe um idioma válido para a vaga." };
    }
    const raw = input.locale.trim().replace(/_/g, "-");
    if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(raw)) {
      return { ok: false, error: "Informe um idioma válido para a vaga." };
    }
    locale =
      raw.toLowerCase() === "pt-br"
        ? "pt-BR"
        : raw.toLowerCase() === "pt-pt"
          ? "pt-PT"
          : raw;
  }

  let timeZone = defaults.timeZone;
  if (input.timeZone != null && !(typeof input.timeZone === "string" && !input.timeZone.trim())) {
    if (typeof input.timeZone !== "string") {
      return { ok: false, error: "Informe um fuso horário válido." };
    }
    const zone = input.timeZone.trim();
    if (!knownTimeZones().has(zone)) {
      return { ok: false, error: "Informe um fuso horário válido." };
    }
    timeZone = zone;
  }

  return { ok: true, countryCode, locale, timeZone };
}

/** Atualização que não envia o campo conserva o valor já gravado. */
export function regionFieldPatch<T extends string>(
  input: unknown,
  field: "countryCode" | "locale" | "timeZone" | "currency",
  value: T,
): Partial<Record<typeof field, T>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { [field]: value } as Partial<Record<typeof field, T>>;
  }
  if (!(field in (input as object))) return {};
  return { [field]: value } as Partial<Record<typeof field, T>>;
}

export function jobCurrencyChoices(): string[] {
  return [...COMMON_JOB_CURRENCIES];
}

export function jobTimeZoneChoicesForCountry(countryCode: string): string[] {
  const region = buildRegistrationRegion(countryCode || "BR");
  const extras = [
    "UTC",
    "America/Sao_Paulo",
    "America/New_York",
    "Europe/Lisbon",
    "Europe/Madrid",
    "Asia/Tokyo",
  ];
  return Array.from(new Set([region.timeZone, ...extras]));
}

/**
 * Link wa.me a partir de dígitos E.164 (sem +).
 * Brasil: prefixa 55 só se faltar. Outros países: nunca acrescenta 55.
 */
export function jobWhatsappHref(
  digitsOrE164: string | null | undefined,
  countryCode: string | null | undefined = "BR",
): string | null {
  const digits = String(digitsOrE164 || "").replace(/\D/g, "");
  if (!digits) return null;
  const country = (countryCode || "BR").trim().toUpperCase() || "BR";

  if (country === "BR") {
    if (digits.length < 10 || digits.length > 13) return null;
    const full = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${full}`;
  }

  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

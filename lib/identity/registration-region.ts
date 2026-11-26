import { t } from "@/lib/i18n/translate";

const COUNTRY_UNAVAILABLE_PT =
  "O cadastro deste país ainda não está disponível. Hoje só é possível concluir o cadastro no Brasil.";

/** Região gravada quando o cadastro é do Brasil. */
export const BRAZIL_REGISTRATION_REGION = {
  countryCode: "BR",
  locale: "pt-BR",
  currency: "BRL",
  timeZone: "America/Sao_Paulo",
} as const;

export type BrazilRegistrationRegion = typeof BRAZIL_REGISTRATION_REGION;

export type RegistrationRegion = {
  countryCode: string;
  locale: string;
  currency: string;
  timeZone: string;
};

/** Mantido por compatibilidade de testes/mensagens legadas (não bloqueia mais países ISO). */
export const REGISTRATION_COUNTRY_UNAVAILABLE = COUNTRY_UNAVAILABLE_PT;

const ISO_ALPHA2 = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ
EC EE EG EH ER ES ET
FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU
ID IE IL IM IN IO IQ IR IS IT
JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ
OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY
QA
RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ
UA UG UM US UY UZ
VA VC VE VG VI VN VU
WF WS
YE YT
ZA ZM ZW
`.trim().split(/\s+/);

const COUNTRY_CODES = new Set(ISO_ALPHA2);

const LOCALE_BY_COUNTRY: Record<string, string> = {
  BR: "pt-BR",
  PT: "pt-PT",
  US: "en",
  GB: "en",
  AU: "en",
  NZ: "en",
  IE: "en",
  CA: "en",
  ES: "es",
  MX: "es",
  AR: "es",
  CL: "es",
  CO: "es",
  PE: "es",
  UY: "es",
  FR: "fr",
  BE: "fr",
  DE: "de",
  AT: "de",
  CH: "de",
  IT: "it",
  JP: "ja",
  KR: "ko",
  CN: "zh-CN",
  TW: "zh-CN",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  IN: "hi",
};

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  BR: "BRL",
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  PT: "EUR",
  NL: "EUR",
  IE: "EUR",
  AT: "EUR",
  BE: "EUR",
  JP: "JPY",
  KR: "KRW",
  CN: "CNY",
  AU: "AUD",
  NZ: "NZD",
  CH: "CHF",
  AR: "ARS",
  CL: "CLP",
  CO: "COP",
  PE: "PEN",
  IN: "INR",
  AE: "AED",
  SA: "SAR",
};

const TIMEZONE_BY_COUNTRY: Record<string, string> = {
  BR: "America/Sao_Paulo",
  US: "America/New_York",
  CA: "America/Toronto",
  MX: "America/Mexico_City",
  GB: "Europe/London",
  PT: "Europe/Lisbon",
  ES: "Europe/Madrid",
  FR: "Europe/Paris",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  NL: "Europe/Amsterdam",
  IE: "Europe/Dublin",
  JP: "Asia/Tokyo",
  KR: "Asia/Seoul",
  CN: "Asia/Shanghai",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  AR: "America/Argentina/Buenos_Aires",
  CL: "America/Santiago",
  CO: "America/Bogota",
  PE: "America/Lima",
  IN: "Asia/Kolkata",
  AE: "Asia/Dubai",
  SA: "Asia/Riyadh",
};

const cachedChoicesByLocale = new Map<string, { code: string; name: string }[]>();

/** Brasil primeiro. Demais nomes via DisplayNames no idioma da interface. */
export function registrationCountryChoices(
  locale = "pt-BR",
): { code: string; name: string }[] {
  const displayLocale = locale.trim() || "pt-BR";
  const cached = cachedChoicesByLocale.get(displayLocale);
  if (cached) return cached;
  const names = new Intl.DisplayNames([displayLocale], { type: "region" });
  const options = ISO_ALPHA2.map((code) => ({
    code,
    name: names.of(code) || code,
  }));
  options.sort((a, b) => {
    if (a.code === "BR") return -1;
    if (b.code === "BR") return 1;
    return a.name.localeCompare(b.name, displayLocale);
  });
  cachedChoicesByLocale.set(displayLocale, options);
  return options;
}

export type NewRegistrationCountry =
  | { ok: true; region: RegistrationRegion }
  | { ok: false; error: string };

export function buildRegistrationRegion(countryCode: string): RegistrationRegion {
  const code = countryCode.trim().toUpperCase();
  if (code === "BR") return { ...BRAZIL_REGISTRATION_REGION };
  return {
    countryCode: code,
    locale: LOCALE_BY_COUNTRY[code] || "en",
    currency: CURRENCY_BY_COUNTRY[code] || "USD",
    timeZone: TIMEZONE_BY_COUNTRY[code] || "UTC",
  };
}

/**
 * Cadastro novo sem país informado continua no Brasil.
 * Qualquer código ISO-3166-1 alpha-2 válido é aceito e gravado.
 */
export function resolveNewRegistrationCountry(raw: unknown): NewRegistrationCountry {
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    return { ok: true, region: { ...BRAZIL_REGISTRATION_REGION } };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: t("registration.country.invalid") };
  }
  const code = raw.trim().toUpperCase();
  if (code === "BR") return { ok: true, region: { ...BRAZIL_REGISTRATION_REGION } };
  if (!/^[A-Z]{2}$/.test(code) || !COUNTRY_CODES.has(code)) {
    return { ok: false, error: t("registration.country.invalid") };
  }
  return { ok: true, region: buildRegistrationRegion(code) };
}

/** Conta já existente não troca o país gravado. Campo ausente não altera nada. */
export function existingRegistrationCountryChangeError(
  stored: string | null | undefined,
  requested: unknown,
): string | null {
  if (requested == null || (typeof requested === "string" && requested.trim() === "")) {
    return null;
  }
  if (typeof requested !== "string") return t("registration.country.invalid");
  const next = requested.trim().toUpperCase();
  const current = (stored || "BR").trim().toUpperCase() || "BR";
  if (next === current) return null;
  return t("registration.country.locked");
}

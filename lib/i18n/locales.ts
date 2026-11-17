/** Idiomas da interface. pt-BR continua sendo o padrão. */
export const DEFAULT_LOCALE = "pt-BR" as const;

export const SUPPORTED_LOCALES = [
  "pt-BR",
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt-PT",
  "zh-CN",
  "ja",
  "ko",
  "ar",
  "hi",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Nome do idioma na própria escrita. Não muda com o idioma da tela. */
export const LOCALE_NATIVE_NAMES: Record<SupportedLocale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  "pt-PT": "Português (Portugal)",
  "zh-CN": "简体中文",
  ja: "日本語",
  ko: "한국어",
  ar: "العربية",
  hi: "हिन्दी",
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Único reconhecimento de código. `pt_BR`, `en-US` e `zh-Hans` entram na lista oficial. */
export function matchSupportedLocale(input?: string | null): SupportedLocale | null {
  const canonical = canonicalizeLocale(input);
  if (!canonical || !isSupportedLocale(canonical)) return null;
  return canonical;
}

/** Normaliza `pt_BR`, `en-US` e vazio. Não escolhe um idioma fora da lista. */
export function canonicalizeLocale(input?: string | null): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim().replace(/_/g, "-").toLowerCase();
  if (!value) return null;
  if (value === "pt" || value === "pt-br") return "pt-BR";
  if (value === "pt-pt") return "pt-PT";
  if (value === "en" || value.startsWith("en-")) return "en";
  if (value === "es" || value.startsWith("es-")) return "es";
  if (value === "fr" || value.startsWith("fr-")) return "fr";
  if (value === "de" || value.startsWith("de-")) return "de";
  if (value === "it" || value.startsWith("it-")) return "it";
  if (value === "zh" || value === "zh-cn" || value === "zh-hans") return "zh-CN";
  if (value === "ja" || value.startsWith("ja-")) return "ja";
  if (value === "ko" || value.startsWith("ko-")) return "ko";
  if (value === "ar" || value.startsWith("ar-")) return "ar";
  if (value === "hi" || value.startsWith("hi-")) return "hi";
  return value;
}

/** Idioma suportado, ou pt-BR quando o pedido não tem catálogo. */
export function resolveLocale(input?: string | null): SupportedLocale {
  return matchSupportedLocale(input) ?? DEFAULT_LOCALE;
}

export function htmlLang(locale: SupportedLocale): string {
  return locale;
}

export function textDirection(locale: SupportedLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

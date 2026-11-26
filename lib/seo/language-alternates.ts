import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const SITE = "https://www.recrutaindustria.com";

/**
 * Estratégia SEO: uma URL por recurso; idioma via cookie / Accept-Language.
 * Gera mapa hreflang (12 locales + x-default) apontando para a mesma URL.
 */
export function absoluteSiteUrl(path: string): string {
  if (!path || path === "/") return `${SITE}/`;
  return path.startsWith("http") ? path : `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
}

export function languageAlternates(path: string): Record<string, string> {
  const url = absoluteSiteUrl(path);
  const languages: Record<string, string> = { "x-default": url };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = url;
  }
  return languages;
}

/** Alternates relativos (metadata Next.js `alternates.languages`). */
export function languageAlternatesRelative(path = "/"): Record<string, string> {
  const normalized = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = { "x-default": normalized };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = normalized;
  }
  return languages;
}

export const SEO_SITE_ORIGIN = SITE;

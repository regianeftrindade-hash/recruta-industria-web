import {
  DEFAULT_LOCALE,
  matchSupportedLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";

/**
 * Negocia Accept-Language (RFC 7231).
 * Retorna o primeiro idioma suportado pela ordem de qualidade do navegador,
 * ou null quando nenhum item da lista é suportado (o caller aplica pt-BR).
 */
export function negotiateAcceptLanguage(
  header: string | null | undefined,
): SupportedLocale | null {
  if (!header || typeof header !== "string") return null;
  const trimmed = header.trim();
  if (!trimmed) return null;

  const tags = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [tagRaw, ...params] = part.split(";").map((s) => s.trim());
      let q = 1;
      for (const p of params) {
        const m = /^q\s*=\s*([0-9.]+)$/i.exec(p);
        if (m) {
          const parsed = Number(m[1]);
          if (Number.isFinite(parsed)) q = Math.min(1, Math.max(0, parsed));
        }
      }
      return { tag: tagRaw, q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag, q } of tags) {
    if (q <= 0) continue;
    if (tag === "*" || tag === "*") continue;
    const matched = matchSupportedLocale(tag);
    if (matched) return matched;
  }
  return null;
}

/** Fallback explícito: negociar ou DEFAULT_LOCALE (pt-BR). */
export function resolveFromAcceptLanguage(
  header: string | null | undefined,
): SupportedLocale {
  return negotiateAcceptLanguage(header) ?? DEFAULT_LOCALE;
}

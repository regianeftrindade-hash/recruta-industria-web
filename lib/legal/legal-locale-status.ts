import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/locales";
import type { PublicTermDocument } from "@/lib/legal/public-terms";

/**
 * Estrutura multi-idioma para textos jurídicos.
 * NÃO inventa traduções oficiais: só declara quais locales têm corpo revisado.
 * Enquanto a lista `officialBodyLocales` for só pt-BR, a UI usa fallback + aviso.
 */
export const LEGAL_OFFICIAL_BODY_LOCALES: readonly SupportedLocale[] = ["pt-BR"];

export function legalBodyIsOfficial(locale: SupportedLocale): boolean {
  return LEGAL_OFFICIAL_BODY_LOCALES.includes(locale);
}

export function localesAwaitingLegalTranslation(): SupportedLocale[] {
  return SUPPORTED_LOCALES.filter((locale) => !legalBodyIsOfficial(locale));
}

export function describeLegalLocaleCoverage(doc: PublicTermDocument): {
  official: SupportedLocale[];
  pending: SupportedLocale[];
  hasStructuredSlots: boolean;
} {
  const official = SUPPORTED_LOCALES.filter(
    (locale) =>
      legalBodyIsOfficial(locale) &&
      Array.isArray(doc.paragraphsByLocale[locale]) &&
      (doc.paragraphsByLocale[locale]?.length ?? 0) > 0,
  );
  const pending = localesAwaitingLegalTranslation();
  return {
    official,
    pending,
    hasStructuredSlots: true,
  };
}

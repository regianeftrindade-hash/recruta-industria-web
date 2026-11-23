import type { SupportedLocale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { usoPtBR } from "@/lib/legal/content/uso.pt-BR";
import { privacidadePtBR } from "@/lib/legal/content/privacidade.pt-BR";

/** Páginas jurídicas públicas (além dos termos de checkbox do cadastro). */
export type PublicTermSlug = "uso" | "privacidade";

export type PublicTermDocument = {
  slug: PublicTermSlug;
  /** Título em pt-BR (fallback). Preferir chave i18n na página. */
  titlePtBR: string;
  /** Corpo localizado; locales sem tradução caem para pt-BR. */
  paragraphsByLocale: Partial<Record<SupportedLocale, string[]>> & {
    "pt-BR": string[];
  };
  /**
   * Pontos que dependem de validação jurídica / compliance antes de
   * virarem compromisso contratual. Não são fatos inventados — só lacunas.
   */
  pendingLegalValidation: string[];
};

const DOCUMENTS: Record<PublicTermSlug, PublicTermDocument> = {
  uso: usoPtBR,
  privacidade: privacidadePtBR,
};

export const PUBLIC_TERM_SLUGS: PublicTermSlug[] = ["uso", "privacidade"];

export function isPublicTermSlug(slug: string): slug is PublicTermSlug {
  return slug === "uso" || slug === "privacidade";
}

export function getPublicTerm(slug: string): PublicTermDocument | undefined {
  if (!isPublicTermSlug(slug)) return undefined;
  return DOCUMENTS[slug];
}

export function resolvePublicTermParagraphs(
  doc: PublicTermDocument,
  locale: SupportedLocale = DEFAULT_LOCALE,
): string[] {
  return doc.paragraphsByLocale[locale] ?? doc.paragraphsByLocale["pt-BR"];
}

export function hrefPublicTerm(slug: PublicTermSlug): string {
  return `/termos/${slug}`;
}

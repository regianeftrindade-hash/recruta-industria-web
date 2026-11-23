import { getBoundLocale } from "@/lib/i18n/active-locale";
import { messagesEn } from "@/lib/i18n/messages/en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import fr from "@/lib/i18n/messages/catalogs/fr.json";
import de from "@/lib/i18n/messages/catalogs/de.json";
import it from "@/lib/i18n/messages/catalogs/it.json";
import ptPT from "@/lib/i18n/messages/catalogs/pt-PT.json";
import zhCN from "@/lib/i18n/messages/catalogs/zh-CN.json";
import ja from "@/lib/i18n/messages/catalogs/ja.json";
import ko from "@/lib/i18n/messages/catalogs/ko.json";
import ar from "@/lib/i18n/messages/catalogs/ar.json";
import hi from "@/lib/i18n/messages/catalogs/hi.json";
import { messagesPtBR, type MessageKey } from "@/lib/i18n/messages/pt-BR";
import { brazilOnlyDocumentMessages } from "@/lib/i18n/messages/brazil-only-document";
import { DEFAULT_LOCALE, resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";

/**
 * Catálogo es.json foi corrompido em commit intermediário (placeholder).
 * Até republicar o JSON completo do histórico 755ea070, es usa override pontual + fallback pt-BR.
 */
const es: Partial<Record<MessageKey, string>> = {
  ...(brazilOnlyDocumentMessages.es ?? {}),
};

const catalogs: Record<SupportedLocale, Partial<Record<MessageKey, string>>> = {
  "pt-BR": messagesPtBR,
  en: { ...messagesEn, ...surfacesEn, ...internalEn, ...restEn, ...fixEn },
  es,
  fr,
  de,
  it,
  "pt-PT": ptPT,
  "zh-CN": zhCN,
  ja,
  ko,
  ar,
  hi,
};

/** Lê a mensagem do idioma pedido. Se faltar tradução, devolve pt-BR. */
export function translate(key: MessageKey, locale?: string | null): string {
  const requested = locale == null || locale === ""
    ? getBoundLocale()
    : resolveLocale(locale);
  if (requested !== DEFAULT_LOCALE) {
    const foreign = catalogs[requested]?.[key] ?? brazilOnlyDocumentMessages[requested]?.[key];
    if (foreign) return foreign;
  }
  return catalogs[DEFAULT_LOCALE][key] ?? messagesPtBR[key];
}

export const t = translate;

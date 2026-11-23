import { getBoundLocale } from "@/lib/i18n/active-locale";
import { messagesEn } from "@/lib/i18n/messages/en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import es0 from "@/lib/i18n/messages/catalogs/es-part-0.json";
import es1 from "@/lib/i18n/messages/catalogs/es-part-1.json";
import es2 from "@/lib/i18n/messages/catalogs/es-part-2.json";
import es3 from "@/lib/i18n/messages/catalogs/es-part-3.json";
import es4 from "@/lib/i18n/messages/catalogs/es-part-4.json";
import es5 from "@/lib/i18n/messages/catalogs/es-part-5.json";
import es6 from "@/lib/i18n/messages/catalogs/es-part-6.json";
import es7 from "@/lib/i18n/messages/catalogs/es-part-7.json";
import es8 from "@/lib/i18n/messages/catalogs/es-part-8.json";
import es9 from "@/lib/i18n/messages/catalogs/es-part-9.json";
import es10 from "@/lib/i18n/messages/catalogs/es-part-10.json";
import es11 from "@/lib/i18n/messages/catalogs/es-part-11.json";
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

/** Catálogo es recomposto a partir de partes (restauração após corrupção do arquivo monolítico). */
const es: Partial<Record<MessageKey, string>> = {
  ...(es0 as object),
  ...(es1 as object),
  ...(es2 as object),
  ...(es3 as object),
  ...(es4 as object),
  ...(es5 as object),
  ...(es6 as object),
  ...(es7 as object),
  ...(es8 as object),
  ...(es9 as object),
  ...(es10 as object),
  ...(es11 as object),
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

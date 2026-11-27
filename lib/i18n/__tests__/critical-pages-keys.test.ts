import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { messagesPtBR, type MessageKey } from "@/lib/i18n/messages/pt-BR";
import { messagesEn as enCore } from "@/lib/i18n/messages/en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { brazilOnlyDocumentMessages } from "@/lib/i18n/messages/brazil-only-document";
import { SUPPORTED_LOCALES, htmlLang, textDirection } from "@/lib/i18n/locales";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import { negotiateAcceptLanguage } from "@/lib/i18n/accept-language";
import { t } from "@/lib/i18n/translate";

const messagesEn = { ...enCore, ...surfacesEn, ...internalEn, ...restEn, ...fixEn };

/** Chaves t()/text() usadas em home, login e cadastros públicos. */
const CRITICAL_PAGE_KEYS = [
  "locale.switchLabel",
  "locale.invalid",
  "fix.test.network",
  "surface.home.tagline",
  "surface.home.accessPro",
  "surface.home.headline",
  "surface.home.body",
  "surface.home.cta",
  "surface.home.photoAlt",
  "surface.home.pitchTitle",
  "surface.home.pitchSubtitle",
  "surface.home.pathProfessionalTitle",
  "surface.home.pathCompanyTitle",
  "surface.home.pathAccess",
  "surface.home.trust",
  "surface.home.rights",
  "surface.home.privacy",
  "surface.auth.proAccess",
  "surface.auth.companyAccess",
  "surface.auth.email",
  "surface.auth.password",
  "surface.auth.enter",
  "surface.auth.forgot",
  "surface.auth.register",
  "surface.auth.professional",
  "surface.auth.company",
  "registration.simple.accessTag",
  "registration.simple.fullName",
  "registration.simple.cpf",
  "registration.simple.email",
  "registration.simple.phone",
  "registration.simple.password",
  "registration.simple.submit",
  "registration.simple.backHome",
  "registration.ui.cadastro-empresa",
  "registration.ui.razao-social",
  "registration.ui.cnpj",
  "registration.ui.cpf-do-responsavel",
  "registration.ui.voltar-a-pagina-inicial",
  "registration.company.brDocumentsHint",
  "registration.company.intlDocumentsHint",
] as const satisfies readonly MessageKey[];

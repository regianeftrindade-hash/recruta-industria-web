import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { messagesEn as enCore } from "@/lib/i18n/messages/en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@/lib/i18n/locales";

const messagesEn = { ...enCore, ...surfacesEn, ...internalEn, ...restEn, ...fixEn };

/** Marcas e rótulos técnicos iguais em todos os idiomas. */
const ALLOW_SAME_AS_EN = new Set([
  "Premium+",
  "Basic+",
  "Free+",
  "WhatsApp",
  "Recruta Indústria",
  "Freelancer",
]);

const CATALOG_LOCALES = SUPPORTED_LOCALES.filter(
  (locale): locale is Exclude<SupportedLocale, "pt-BR" | "en"> =>
    locale !== "pt-BR" && locale !== "en",
);

/** Chaves prioritárias do lançamento: pitch, e-mail, currículo e fix.u longos. */
function isPriorityKey(key: string, enValue: string): boolean {
  if (typeof enValue !== "string" || enValue.trim().length < 8) return false;
  if (ALLOW_SAME_AS_EN.has(enValue)) return false;
  return (
    key.startsWith("surface.auth.pitch.") ||
    key.startsWith("mail.verification.") ||
    key.startsWith("mail.twoFactor.") ||
    key.startsWith("internal.resume.") ||
    key.startsWith("fix.u.")
  );
}

const PRIORITY_KEYS = Object.entries(messagesEn)
  .filter(([key, value]) => isPriorityKey(key, value))
  .map(([key]) => key);

function loadCatalog(locale: string): Record<string, string> {
  return JSON.parse(
    readFileSync(resolve(__dirname, `../messages/catalogs/${locale}.json`), "utf8"),
  ) as Record<string, string>;
}

describe("cobertura prioritária dos catálogos (12 locales)", () => {
  it("define um conjunto prioritário utilizável", () => {
    expect(PRIORITY_KEYS.length).toBeGreaterThan(100);
    expect(CATALOG_LOCALES).toHaveLength(10);
  });

  it("não deixa chaves prioritárias iguais ao inglês nos 10 catálogos", () => {
    const leftovers: string[] = [];
    for (const locale of CATALOG_LOCALES) {
      const catalog = loadCatalog(locale);
      for (const key of PRIORITY_KEYS) {
        const enValue = messagesEn[key as keyof typeof messagesEn];
        if (typeof enValue !== "string") continue;
        if (catalog[key] === enValue) leftovers.push(`${locale}:${key}`);
      }
    }
    expect(leftovers).toEqual([]);
  });

  it("mantém as chaves prioritárias presentes e não vazias", () => {
    const missing: string[] = [];
    for (const locale of CATALOG_LOCALES) {
      const catalog = loadCatalog(locale);
      for (const key of PRIORITY_KEYS) {
        const value = (catalog[key] || "").trim();
        if (!value) missing.push(`${locale}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

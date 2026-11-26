import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { completionMessages } from "@/lib/i18n/messages/completion";
import { completionMessagesEn } from "@/lib/i18n/messages/completion.en";
import { LOCALE_SELECTOR_LABELS_PT, SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

const CATALOG_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== "pt-BR" && l !== "en");
const KEYS = Object.keys(completionMessages) as MessageKey[];

describe("completionMessages coverage", () => {
  it("pt-BR e en têm o mesmo conjunto de chaves", () => {
    expect(Object.keys(completionMessagesEn).sort()).toEqual(
      Object.keys(completionMessages).sort(),
    );
  });

  it("todos os 10 catálogos incluem as chaves de completion", () => {
    for (const locale of CATALOG_LOCALES) {
      const catalog = JSON.parse(
        readFileSync(resolve(__dirname, `../messages/catalogs/${locale}.json`), "utf8"),
      ) as Record<string, string>;
      for (const key of KEYS) {
        expect(catalog[key]?.trim(), `${locale}:${key}`).toBeTruthy();
      }
      // Locales não-pt devem divergir em frases longas (pt-PT pode coincidir em saudações curtas).
      if (locale !== "pt-PT") {
        expect(catalog["welcome.pro.messageBody"]).not.toBe(completionMessages["welcome.pro.messageBody"]);
        expect(catalog["pay.status.temporarilyUnavailable"]).not.toBe(
          completionMessages["pay.status.temporarilyUnavailable"],
        );
      }
    }
  });

  it("t() resolve welcome/pay/legal nos 12 idiomas sem chave crua", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(t("welcome.pro.cta", locale)).not.toContain("welcome.pro.cta");
      expect(t("pay.backHome", locale)).not.toContain("pay.backHome");
      expect(t("auth.googleSignIn", locale)).not.toContain("auth.googleSignIn");
      expect(t("legal.officialTranslationPending", locale)).not.toContain(
        "legal.officialTranslationPending",
      );
    }
  });

  it("seletor usa rótulos em português", () => {
    expect(LOCALE_SELECTOR_LABELS_PT.en).toBe("Inglês");
    expect(LOCALE_SELECTOR_LABELS_PT.es).toBe("Espanhol");
    expect(LOCALE_SELECTOR_LABELS_PT.ar).toBe("Árabe");
    expect(Object.keys(LOCALE_SELECTOR_LABELS_PT)).toHaveLength(SUPPORTED_LOCALES.length);
  });
});

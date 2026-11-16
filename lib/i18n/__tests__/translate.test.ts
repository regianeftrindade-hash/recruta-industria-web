import { describe, expect, it } from "vitest";
import { messagesPtBR } from "@/lib/i18n/messages/pt-BR";
import { DEFAULT_LOCALE, resolveLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";

describe("mensagens da interface", () => {
  it("mantém pt-BR como idioma padrão e como fallback", () => {
    expect(DEFAULT_LOCALE).toBe("pt-BR");
    expect(resolveLocale(undefined)).toBe("pt-BR");
    expect(resolveLocale("pt_BR")).toBe("pt-BR");
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("sv")).toBe("pt-BR");
    expect(resolveLocale("es")).toBe("es");
    expect(t("registration.country.label")).toBe("País");
    expect(t("registration.country.label", "en-US")).toBe("Country");
    expect(t("registration.country.label", "pt_BR")).toBe("País");
    expect(t("registration.country.label", "sv")).toBe("País");
    expect(t("registration.simple.cpfInvalid", "es").length).toBeGreaterThan(0);
  });

  it("não publica outro idioma além do catálogo pt-BR", () => {
    expect(Object.keys(messagesPtBR).length).toBeGreaterThan(0);
    expect(messagesPtBR["registration.country.unavailable"]).toBe(
      "O cadastro deste país ainda não está disponível. Hoje só é possível concluir o cadastro no Brasil.",
    );
    expect(messagesPtBR["registration.country.locked"]).toBe(
      "O país deste cadastro não pode ser alterado.",
    );
    expect(JSON.stringify(messagesPtBR)).not.toMatch(/"[a-z]{2}-[A-Z]{2}"\s*:/);
  });
});

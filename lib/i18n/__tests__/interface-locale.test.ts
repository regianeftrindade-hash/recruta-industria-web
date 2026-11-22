import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import { negotiateAcceptLanguage, resolveFromAcceptLanguage } from "@/lib/i18n/accept-language";
import { localeCookieOptions } from "@/lib/i18n/locale-cookie";
import { requestLocaleChange } from "@/lib/i18n/locale-switch";
import { t } from "@/lib/i18n/translate";

describe("idioma da interface", () => {
  it("dá prioridade ao idioma da conta quando há sessão", () => {
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "en",
      cookieLocale: "es",
      acceptLanguage: "it-IT,it;q=0.9",
    })).toBe("en");
  });

  it("usa o cookie antes do Accept-Language para visitante", () => {
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "es",
      acceptLanguage: "en-US,en;q=0.9",
    })).toBe("es");
  });

  it("detecta Accept-Language quando não há cookie", () => {
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
      acceptLanguage: "en-US,en;q=0.9",
    })).toBe("en");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
      acceptLanguage: "it-IT,it;q=0.9,en;q=0.8",
    })).toBe("it");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
      acceptLanguage: "es-ES,es;q=0.9",
    })).toBe("es");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
      acceptLanguage: "pt-BR,pt;q=0.9",
    })).toBe("pt-BR");
  });

  it("cai em pt-BR quando o navegador só pede idiomas não suportados", () => {
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
      acceptLanguage: "sv-SE,sv;q=0.9",
    })).toBe("pt-BR");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "sv",
      acceptLanguage: null,
    })).toBe("pt-BR");
  });

  it("não deixa falha ou código inválido apagar cookie ou Accept-Language válidos", () => {
    expect(selectInterfaceLocale({
      authenticated: true,
      accountReadFailed: true,
      cookieLocale: "en",
      acceptLanguage: "it",
    })).toBe("en");
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "nao-existe",
      cookieLocale: "es",
      acceptLanguage: "it",
    })).toBe("es");
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "nao-existe",
      cookieLocale: null,
      acceptLanguage: "en-US",
    })).toBe("en");
  });

  it("traduz home e vagas com o locale explícito da página", () => {
    const home = readFileSync("app/page.tsx", "utf8");
    const jobs = readFileSync("app/vagas/page.tsx", "utf8");
    const detail = readFileSync("app/vagas/[id]/page.tsx", "utf8");
    for (const source of [home, jobs, detail]) {
      expect(source).toContain("resolveInterfaceLocale()");
      expect(source).toContain("t(key, locale)");
    }
    expect(t("surface.home.tagline", "en")).toBe("Industry moves forward. So does hiring.");
    expect(t("surface.home.tagline", "en")).not.toBe(t("surface.home.tagline", "pt-BR"));
    expect(t("surface.jobs.title", "es")).not.toBe(t("surface.jobs.title", "pt-BR"));
    expect(t("surface.jobs.title", "es").length).toBeGreaterThan(0);
  });
});

describe("negociação Accept-Language", () => {
  it("respeita qualidade q e mapeia variantes regionais", () => {
    expect(negotiateAcceptLanguage("en-US,en;q=0.9")).toBe("en");
    expect(negotiateAcceptLanguage("pt-BR,pt;q=0.8,en;q=0.5")).toBe("pt-BR");
    expect(negotiateAcceptLanguage("it-IT,it;q=0.9,en;q=0.8")).toBe("it");
    expect(negotiateAcceptLanguage("es-ES,es;q=0.9")).toBe("es");
    expect(negotiateAcceptLanguage("fr-FR,fr;q=0.9")).toBe("fr");
    expect(negotiateAcceptLanguage("de-DE,de;q=0.9")).toBe("de");
  });

  it("escolhe o primeiro suportado quando o preferido não existe", () => {
    expect(negotiateAcceptLanguage("sv-SE,sv;q=0.9,en-US;q=0.8")).toBe("en");
    expect(negotiateAcceptLanguage("xx,yy,it;q=0.5")).toBe("it");
  });

  it("retorna null se nenhum for suportado; resolveFromAcceptLanguage usa pt-BR", () => {
    expect(negotiateAcceptLanguage("sv-SE,sv;q=0.9")).toBeNull();
    expect(negotiateAcceptLanguage("")).toBeNull();
    expect(negotiateAcceptLanguage(null)).toBeNull();
    expect(resolveFromAcceptLanguage("sv-SE")).toBe("pt-BR");
    expect(resolveFromAcceptLanguage("en-GB")).toBe("en");
  });

  it("não promove italiano como padrão global", () => {
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: null, acceptLanguage: null })).toBe("pt-BR");
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: null, acceptLanguage: "" })).toBe("pt-BR");
    expect(resolveFromAcceptLanguage(undefined)).toBe("pt-BR");
  });
});

describe("cookie e seletor de idioma", () => {
  it("marca secure apenas em produção", () => {
    expect(localeCookieOptions("production")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    expect(localeCookieOptions("development").secure).toBe(false);
    expect(localeCookieOptions("test").secure).toBe(false);
  });

  it("não trata falha de rede nem resposta ruim como sucesso", async () => {
    const network = await requestLocaleChange("en", () => {
      throw new Error("offline");
    });
    expect(network).toEqual({ ok: false, reason: "network" });

    const invalid = await requestLocaleChange("en", async () => ({ ok: false, status: 400 }));
    expect(invalid).toEqual({ ok: false, reason: "invalid" });

    const rejected = await requestLocaleChange("en", async () => ({ ok: false, status: 500 }));
    expect(rejected).toEqual({ ok: false, reason: "rejected" });

    const ok = await requestLocaleChange("en", async () => ({ ok: true, status: 200 }));
    expect(ok).toEqual({ ok: true });
  });
});

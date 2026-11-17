import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import { localeCookieOptions } from "@/lib/i18n/locale-cookie";
import { requestLocaleChange } from "@/lib/i18n/locale-switch";
import { t } from "@/lib/i18n/translate";

describe("idioma da interface", () => {
  it("dá prioridade ao idioma da conta quando há sessão", () => {
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "en",
      cookieLocale: "es",
    })).toBe("en");
  });

  it("usa o cookie só para visitante e cai em pt-BR sem preferência válida", () => {
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "es",
    })).toBe("es");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "sv",
    })).toBe("pt-BR");
    expect(selectInterfaceLocale({
      authenticated: false,
      cookieLocale: null,
    })).toBe("pt-BR");
  });

  it("não deixa falha ou código inválido apagar um cookie válido", () => {
    expect(selectInterfaceLocale({
      authenticated: true,
      accountReadFailed: true,
      cookieLocale: "en",
    })).toBe("en");
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "nao-existe",
      cookieLocale: "es",
    })).toBe("es");
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "en",
      cookieLocale: "sv",
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

    const rejected = await requestLocaleChange("en", async () => new Response("no", { status: 500 }));
    expect(rejected).toEqual({ ok: false, reason: "rejected" });

    const invalid = await requestLocaleChange("sv", async () => new Response("no", { status: 400 }));
    expect(invalid).toEqual({ ok: false, reason: "invalid" });

    const saved = await requestLocaleChange("en", async () => new Response("{}", { status: 200 }));
    expect(saved).toEqual({ ok: true });
  });
});

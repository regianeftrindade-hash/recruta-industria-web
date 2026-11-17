import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUPPORTED_LOCALES, textDirection } from "@/lib/i18n/locales";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";

const { update, getServerSession, getToken, encode } = vi.hoisted(() => ({
  update: vi.fn(),
  getServerSession: vi.fn(async () => null),
  getToken: vi.fn(async () => null),
  encode: vi.fn(async () => "jwt-atualizado"),
}));

vi.mock("@/lib/db", () => ({
  prisma: { user: { update } },
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("next-auth/jwt", () => ({
  getToken,
  encode,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
  }),
}));

import { POST } from "@/app/api/account/locale/route";

function post(locale: string, body?: unknown) {
  return POST(new NextRequest(`http://localhost/api/account/locale?locale=${encodeURIComponent(locale)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body === undefined ? { locale } : body),
  }));
}

describe("POST /api/account/locale", () => {
  beforeEach(() => {
    update.mockReset();
    update.mockResolvedValue({ locale: "en" });
    getServerSession.mockReset();
    getServerSession.mockResolvedValue(null);
    getToken.mockReset();
    getToken.mockResolvedValue(null);
    encode.mockClear();
    process.env.NEXTAUTH_SECRET = "segredo-de-teste";
    process.env.NEXTAUTH_URL = "http://localhost:3000";
  });

  it("aceita os 12 idiomas de um visitante e grava o cookie", async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const response = await post(locale);
      expect(response.status, locale).toBe(200);
      const payload = await response.json();
      expect(payload.locale).toBe(locale);
      expect(response.cookies.get("ri-locale")?.value).toBe(locale);
      expect(payload.error).toBeUndefined();
    }
    expect(update).not.toHaveBeenCalled();
  });

  it("aceita o idioma pela query quando o corpo chega vazio", async () => {
    const response = await POST(new NextRequest("http://localhost/api/account/locale?locale=zh-CN", {
      method: "POST",
    }));
    expect(response.status).toBe(200);
    expect(response.cookies.get("ri-locale")?.value).toBe("zh-CN");
  });

  it("grava a conta pelo e-mail e segue mesmo se o banco falhar", async () => {
    getServerSession.mockResolvedValue({ user: { email: "Pessoa@Empresa.com", id: "id-do-provedor" } });
    const saved = await post("es");
    expect(saved.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      where: { email: "pessoa@empresa.com" },
      data: { locale: "es" },
    });

    update.mockRejectedValueOnce(new Error("coluna ausente"));
    const failed = await post("fr");
    expect(failed.status).toBe(200);
    expect(failed.cookies.get("ri-locale")?.value).toBe("fr");
  });

  it("atualiza o JWT para a tela autenticada mudar na hora", async () => {
    getToken.mockResolvedValue({ email: "pessoa@empresa.com", locale: "pt-BR" });
    const response = await post("ar");
    expect(response.status).toBe(200);
    expect(encode).toHaveBeenCalled();
    const token = encode.mock.calls[0]?.[0]?.token as { locale?: string };
    expect(token.locale).toBe("ar");
    expect(response.cookies.get("next-auth.session-token")?.value).toBe("jwt-atualizado");
  });

  it("rejeita só código fora da lista oficial", async () => {
    const response = await post("sv", { locale: "sv" });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe("Idioma não suportado.");
    expect(response.cookies.get("ri-locale")).toBeUndefined();
  });

  it("mantém inglês, espanhol, chinês e o RTL do árabe depois de gravar", () => {
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: "en" })).toBe("en");
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: "es" })).toBe("es");
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: "zh-CN" })).toBe("zh-CN");
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: "pt-BR" })).toBe("pt-BR");
    expect(textDirection("ar")).toBe("rtl");
    expect(selectInterfaceLocale({
      authenticated: true,
      accountLocale: "ar",
      cookieLocale: "ar",
    })).toBe("ar");
  });
});

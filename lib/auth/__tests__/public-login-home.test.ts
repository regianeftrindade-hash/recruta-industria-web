import { describe, expect, it } from "vitest";
import {
  isAdminLoginRedirect,
  publicLoginHomeHref,
  safePostLoginPath,
} from "@/lib/auth/public-login-home";

describe("public-login-home", () => {
  it("reconhece redirect de admin", () => {
    expect(isAdminLoginRedirect("/admin")).toBe(true);
    expect(isAdminLoginRedirect("/admin/users")).toBe(true);
    expect(isAdminLoginRedirect("/professional/dashboard")).toBe(false);
  });

  it("manda login público para a home", () => {
    expect(publicLoginHomeHref()).toBe("/");
    expect(publicLoginHomeHref({ tipo: "profissional" })).toBe("/?acesso=profissional");
    expect(publicLoginHomeHref({ tipo: "empresa" })).toBe("/?acesso=empresa");
    expect(
      publicLoginHomeHref({
        tipo: "profissional",
        redirect: "/professional/pagamento",
      }),
    ).toBe("/?redirect=%2Fprofessional%2Fpagamento&acesso=profissional");
  });

  it("mantém /login só para admin", () => {
    expect(publicLoginHomeHref({ redirect: "/admin" })).toBe(
      "/login?redirect=%2Fadmin",
    );
  });

  it("valida paths internos", () => {
    expect(safePostLoginPath("/vagas/1")).toBe("/vagas/1");
    expect(safePostLoginPath("https://evil.example")).toBeNull();
    expect(safePostLoginPath("//evil")).toBeNull();
  });
});

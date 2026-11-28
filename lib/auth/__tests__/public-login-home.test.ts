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

  it("manda login público para /login com tipo", () => {
    expect(publicLoginHomeHref()).toBe("/login");
    expect(publicLoginHomeHref({ tipo: "profissional" })).toBe(
      "/login?tipo=profissional",
    );
    expect(publicLoginHomeHref({ tipo: "empresa" })).toBe("/login?tipo=empresa");
    expect(
      publicLoginHomeHref({
        tipo: "profissional",
        redirect: "/professional/pagamento",
      }),
    ).toBe("/login?tipo=profissional&redirect=%2Fprofessional%2Fpagamento");
  });

  it("mantém /login com redirect só para admin", () => {
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

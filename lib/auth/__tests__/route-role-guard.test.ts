import { describe, expect, it } from "vitest";
import {
  canRoleAccessArea,
  decideProtectedRouteAccess,
  homePathForRole,
  normalizeAccountRole,
  protectedAreaForPath,
} from "@/lib/auth/route-role-guard";

describe("route-role-guard", () => {
  it("classifica rotas protegidas por área", () => {
    expect(protectedAreaForPath("/professional/dashboard")).toBe("professional");
    expect(protectedAreaForPath("/professional/dashboard/painel")).toBe("professional");
    expect(protectedAreaForPath("/professional/pagamento")).toBe("professional");
    expect(protectedAreaForPath("/company/dashboard-empresa")).toBe("company");
    expect(protectedAreaForPath("/company/dashboard-empresa/meu-plano")).toBe("company");
    expect(protectedAreaForPath("/company/professional/abc")).toBe("company");
    expect(protectedAreaForPath("/company/pagamento")).toBe("company");
    expect(protectedAreaForPath("/login")).toBeNull();
    expect(protectedAreaForPath("/vagas")).toBeNull();
    expect(protectedAreaForPath("/professional/register")).toBeNull();
  });

  it("normaliza papéis do JWT", () => {
    expect(normalizeAccountRole("PROFESSIONAL")).toBe("PROFESSIONAL");
    expect(normalizeAccountRole("company")).toBe("COMPANY");
    expect(normalizeAccountRole("ADMIN")).toBe("ADMIN");
    expect(normalizeAccountRole("other")).toBeNull();
  });

  it("admin acessa ambas as áreas; papéis cruzados não", () => {
    expect(canRoleAccessArea("ADMIN", "company")).toBe(true);
    expect(canRoleAccessArea("ADMIN", "professional")).toBe(true);
    expect(canRoleAccessArea("PROFESSIONAL", "company")).toBe(false);
    expect(canRoleAccessArea("COMPANY", "professional")).toBe(false);
    expect(canRoleAccessArea("PROFESSIONAL", "professional")).toBe(true);
    expect(canRoleAccessArea(null, "professional", { isAdmin: true })).toBe(true);
  });

  it("sem sessão: dashboard → home; pagamento → login tipado", () => {
    expect(
      decideProtectedRouteAccess({
        pathname: "/professional/dashboard",
        hasEmail: false,
        userType: null,
        emailHomePath: "/",
      }),
    ).toEqual({
      action: "unauthenticated",
      redirectPath: "/",
      preserveRedirectQuery: false,
    });

    expect(
      decideProtectedRouteAccess({
        pathname: "/company/pagamento",
        hasEmail: false,
        userType: null,
      }),
    ).toEqual({
      action: "unauthenticated",
      redirectPath: "/login?tipo=empresa",
      preserveRedirectQuery: true,
    });
  });

  it("papel errado redireciona para a área correta sem loop de login", () => {
    expect(
      decideProtectedRouteAccess({
        pathname: "/company/dashboard-empresa",
        hasEmail: true,
        userType: "PROFESSIONAL",
      }),
    ).toEqual({
      action: "wrong_role",
      redirectPath: "/professional/dashboard",
    });

    expect(
      decideProtectedRouteAccess({
        pathname: "/professional/dashboard",
        hasEmail: true,
        userType: "COMPANY",
      }),
    ).toEqual({
      action: "wrong_role",
      redirectPath: "/company/dashboard-empresa",
    });

    expect(homePathForRole("ADMIN")).toBe("/admin");
  });

  it("permite acesso legítimo", () => {
    expect(
      decideProtectedRouteAccess({
        pathname: "/professional/dashboard",
        hasEmail: true,
        userType: "PROFESSIONAL",
      }),
    ).toEqual({ action: "allow" });

    expect(
      decideProtectedRouteAccess({
        pathname: "/company/dashboard-empresa",
        hasEmail: true,
        userType: "COMPANY",
        isAdmin: false,
      }),
    ).toEqual({ action: "allow" });
  });
});

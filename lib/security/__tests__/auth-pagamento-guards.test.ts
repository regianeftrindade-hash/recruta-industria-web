import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { isValidCNPJ, isValidCPF, isValidEmail, sanitizeInput } from "@/lib/security/security";
import { validatePasswordStrength } from "@/lib/security/password-strength";
import { isAdminUser, hasAdminAccess, validateAdminApiKey } from "@/lib/auth/admin-auth";

describe("login / cadastro — validação", () => {
  it("e-mail", () => {
    expect(isValidEmail("rh@empresa.com")).toBe(true);
    expect(isValidEmail("sem-arroba")).toBe(false);
  });

  it("CPF e CNPJ inválidos óbvios", () => {
    expect(isValidCPF("00000000000")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCNPJ("00000000000000")).toBe(false);
    expect(isValidCNPJ("123")).toBe(false);
  });

  it("sanitiza XSS básico", () => {
    expect(sanitizeInput("  <script>alert(1)</script>  ")).not.toContain("<");
    expect(sanitizeInput("javascript:alert(1)")).not.toMatch(/javascript:/i);
  });

  it("senha fraca vs forte", () => {
    expect(validatePasswordStrength("123").isStrong).toBe(false);
    expect(validatePasswordStrength("Abcdef1!xyz").isStrong).toBe(true);
  });
});

describe("admin", () => {
  const prevEmails = process.env.ADMIN_EMAILS;
  const prevKey = process.env.ADMIN_API_KEY;

  beforeEach(() => {
    process.env.ADMIN_EMAILS = "dono@recruta.com";
    process.env.ADMIN_API_KEY = "chave-secreta-admin";
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    process.env.ADMIN_EMAILS = prevEmails;
    process.env.ADMIN_API_KEY = prevKey;
    vi.unstubAllEnvs();
  });

  it("só e-mail da lista ou role ADMIN", () => {
    expect(isAdminUser("dono@recruta.com")).toBe(true);
    expect(isAdminUser("outro@x.com")).toBe(false);
    expect(isAdminUser("x@y.com", "ADMIN")).toBe(true);
    expect(hasAdminAccess({ email: "dono@recruta.com" })).toBe(true);
    expect(hasAdminAccess({ isAdmin: true })).toBe(true);
  });

  it("API key admin", () => {
    expect(validateAdminApiKey("chave-secreta-admin")).toBe(true);
    expect(validateAdminApiKey("errada")).toBe(false);
    expect(validateAdminApiKey(null)).toBe(false);
  });
});

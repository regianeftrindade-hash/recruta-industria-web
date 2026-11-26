import { afterEach, describe, expect, it } from "vitest";
import { generatePasswordResetToken, verifyPasswordResetToken } from "@/lib/security/security.server";

const KEYS = ["NODE_ENV", "NEXTAUTH_SECRET", "PASSWORD_RESET_SECRET"] as const;
const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of KEYS) {
    const prev = saved[key];
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
    delete saved[key];
  }
});

function stash(key: (typeof KEYS)[number]) {
  if (!(key in saved)) saved[key] = process.env[key];
}

describe("password reset secret", () => {
  it("usa NEXTAUTH_SECRET em production", () => {
    stash("NODE_ENV");
    stash("NEXTAUTH_SECRET");
    stash("PASSWORD_RESET_SECRET");
    process.env.NODE_ENV = "production";
    process.env.NEXTAUTH_SECRET = "segredo-de-producao-teste";
    delete process.env.PASSWORD_RESET_SECRET;

    const token = generatePasswordResetToken("pro.teste@example.invalid");
    expect(verifyPasswordResetToken(token)).toBe("pro.teste@example.invalid");
  });

  it("falha fechado em production sem secret", () => {
    stash("NODE_ENV");
    stash("NEXTAUTH_SECRET");
    stash("PASSWORD_RESET_SECRET");
    process.env.NODE_ENV = "production";
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.PASSWORD_RESET_SECRET;

    expect(() => generatePasswordResetToken("pro.teste@example.invalid")).toThrow(/NEXTAUTH_SECRET|PASSWORD_RESET_SECRET/);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { ensureProductionNextAuthUrl } from "@/lib/auth/sync-nextauth-url";

const ORIGINAL = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL);
});

describe("ensureProductionNextAuthUrl", () => {
  it("em Preview preserva alias estável e não sobrescreve com VERCEL_URL", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.NEXTAUTH_URL = "https://recruta-industria-preview-stripe.vercel.app";
    process.env.VERCEL_URL = "recruta-industria-abcdef-team.vercel.app";
    ensureProductionNextAuthUrl();
    expect(process.env.NEXTAUTH_URL).toBe(
      "https://recruta-industria-preview-stripe.vercel.app",
    );
  });

  it("em Preview sem NEXTAUTH_URL cai no host VERCEL_URL", () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.NEXTAUTH_URL;
    process.env.VERCEL_URL = "recruta-industria-abcdef-team.vercel.app";
    ensureProductionNextAuthUrl();
    expect(process.env.NEXTAUTH_URL).toBe(
      "https://recruta-industria-abcdef-team.vercel.app",
    );
  });

  it("em Production força domínio canônico", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL = "1";
    process.env.NEXTAUTH_URL = "https://something-else.vercel.app";
    ensureProductionNextAuthUrl();
    expect(process.env.NEXTAUTH_URL).toBe("https://www.recrutaindustria.com");
  });
});

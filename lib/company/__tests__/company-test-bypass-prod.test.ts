import { afterEach, describe, expect, it } from "vitest";
import { getCompanyTestBypassKeys, matchesCompanyTestBypass } from "@/lib/company/company-test-bypass-shared";

const ENV_KEYS = [
  "NODE_ENV",
  "COMPANY_TEST_BYPASS_KEYS",
  "COMPANY_TEST_BYPASS_EMAILS",
  "NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS",
  "ALLOW_COMPANY_TEST_BYPASS_DEFAULTS",
] as const;

const saved: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {};

afterEach(() => {
  for (const key of ENV_KEYS) {
    const prev = saved[key];
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
    delete saved[key];
  }
});

function stash(key: (typeof ENV_KEYS)[number]) {
  if (!(key in saved)) saved[key] = process.env[key];
}

describe("company test bypass — production", () => {
  it("não embute paizaonacozinha em NODE_ENV=production", () => {
    stash("NODE_ENV");
    stash("ALLOW_COMPANY_TEST_BYPASS_DEFAULTS");
    stash("COMPANY_TEST_BYPASS_KEYS");
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_COMPANY_TEST_BYPASS_DEFAULTS;
    delete process.env.COMPANY_TEST_BYPASS_KEYS;
    delete process.env.COMPANY_TEST_BYPASS_EMAILS;
    delete process.env.NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS;

    expect(getCompanyTestBypassKeys()).toEqual([]);
    expect(matchesCompanyTestBypass({ email: "paizaonacozinha@example.invalid" })).toBe(false);
  });

  it("ainda aceita chaves só via env em production", () => {
    stash("NODE_ENV");
    stash("COMPANY_TEST_BYPASS_KEYS");
    process.env.NODE_ENV = "production";
    process.env.COMPANY_TEST_BYPASS_KEYS = "paizaonacozinha";
    expect(matchesCompanyTestBypass({ email: "paizaonacozinha@example.invalid" })).toBe(true);
  });

  it("mantém default fora de production (vitest/dev)", () => {
    stash("NODE_ENV");
    stash("ALLOW_COMPANY_TEST_BYPASS_DEFAULTS");
    process.env.NODE_ENV = "test";
    delete process.env.ALLOW_COMPANY_TEST_BYPASS_DEFAULTS;
    expect(matchesCompanyTestBypass({ companyName: "Paizao Na Cozinha LTDA" })).toBe(true);
  });
});

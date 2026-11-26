import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("security headers (next.config.js)", () => {
  const source = readFileSync(resolve(process.cwd(), "next.config.js"), "utf8");

  it("define headers críticos de segurança", () => {
    expect(source).toContain("X-Content-Type-Options");
    expect(source).toContain("nosniff");
    expect(source).toContain("X-Frame-Options");
    expect(source).toContain("DENY");
    expect(source).toContain("Referrer-Policy");
    expect(source).toContain("Strict-Transport-Security");
    expect(source).toContain("Permissions-Policy");
    expect(source).toContain("Cross-Origin-Opener-Policy");
  });

  it("expõe alias PWA manifest.webmanifest", () => {
    expect(source).toContain("/manifest.webmanifest");
    expect(source).toContain("/manifest.json");
  });
});

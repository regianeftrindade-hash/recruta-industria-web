import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

/**
 * Garante que /login?tipo=profissional e /login/profissional abrem o login
 * profissional (não redirecionam para a home), espelhando o fluxo empresa.
 */
describe("rotas de login por tipo", () => {
  it("next.config redireciona /login/profissional e /login/empresa para ?tipo=", async () => {
    const require = createRequire(import.meta.url);
    // next.config.js exporta função ou objeto conforme o ambiente
    const mod = require("../../../next.config.js");
    const config = typeof mod === "function" ? await mod() : mod;
    const redirects =
      typeof config.redirects === "function" ? await config.redirects() : config.redirects;

    const bySource = Object.fromEntries(
      (redirects as Array<{ source: string; destination: string }>).map((r) => [
        r.source,
        r.destination,
      ]),
    );

    expect(bySource["/login/empresa"]).toBe("/login?tipo=empresa");
    expect(bySource["/login/profissional"]).toBe("/login?tipo=profissional");
    expect(bySource["/login/profissional"]).not.toBe("/");
  });

  it("proxy.ts não contém redirect de tipo=profissional para home", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const proxySrc = await fs.readFile(
      path.join(process.cwd(), "proxy.ts"),
      "utf8",
    );
    expect(proxySrc).not.toMatch(
      /tipo['"]?\s*===\s*['"]profissional['"][\s\S]{0,120}pathname\s*=\s*['"]\/['"]/,
    );
    expect(proxySrc).not.toMatch(
      /searchParams\.get\(['"]tipo['"]\)\s*===\s*['"]profissional['"]/,
    );
  });
});

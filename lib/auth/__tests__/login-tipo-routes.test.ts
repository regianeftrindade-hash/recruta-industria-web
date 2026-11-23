import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

/**
 * Login público é na home. /login/profissional e /login/empresa
 * redirecionam para a home; /login?tipo=* também (via proxy).
 */
describe("rotas de login por tipo", () => {
  it("next.config manda /login/profissional e /login/empresa para a home", async () => {
    const require = createRequire(import.meta.url);
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

    expect(bySource["/login/empresa"]).toBe("/?acesso=empresa");
    expect(bySource["/login/profissional"]).toBe("/");
  });

  it("proxy.ts redireciona /login público para a home", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const proxySrc = await fs.readFile(
      path.join(process.cwd(), "proxy.ts"),
      "utf8",
    );
    expect(proxySrc).toMatch(/publicLoginHomeHref/);
    expect(proxySrc).toMatch(/isAdminLoginRedirect/);
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Organization / WebSite JSON-LD", () => {
  it("não descreve a plataforma apenas como Brasil", () => {
    const src = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(src).not.toMatch(
      /Plataforma de recrutamento industrial para empresas e profissionais no Brasil\./,
    );
    expect(src).toMatch(/mercados internacionais|International/);
    expect(src).toMatch(/areaServed/);
    expect(src).toMatch(/contato@recrutaindustria\.com/);
  });
});

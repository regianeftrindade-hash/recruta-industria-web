import { describe, expect, it } from "vitest";
import { caminhoDeVolta, hrefComVolta } from "@/lib/jobs/job-return-path";

describe("volta da vaga para o admin", () => {
  it("aceita só a lista de vagas do admin", () => {
    expect(caminhoDeVolta("/admin/vagas")).toBe("/admin/vagas");
    expect(caminhoDeVolta("%2Fadmin%2Fvagas")).toBe("/admin/vagas");
    expect(caminhoDeVolta("/vagas")).toBeNull();
    expect(caminhoDeVolta("https://example.com/admin/vagas")).toBeNull();
    expect(caminhoDeVolta("//admin/vagas")).toBeNull();
  });

  it("leva o destino no link da vaga e da lista", () => {
    expect(hrefComVolta("/vagas/abc", "/admin/vagas")).toBe("/vagas/abc?voltar=%2Fadmin%2Fvagas");
    expect(hrefComVolta("/vagas?q=solda", "/admin/vagas")).toBe("/vagas?q=solda&voltar=%2Fadmin%2Fvagas");
    expect(hrefComVolta("/vagas/abc", "/vagas")).toBe("/vagas/abc");
  });
});

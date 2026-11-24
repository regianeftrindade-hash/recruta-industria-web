import { describe, expect, it } from "vitest";
import { parseJobSearch, publicJobWhere } from "@/lib/jobs/job-search";

describe("busca pública de vagas", () => {
  it("ignora filtro inválido e mantém só vagas publicadas", () => {
    const where = publicJobWhere(parseJobSearch({ contrato: "HACK", modalidade: "REMOTO" }));
    expect(where).toEqual({ AND: [{ status: "PUBLISHED" }] });
  });

  it("não procura o nome real de uma vaga confidencial", () => {
    const where = publicJobWhere(parseJobSearch({ q: "MetalurgicaSigilosa" }));
    const text = JSON.stringify(where);
    expect(text).toContain('"confidential":false');
    expect(text).toContain("MetalurgicaSigilosa");
    const companyClause = JSON.stringify(where).match(/\{"confidential":false,"companyName":\{[^}]+\}\}/);
    expect(companyClause?.[0]).toContain('"confidential":false');
  });

  it("aceita contratação, modalidade, local, salário e período", () => {
    const filters = parseJobSearch({
      contrato: "CLT",
      modalidade: "PRESENCIAL",
      local: "Joinville",
      salario: "negociavel",
      de: "2026-10-20",
      ate: "2026-10-01",
    });
    expect(filters.contractType).toBe("CLT");
    expect(filters.workMode).toBe("PRESENCIAL");
    expect(filters.salary).toBe("negociavel");
    expect(filters.publishedFrom?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(filters.publishedTo?.toISOString()).toBe("2026-10-20T00:00:00.000Z");
    const where = publicJobWhere(filters);
    expect(JSON.stringify(where)).toContain("Joinville");
    expect(JSON.stringify(where)).toContain('"salaryNegotiable":true');
    expect(JSON.stringify(where)).not.toContain('"currency"');
    expect(JSON.stringify(where)).not.toContain("applicationEmail");
  });

  it("combina cidade, estado, período, faixa, contratação e modalidade", () => {
    const now = new Date("2026-10-21T15:00:00.000Z");
    const filters = parseJobSearch({
      q: "Auxiliar administrativo",
      cidade: "Hortolândia",
      estado: "SP",
      periodo: "15",
      minimo: "1.000",
      maximo: "2.000,00",
      contrato: "CLT",
      modalidade: "HOME_OFFICE",
    });
    expect(filters.salaryMinCents).toBe(100000);
    expect(filters.salaryMaxCents).toBe(200000);
    const where = publicJobWhere(filters, now);
    const text = JSON.stringify(where);
    expect(text).toContain("Hortolândia");
    expect(text).toContain("/SP");
    expect(text).toContain("2026-10-06T00:00:00.000Z");
    expect(text).toContain('"gte":100000');
    expect(text).toContain('"lte":200000');
    expect(text).toContain('"currency":"BRL"');
    expect(text).toContain('"salaryNegotiable":false');
    expect(text).toContain("HOME_OFFICE");
    expect(text).toContain('"confidential":false');
  });

  it("usa o horário real da publicação nas últimas 24 horas", () => {
    const now = new Date("2026-10-21T15:00:00.000Z");
    const where = publicJobWhere(parseJobSearch({ periodo: "24h" }), now);
    expect(JSON.stringify(where)).toContain('"publishedAt":{"gte":"2026-10-20T15:00:00.000Z"}');
  });

  it("aceita só um limite da faixa e não inventa o outro", () => {
    const where = publicJobWhere(parseJobSearch({ minimo: "1500" }));
    const text = JSON.stringify(where);
    expect(text).toContain('"currency":"BRL"');
    expect(text).toContain('"gte":150000');
    expect(text).not.toContain('"lte"');
    expect(text).toContain('"salaryNegotiable":false');
  });

  it("não compara salários de moedas diferentes", () => {
    const reais = publicJobWhere(parseJobSearch({ minimo: "3000", maximo: "3000", moeda: "BRL" }));
    const dolares = publicJobWhere(parseJobSearch({ minimo: "3000", maximo: "3000", moeda: "usd" }));
    const euros = publicJobWhere(parseJobSearch({ salario: "informado", moeda: "EUR" }));
    expect(JSON.stringify(reais)).toContain('"currency":"BRL"');
    expect(JSON.stringify(dolares)).toContain('"currency":"USD"');
    expect(JSON.stringify(dolares)).toContain('"gte":300000');
    expect(JSON.stringify(euros)).toContain('"currency":"EUR"');
    expect(JSON.stringify(reais)).not.toContain('"currency":"USD"');
    expect(JSON.stringify(dolares)).not.toContain('"currency":"BRL"');
  });

  it("mantém a faixa brasileira em BRL quando a moeda é inválida ou ausente", () => {
    const where = publicJobWhere(parseJobSearch({
      cidade: "Campinas",
      estado: "SP",
      contrato: "CLT",
      modalidade: "PRESENCIAL",
      minimo: "1.000",
      maximo: "2.000",
      moeda: "dinheiro",
    }));
    const text = JSON.stringify(where);
    expect(text).toContain("Campinas");
    expect(text).toContain("CLT");
    expect(text).toContain("PRESENCIAL");
    expect(text).toContain('"currency":"BRL"');
    expect(text).toContain('"gte":100000');
    expect(text).toContain('"lte":200000');
    // Sem ?moeda= o filtro isolado fica vazio; faixas/salário informado caem em BRL no where.
    expect(parseJobSearch({ salario: "informado" }).salaryCurrency).toBe("");
    expect(JSON.stringify(publicJobWhere(parseJobSearch({ salario: "informado" })))).toContain(
      '"currency":"BRL"',
    );
  });

  it("filtra por país e por moeda explícita sem exigir faixa", () => {
    expect(JSON.stringify(publicJobWhere(parseJobSearch({ pais: "PT" })))).toContain(
      '"countryCode":"PT"',
    );
    expect(JSON.stringify(publicJobWhere(parseJobSearch({ moeda: "USD" })))).toContain(
      '"currency":"USD"',
    );
  });
});

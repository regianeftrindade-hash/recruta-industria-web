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
    expect(text).toContain('"gte":150000');
    expect(text).not.toContain('"lte"');
    expect(text).toContain('"salaryNegotiable":false');
  });
});

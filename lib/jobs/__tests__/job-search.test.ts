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
});

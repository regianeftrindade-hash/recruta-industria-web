import { describe, expect, it } from "vitest";
import { parseJobSearch } from "@/lib/jobs/job-search";
import {
  aplicarFaixaSalarial,
  hrefListaVagas,
  temFiltroDeVaga,
} from "@/lib/jobs/public-vagas-filtros";

describe("filtros da lista pública", () => {
  it("traduz a faixa para a busca que já existe", () => {
    const filters = parseJobSearch(aplicarFaixaSalarial({ faixa: "2000-3000", q: "soldador" }));
    expect(filters.q).toBe("soldador");
    expect(filters.salaryMinCents).toBe(200_000);
    expect(filters.salaryMaxCents).toBe(300_000);
  });

  it("trata a combinar como salário negociável", () => {
    const filters = parseJobSearch(aplicarFaixaSalarial({ faixa: "combinar" }));
    expect(filters.salary).toBe("negociavel");
  });

  it("monta o link da página sem perder os filtros", () => {
    expect(hrefListaVagas({ q: "auxilia", estado: "SP" }, 2)).toBe("/vagas?q=auxilia&estado=SP&pagina=2");
    expect(hrefListaVagas({}, 1)).toBe("/vagas");
    expect(temFiltroDeVaga({ cidade: "Curitiba" })).toBe(true);
    expect(temFiltroDeVaga({})).toBe(false);
  });
});

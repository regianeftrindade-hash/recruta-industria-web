import { describe, expect, it } from "vitest";
import { normalizarBuscaVitrine, temFiltroAvancado } from "@/lib/company/vitrine-busca-memoria";

describe("memória da busca da vitrine", () => {
  it("guarda filtros e a página da lista", () => {
    expect(
      normalizarBuscaVitrine({
        filtros: { estado: "SP", cidade: "Hortolândia", cargo: "" },
        page: 2,
      }),
    ).toEqual({
      filtros: { estado: "SP", cidade: "Hortolândia" },
      page: 2,
    });
  });

  it("guarda a lista do banco quando a busca foi por ids", () => {
    expect(
      normalizarBuscaVitrine({
        filtros: {},
        page: 0,
        ids: ["a", " ", "b"],
        listaNome: "Qualidade",
      }),
    ).toEqual({
      filtros: {},
      page: 1,
      ids: ["a", "b"],
      listaNome: "Qualidade",
    });
  });

  it("ignora memória vazia", () => {
    expect(normalizarBuscaVitrine(null)).toBeNull();
    expect(normalizarBuscaVitrine({ filtros: { cargo: "  " }, page: 1 })).toBeNull();
  });

  it("reconhece filtro avançado fora da busca rápida", () => {
    expect(temFiltroAvancado({ estado: "SP", cargo: "qualidade" })).toBe(false);
    expect(temFiltroAvancado({ escolaridade: "Superior completo" })).toBe(true);
  });
});

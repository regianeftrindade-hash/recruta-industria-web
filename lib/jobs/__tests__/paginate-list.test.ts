import { describe, expect, it } from "vitest";
import { paginarLista, paginasDaBarra } from "@/lib/jobs/paginate-list";

describe("paginarLista", () => {
  const itens = Array.from({ length: 23 }, (_, index) => index + 1);

  it("mostra 10 itens por página", () => {
    expect(paginarLista(itens, 1, 10).itens).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(paginarLista(itens, 2, 10).itens).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(paginarLista(itens, 3, 10).itens).toEqual([21, 22, 23]);
  });

  it("não devolve a lista inteira quando há mais de uma página", () => {
    const pagina = paginarLista(itens, 1, 10);
    expect(pagina.itens).toHaveLength(10);
    expect(pagina.totalPaginas).toBe(3);
    expect(pagina.itens).not.toEqual(itens);
  });

  it("segura a página dentro do intervalo", () => {
    expect(paginarLista(itens, 0, 10).pagina).toBe(1);
    expect(paginarLista(itens, 99, 10).pagina).toBe(3);
    expect(paginarLista([], 1, 10)).toEqual({ itens: [], pagina: 1, totalPaginas: 0 });
  });

  it("monta a barra sem o total de itens", () => {
    expect(paginasDaBarra(1, 12)).toEqual([1, 2, 3, 4, 5]);
    expect(paginasDaBarra(12, 12)).toEqual([8, 9, 10, 11, 12]);
  });
});

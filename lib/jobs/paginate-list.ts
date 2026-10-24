export function paginarLista<T>(items: T[], pagina: number, porPagina: number): {
  itens: T[];
  pagina: number;
  totalPaginas: number;
} {
  const tamanho = Math.max(1, porPagina);
  const totalPaginas = Math.ceil(items.length / tamanho);
  const atual = totalPaginas === 0 ? 1 : Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (atual - 1) * tamanho;
  return {
    itens: items.slice(inicio, inicio + tamanho),
    pagina: atual,
    totalPaginas,
  };
}

export function paginasDaBarra(atual: number, total: number): number[] {
  const janela = 5;
  let inicio = Math.max(1, atual - 2);
  const fim = Math.min(total, inicio + janela - 1);
  inicio = Math.max(1, fim - janela + 1);
  const numeros: number[] = [];
  for (let numero = inicio; numero <= fim; numero += 1) numeros.push(numero);
  return numeros;
}

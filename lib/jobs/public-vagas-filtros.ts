/** Filtros da lista pública /vagas. A mesma busca do painel, em páginas. */

export const VAGAS_POR_PAGINA_PUBLICA = 12;

export const UFS_BRASIL: Array<{ uf: string; nome: string }> = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
];

export const FAIXAS_SALARIO_VAGA: Array<{
  id: string;
  label: string;
  minimo: string;
  maximo: string;
  negociavel: boolean;
}> = [
  { id: "1000-2000", label: "1.000 a 2.000", minimo: "1000", maximo: "2000", negociavel: false },
  { id: "2000-3000", label: "2.000 a 3.000", minimo: "2000", maximo: "3000", negociavel: false },
  { id: "3000-4000", label: "3.000 a 4.000", minimo: "3000", maximo: "4000", negociavel: false },
  { id: "4000-5000", label: "4.000 a 5.000", minimo: "4000", maximo: "5000", negociavel: false },
  { id: "acima-5000", label: "Acima de 5.000", minimo: "5000.01", maximo: "", negociavel: false },
  { id: "combinar", label: "A combinar", minimo: "", maximo: "", negociavel: true },
];

const CHAVES_FILTRO = ["q", "cidade", "estado", "periodo", "faixa", "contrato", "modalidade"] as const;

export function achatarSearchParams(
  raw: Record<string, string | string[] | undefined>,
): Record<string, string | undefined> {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(raw)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  return flat;
}

export function aplicarFaixaSalarial(
  params: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const faixa = FAIXAS_SALARIO_VAGA.find((item) => item.id === (params.faixa || "").trim());
  if (!faixa) return params;
  const next = { ...params };
  delete next.faixa;
  delete next.pagina;
  if (faixa.negociavel) {
    next.salario = "negociavel";
    return next;
  }
  if (faixa.minimo) next.minimo = faixa.minimo;
  if (faixa.maximo) next.maximo = faixa.maximo;
  return next;
}

export function temFiltroDeVaga(params: Record<string, string | undefined>): boolean {
  return CHAVES_FILTRO.some((key) => (params[key] || "").trim().length > 0);
}

export function hrefListaVagas(params: Record<string, string | undefined>, pagina = 1): string {
  const qs = new URLSearchParams();
  for (const key of CHAVES_FILTRO) {
    const value = (params[key] || "").trim();
    if (value) qs.set(key, value);
  }
  if (pagina > 1) qs.set("pagina", String(pagina));
  const query = qs.toString();
  return query ? `/vagas?${query}` : "/vagas";
}

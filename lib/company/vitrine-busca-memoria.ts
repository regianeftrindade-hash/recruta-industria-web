/** Última busca da Caça Talentos, para o Voltar do perfil reabrir a mesma lista. */
export const VITRINE_BUSCA_KEY = "company-vitrine-busca";

export const DESTINO_LISTA_PROFISSIONAIS = "/company/dashboard-empresa?tab=inicio";

const FILTROS_RAPIDOS = new Set(["cargo", "estado", "cidade", "experiencia", "turno"]);

export type VitrineBuscaMemoria = {
  filtros: Record<string, string>;
  page: number;
  ids?: string[];
  listaNome?: string;
};

export function normalizarBuscaVitrine(raw: unknown): VitrineBuscaMemoria | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as { filtros?: unknown; page?: unknown; ids?: unknown; listaNome?: unknown };
  const filtros: Record<string, string> = {};
  if (data.filtros && typeof data.filtros === "object") {
    for (const [chave, valor] of Object.entries(data.filtros)) {
      if (typeof valor === "string" && valor.trim()) filtros[chave] = valor;
    }
  }
  const page = Math.floor(Number(data.page));
  const ids = Array.isArray(data.ids)
    ? data.ids.map((id) => String(id || "").trim()).filter(Boolean)
    : undefined;
  const listaNome = typeof data.listaNome === "string" ? data.listaNome : "";
  const temFiltro = Object.keys(filtros).length > 0;
  const temLista = ids !== undefined;
  if (!temFiltro && !temLista) return null;
  return {
    filtros,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    ...(temLista ? { ids, listaNome } : {}),
  };
}

export function temFiltroAvancado(filtros: Record<string, string>): boolean {
  return Object.entries(filtros).some(([chave, valor]) => !FILTROS_RAPIDOS.has(chave) && valor.trim() !== "");
}

export function salvarBuscaVitrine(memoria: VitrineBuscaMemoria): void {
  if (typeof window === "undefined") return;
  const limpa = normalizarBuscaVitrine(memoria);
  try {
    if (!limpa) {
      window.sessionStorage.removeItem(VITRINE_BUSCA_KEY);
      return;
    }
    window.sessionStorage.setItem(VITRINE_BUSCA_KEY, JSON.stringify(limpa));
  } catch {
    /* navegador sem storage */
  }
}

export function lerBuscaVitrine(): VitrineBuscaMemoria | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(VITRINE_BUSCA_KEY);
    if (!raw) return null;
    return normalizarBuscaVitrine(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function limparBuscaVitrine(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(VITRINE_BUSCA_KEY);
  } catch {
    /* navegador sem storage */
  }
}

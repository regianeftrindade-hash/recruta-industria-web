/** Utilitários da linha do tempo de carreira (experiências do cadastro). */

export type CareerTimelineInput = {
  nome?: string;
  cargo?: string;
  segmento?: string;
  dataInicio?: string;
  dataFim?: string;
  descricao?: string;
};

export type CareerTimelineItem = {
  periodo: string;
  cargo: string;
  empresa: string;
  segmento?: string;
  descricao?: string;
  /** Ano+mês de início para ordenação (mais antigo primeiro). */
  sortKey: number;
  /** Ex.: "2015–2018 → Operador CNC – GKN" */
  label: string;
};

const ATUAL_RE = /^(atual|presente|hoje|current|now)$/i;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Extrai ano (e mês opcional 1–12) de strings YYYY, YYYY-MM, MM/YYYY, ISO, etc. */
export function parseCareerDate(raw: string | undefined | null): { year: number; month: number } | null {
  const s = String(raw || "").trim();
  if (!s || ATUAL_RE.test(s)) return null;

  // YYYY-MM ou YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Math.min(12, Math.max(1, Number(iso[2])));
    if (year >= 1900 && year <= 2100) return { year, month };
  }

  // MM/YYYY ou M/YYYY
  const br = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (br) {
    const month = Math.min(12, Math.max(1, Number(br[1])));
    const year = Number(br[2]);
    if (year >= 1900 && year <= 2100) return { year, month };
  }

  // YYYY
  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    const year = Number(yearOnly[1]);
    if (year >= 1900 && year <= 2100) return { year, month: 1 };
  }

  const d = digitsOnly(s);
  if (d.length === 6) {
    // YYYYMM
    const year = Number(d.slice(0, 4));
    const month = Math.min(12, Math.max(1, Number(d.slice(4, 6))));
    if (year >= 1900 && year <= 2100) return { year, month };
  }
  if (d.length === 4) {
    const year = Number(d);
    if (year >= 1900 && year <= 2100) return { year, month: 1 };
  }

  return null;
}

function formatYearLabel(raw: string | undefined | null, fallbackAtual = false): string {
  const s = String(raw || "").trim();
  if (!s || ATUAL_RE.test(s)) return fallbackAtual ? "Atual" : "";
  const parsed = parseCareerDate(s);
  if (parsed) return String(parsed.year);
  // Último recurso: primeiros 4 dígitos
  const m = s.match(/\d{4}/);
  return m ? m[0] : s;
}

function isEndAtual(dataFim: string | undefined | null): boolean {
  const s = String(dataFim || "").trim();
  return !s || ATUAL_RE.test(s);
}

function sortKeyFromDate(raw: string | undefined | null): number {
  const parsed = parseCareerDate(raw);
  if (!parsed) return 0;
  return parsed.year * 100 + parsed.month;
}

export function formatCareerPeriodo(dataInicio?: string, dataFim?: string): string {
  const inicio = formatYearLabel(dataInicio);
  if (!inicio) return isEndAtual(dataFim) ? "Atual" : formatYearLabel(dataFim) || "—";
  const fim = isEndAtual(dataFim) ? "Atual" : formatYearLabel(dataFim);
  if (!fim) return inicio;
  if (inicio === fim) return inicio;
  return `${inicio}–${fim}`;
}

function hasMeaningfulExperience(e: CareerTimelineInput): boolean {
  return Boolean(String(e.nome || "").trim() || String(e.cargo || "").trim());
}

/** Ordena do mais antigo ao mais recente e monta rótulos da linha do tempo. */
export function buildCareerTimeline(experiencias: CareerTimelineInput[] | null | undefined): CareerTimelineItem[] {
  if (!Array.isArray(experiencias) || experiencias.length === 0) return [];

  const items: CareerTimelineItem[] = experiencias
    .filter(hasMeaningfulExperience)
    .map((e) => {
      const cargo = String(e.cargo || "").trim() || "Cargo não informado";
      const empresa = String(e.nome || "").trim() || "Empresa não informada";
      const periodo = formatCareerPeriodo(e.dataInicio, e.dataFim);
      const segmento = String(e.segmento || "").trim() || undefined;
      const descricao = String(e.descricao || "").trim() || undefined;
      const label = `${periodo} → ${cargo} – ${empresa}`;
      return {
        periodo,
        cargo,
        empresa,
        segmento,
        descricao,
        sortKey: sortKeyFromDate(e.dataInicio) || sortKeyFromDate(e.dataFim),
        label,
      };
    });

  items.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    return a.label.localeCompare(b.label, "pt-BR");
  });

  return items;
}

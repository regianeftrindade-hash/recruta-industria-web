import { parseJsonSafe } from '@/lib/professional-profile-map';
import {
  parseCursosDetalhados,
  parseCertificacoesDetalhadas,
  collectSegmentosIndustria,
  opcaoSelectCompativel,
  type CursoDetalhado,
} from '@/lib/professional-form-config';

export type IndustrialFilters = {
  estado?: string;
  cidade?: string;
  area?: string;
  cargo?: string;
  escolaridade?: string;
  situacaoProfissional?: string;
  nivelOperacional?: string;
  areaNivel?: string;
  turno?: string;
  disponibilidadeInicio?: string;
  pretensaoSalarial?: string;
  trabalhouIndustria?: string;
  experiencia?: string;
  segmentoIndustria?: string;
  maquinaEquipamento?: string;
  qualidadeProcesso?: string;
  informatica?: string;
  possuiCNH?: string;
  categoriaCNH?: string;
  aceitaViagens?: string;
  disponibilidadeMudanca?: string;
  cursoCertificacao?: string;
  areaCurso?: string;
  idioma?: string;
  /** Legado — mantido para alertas antigos; não exibido no cadastro atual. */
  recolocacao?: string;
};

export type ProfileIndustrialData = {
  segmentosIndustria: string[];
  maquinasEquipamentos: string[];
  qualidadeProcessos: string[];
  informatica: string[];
  certificacoes: string[];
  idiomas: string[];
  cursos: string[];
  possuiCNH: string;
  categoriaCNH: string;
  aceitaViagens: string;
  disponibilidadeMudanca: string;
  disponivelContratacao: string;
  empresas: { nome: string; cargo: string; segmento?: string; dataInicio?: string; dataFim?: string; descricao?: string }[];
  certificadosUrl: string | null;
  cursosDetalhados: CursoDetalhado[];
};

type ProfileLike = {
  formDataJSON?: string | null;
  cursosCertificacoes?: string | null;
  experienciasJSON?: string | null;
  disponibilidadeMudanca?: string | null;
  disponibilidadeInicio?: string | null;
  disponivelContratacao?: string | null;
  cargoDesejado?: string | null;
  title?: string | null;
  areaInteresse?: string | null;
  situacaoProfissional?: string | null;
  trabalhouIndustria?: string | null;
  tempoExperiencia?: string | null;
  turnoDisponivel?: string | null;
  recolocacao?: string | null;
  pretensaoSalarial?: string | null;
  escolaridade?: string | null;
  estado?: string | null;
  cidade?: string | null;
  skills?: string | null;
  profileCompletion?: number;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string' && v.trim()).map((v) => v.trim());
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getFormField(profile: ProfileLike, key: string): string {
  if (!profile.formDataJSON) return '';
  const form = parseJsonSafe<Record<string, unknown>>(profile.formDataJSON, {});
  return normalizeText(form[key]);
}

export function parseProfileIndustrial(profile: ProfileLike): ProfileIndustrialData {
  const form = profile.formDataJSON
    ? parseJsonSafe<Record<string, unknown>>(profile.formDataJSON, {})
    : {};

  const cursosDetalhados = parseCursosDetalhados(
    form.cursosDetalhados ?? form.cursos ?? profile.cursosCertificacoes,
  );
  const cursosFromForm = asStringArray(form.cursos);
  const cursosFromProfile = cursosDetalhados.length > 0
    ? cursosDetalhados.map((c) => c.nome)
    : parseJsonSafe<string[]>(profile.cursosCertificacoes, []);
  const empresasFromForm = Array.isArray(form.empresas)
    ? (form.empresas as { nome?: string; cargo?: string; segmento?: string; dataInicio?: string; dataFim?: string; descricao?: string }[])
        .filter((e) => e && (e.nome || e.cargo))
        .map((e) => ({
          nome: e.nome || '',
          cargo: e.cargo || '',
          segmento: e.segmento || '',
          dataInicio: e.dataInicio || '',
          dataFim: e.dataFim || '',
          descricao: e.descricao || '',
        }))
    : [];
  const empresasFromProfile = parseJsonSafe<{ nome: string; cargo: string; segmento?: string; dataInicio?: string; dataFim?: string; descricao?: string }[]>(
    profile.experienciasJSON,
    [],
  );
  const empresas = empresasFromForm.length ? empresasFromForm : empresasFromProfile;

  return {
    segmentosIndustria: collectSegmentosIndustria(empresas, asStringArray(form.segmentosIndustria)),
    maquinasEquipamentos: asStringArray(form.maquinasEquipamentos),
    qualidadeProcessos: asStringArray(form.qualidadeProcessos),
    informatica: asStringArray(form.informatica),
    certificacoes: parseCertificacoesDetalhadas(form.certificacoesDetalhadas ?? form.certificacoes).map((c) => c.nome),
    idiomas: asStringArray(form.idiomas),
    cursos: cursosFromForm.length ? cursosFromForm : cursosFromProfile,
    possuiCNH: normalizeText(form.possuiCNH),
    categoriaCNH: normalizeText(form.categoriaCNH),
    aceitaViagens: normalizeText(form.aceitaViagens),
    disponibilidadeMudanca: normalizeText(form.disponibilidadeMudanca) || normalizeText(profile.disponibilidadeMudanca),
    disponivelContratacao:
      normalizeText(form.disponivelContratacao)
      || normalizeText(profile.disponivelContratacao)
      || normalizeText(profile.disponibilidadeInicio),
    empresas,
    certificadosUrl: normalizeText(form.certificados) || null,
    cursosDetalhados,
  };
}

function containsIgnoreCase(haystack: string | null | undefined, needle: string): boolean {
  if (!needle.trim()) return true;
  return (haystack || '').toLowerCase().includes(needle.toLowerCase());
}

function arrayContainsIgnoreCase(items: string[], needle: string): boolean {
  if (!needle.trim()) return true;
  const n = needle.toLowerCase();
  return items.some((item) => item.toLowerCase().includes(n));
}

function salaryMatches(profileSalary: string | null | undefined, filter: string): boolean {
  if (!filter.trim()) return true;
  const digits = filter.replace(/\D/g, '');
  const profileDigits = (profileSalary || '').replace(/\D/g, '');
  if (digits && profileDigits.includes(digits)) return true;
  return containsIgnoreCase(profileSalary, filter);
}

export function matchesIndustrialFilters(
  profile: ProfileLike,
  industrial: ProfileIndustrialData,
  filters: IndustrialFilters,
): boolean {
  if (filters.estado && profile.estado !== filters.estado) return false;
  if (filters.cidade && !containsIgnoreCase(profile.cidade, filters.cidade)) return false;
  if (filters.area && profile.areaInteresse !== filters.area) return false;
  if (filters.cargo) {
    const cargoMatch =
      containsIgnoreCase(profile.cargoDesejado, filters.cargo)
      || containsIgnoreCase(profile.title, filters.cargo)
      || industrial.empresas.some((e) => containsIgnoreCase(e.cargo, filters.cargo!));
    if (!cargoMatch) return false;
  }
  if (filters.escolaridade && profile.escolaridade !== filters.escolaridade) return false;
  if (filters.situacaoProfissional && profile.situacaoProfissional !== filters.situacaoProfissional) return false;
  if (filters.nivelOperacional && getFormField(profile, 'nivelOperacional') !== filters.nivelOperacional) return false;
  if (filters.areaNivel && getFormField(profile, 'areaNivel') !== filters.areaNivel) return false;
  if (filters.turno && profile.turnoDisponivel !== filters.turno) return false;
  if (filters.recolocacao && !containsIgnoreCase(profile.recolocacao, filters.recolocacao)) return false;
  if (filters.trabalhouIndustria) {
    const valor = profile.trabalhouIndustria || getFormField(profile, 'trabalhouIndustria');
    if (valor !== filters.trabalhouIndustria) return false;
  }
  if (filters.experiencia && profile.tempoExperiencia !== filters.experiencia) return false;
  if (filters.pretensaoSalarial && !salaryMatches(profile.pretensaoSalarial, filters.pretensaoSalarial)) return false;
  if (filters.segmentoIndustria && !arrayContainsIgnoreCase(industrial.segmentosIndustria, filters.segmentoIndustria)) return false;
  if (filters.maquinaEquipamento && !arrayContainsIgnoreCase(industrial.maquinasEquipamentos, filters.maquinaEquipamento)) return false;
  if (filters.qualidadeProcesso && !arrayContainsIgnoreCase(industrial.qualidadeProcessos, filters.qualidadeProcesso)) return false;
  if (filters.informatica && !arrayContainsIgnoreCase(industrial.informatica, filters.informatica)) return false;
  if (filters.possuiCNH && !opcaoSelectCompativel(industrial.possuiCNH, filters.possuiCNH)) return false;
  if (filters.categoriaCNH && industrial.categoriaCNH !== filters.categoriaCNH) return false;
  if (filters.aceitaViagens && !opcaoSelectCompativel(industrial.aceitaViagens, filters.aceitaViagens)) return false;
  if (filters.disponibilidadeMudanca && !opcaoSelectCompativel(industrial.disponibilidadeMudanca, filters.disponibilidadeMudanca)) return false;
  if (filters.cursoCertificacao) {
    const term = filters.cursoCertificacao.toLowerCase();
    const found =
      industrial.cursos.some((c) => c.toLowerCase().includes(term))
      || industrial.certificacoes.some((c) => c.toLowerCase().includes(term));
    if (!found) return false;
  }
  if (filters.disponibilidadeInicio) {
    const alvo = filters.disponibilidadeInicio.toLowerCase();
    const perfil = industrial.disponivelContratacao.toLowerCase();
    if (!perfil.includes(alvo)) return false;
  }
  if (filters.areaCurso) {
    const alvo = filters.areaCurso.toLowerCase();
    const encontrou = industrial.cursosDetalhados.some(
      (c) => (c.areaCurso || '').toLowerCase() === alvo,
    );
    if (!encontrou) return false;
  }
  if (filters.idioma && !arrayContainsIgnoreCase(industrial.idiomas, filters.idioma)) return false;
  return true;
}

const COMPAT_WEIGHTS: { key: keyof IndustrialFilters; weight: number; check: (p: ProfileLike, i: ProfileIndustrialData, f: string) => boolean }[] = [
  { key: 'cargo', weight: 12, check: (p, i, f) => containsIgnoreCase(p.cargoDesejado, f) || containsIgnoreCase(p.title, f) || i.empresas.some((e) => containsIgnoreCase(e.cargo, f)) },
  { key: 'area', weight: 10, check: (p, _i, f) => p.areaInteresse === f },
  { key: 'nivelOperacional', weight: 8, check: (p, _i, f) => getFormField(p, 'nivelOperacional') === f },
  { key: 'areaNivel', weight: 8, check: (p, _i, f) => getFormField(p, 'areaNivel') === f },
  { key: 'situacaoProfissional', weight: 8, check: (p, _i, f) => p.situacaoProfissional === f },
  { key: 'trabalhouIndustria', weight: 8, check: (p, _i, f) => (p.trabalhouIndustria || getFormField(p, 'trabalhouIndustria')) === f },
  { key: 'experiencia', weight: 10, check: (p, _i, f) => p.tempoExperiencia === f },
  { key: 'segmentoIndustria', weight: 10, check: (_p, i, f) => arrayContainsIgnoreCase(i.segmentosIndustria, f) },
  { key: 'maquinaEquipamento', weight: 10, check: (_p, i, f) => arrayContainsIgnoreCase(i.maquinasEquipamentos, f) },
  { key: 'qualidadeProcesso', weight: 8, check: (_p, i, f) => arrayContainsIgnoreCase(i.qualidadeProcessos, f) },
  { key: 'informatica', weight: 6, check: (_p, i, f) => arrayContainsIgnoreCase(i.informatica, f) },
  { key: 'turno', weight: 8, check: (p, _i, f) => p.turnoDisponivel === f },
  { key: 'estado', weight: 6, check: (p, _i, f) => p.estado === f },
  { key: 'cidade', weight: 4, check: (p, _i, f) => containsIgnoreCase(p.cidade, f) },
  { key: 'disponibilidadeMudanca', weight: 6, check: (_p, i, f) => opcaoSelectCompativel(i.disponibilidadeMudanca, f) },
  { key: 'pretensaoSalarial', weight: 8, check: (p, _i, f) => salaryMatches(p.pretensaoSalarial, f) },
  { key: 'escolaridade', weight: 6, check: (p, _i, f) => p.escolaridade === f },
  { key: 'possuiCNH', weight: 4, check: (_p, i, f) => opcaoSelectCompativel(i.possuiCNH, f) },
  { key: 'categoriaCNH', weight: 4, check: (_p, i, f) => i.categoriaCNH === f },
  { key: 'aceitaViagens', weight: 4, check: (_p, i, f) => opcaoSelectCompativel(i.aceitaViagens, f) },
  { key: 'idioma', weight: 4, check: (_p, i, f) => arrayContainsIgnoreCase(i.idiomas, f) },
  { key: 'cursoCertificacao', weight: 6, check: (_p, i, f) => {
    const term = f.toLowerCase();
    return i.cursos.some((c) => c.toLowerCase().includes(term)) || i.certificacoes.some((c) => c.toLowerCase().includes(term));
  }},
  { key: 'disponibilidadeInicio', weight: 8, check: (_p, i, f) => i.disponivelContratacao.toLowerCase().includes(f.toLowerCase()) },
  { key: 'areaCurso', weight: 6, check: (_p, i, f) => i.cursosDetalhados.some((c) => (c.areaCurso || '').toLowerCase() === f.toLowerCase()) },
];

export function calculateCompatibilityScore(
  profile: ProfileLike,
  industrial: ProfileIndustrialData,
  filters: IndustrialFilters,
): number {
  const activeFilters = COMPAT_WEIGHTS.filter((w) => filters[w.key]?.trim());
  if (activeFilters.length === 0) {
    return Math.min(100, Math.max(0, profile.profileCompletion ?? 0));
  }

  let score = 0;
  let maxScore = 0;
  for (const rule of activeFilters) {
    const filterVal = filters[rule.key]!;
    maxScore += rule.weight;
    if (rule.check(profile, industrial, filterVal)) score += rule.weight;
  }

  const ratio = maxScore > 0 ? score / maxScore : 0;
  const completionBonus = Math.min(15, (profile.profileCompletion ?? 0) * 0.15);
  return Math.min(100, Math.round(ratio * 85 + completionBonus));
}

export const INDUSTRIAL_FILTER_KEYS = [
  'estado', 'cidade', 'area', 'cargo', 'escolaridade',
  'situacaoProfissional', 'nivelOperacional', 'areaNivel', 'turno',
  'disponibilidadeInicio', 'pretensaoSalarial', 'trabalhouIndustria', 'experiencia',
  'segmentoIndustria', 'maquinaEquipamento', 'qualidadeProcesso', 'informatica',
  'possuiCNH', 'categoriaCNH', 'aceitaViagens', 'disponibilidadeMudanca',
  'cursoCertificacao', 'areaCurso', 'idioma', 'recolocacao',
] as const;

export function parseIndustrialFiltersFromParams(searchParams: URLSearchParams): IndustrialFilters {
  const filters: IndustrialFilters = {};
  for (const key of INDUSTRIAL_FILTER_KEYS) {
    const val = searchParams.get(key);
    if (val?.trim()) filters[key] = val.trim();
  }
  return filters;
}

/** Remove chaves vazias — evita alerta “sem preferência” parecer ter filtros. */
export function sanitizeIndustrialFilters(
  input: Partial<Record<string, unknown>> | IndustrialFilters | null | undefined,
): IndustrialFilters {
  const filters: IndustrialFilters = {};
  if (!input || typeof input !== 'object') return filters;
  for (const key of INDUSTRIAL_FILTER_KEYS) {
    const raw = input[key];
    if (typeof raw === 'string' && raw.trim()) filters[key] = raw.trim();
  }
  return filters;
}

export function hasActiveIndustrialFilters(filters: IndustrialFilters): boolean {
  return INDUSTRIAL_FILTER_KEYS.some((key) => Boolean(filters[key]?.trim()));
}

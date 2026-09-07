export type ProfileCompletionInput = {
  nome?: string;
  dataNascimento?: string;
  dataNascimentoDisplay?: string;
  email?: string;
  telefone?: string;
  telefone2?: string;
  whatsapp?: string;
  estado?: string;
  cidade?: string;
  escolaridade?: string;
  cursoFormacao?: string;
  instituicaoFormacao?: string;
  anoConclusaoFormacao?: string;
  situacaoProfissional?: string;
  areaInteresse?: string;
  cargoDesejado?: string;
  nivelOperacional?: string;
  areaNivel?: string;
  detalheNivel?: string;
  trabalhouIndustria?: string;
  disponivelContratacao?: string;
  cursos?: string[];
  certificacoes?: string[];
  idiomas?: string[];
  turnoDisponivel?: string;
  disponibilidadeInicio?: string;
  tempoExperiencia?: string;
  pretensaoSalarial?: string;
  segmentosIndustria?: string[];
  mensagemEmpresas?: string;
  curriculo?: string | null;
  fotoPerfil?: string | null;
  sexoBiologico?: string;
  identidadeGenero?: string;
  orientacaoSexual?: string;
  estadoCivil?: string;
  religiao?: string;
  antecedentes?: string;
  possuiFilhos?: string;
  disponibilidadeMudanca?: string;
  aceitaViagens?: string;
  maquinasEquipamentos?: string[];
  qualidadeProcessos?: string[];
  informatica?: string[];
  possuiCNH?: string;
  categoriaCNH?: string;
  certificados?: string | null;
  cnhDocumento?: string | null;
  atestado?: string | null;
  empresas?: { nome: string; cargo: string }[];
};

function filled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((v) => typeof v === 'string' && v.trim());
  return true;
}

function phoneFilled(...values: (string | undefined)[]): boolean {
  return values.some((v) => (v || '').replace(/\D/g, '').length >= 10);
}

function anyCheckbox(values?: string[]): boolean {
  return Array.isArray(values) && values.length > 0;
}

function anyEmpresa(empresas?: { nome: string; cargo: string }[]): boolean {
  return Array.isArray(empresas) && empresas.some((e) => e.nome.trim() || e.cargo.trim());
}

/** Calcula completude 0–100 com pesos: obrigatório 50, recomendado 30, opcional 20 */
export function calculateProfileCompletion(data: ProfileCompletionInput): number {
  let score = 0;

  const requiredChecks: [boolean, number][] = [
    [filled(data.nome), 4],
    [filled(data.dataNascimento) || filled(data.dataNascimentoDisplay), 4],
    [filled(data.email), 4],
    [phoneFilled(data.telefone, data.telefone2), 5],
    [filled(data.estado), 4],
    [filled(data.cidade), 4],
    [filled(data.escolaridade), 5],
    [filled(data.situacaoProfissional), 5],
    [filled(data.areaInteresse), 5],
    [filled(data.cargoDesejado), 5],
    [filled(data.nivelOperacional), 5],
    [filled(data.trabalhouIndustria), 5],
    [filled(data.disponibilidadeInicio), 5],
  ];
  requiredChecks.forEach(([ok, pts]) => { if (ok) score += pts; });

  const recommendedChecks: [boolean, number][] = [
    [Array.isArray(data.cursos) && data.cursos.some((c) => c.trim()), 4],
    [Array.isArray(data.certificacoes) && data.certificacoes.some((c) => c.trim()), 3],
    [Array.isArray(data.idiomas) && data.idiomas.some((i) => i.trim()), 3],
    [filled(data.turnoDisponivel), 3],
    [filled(data.tempoExperiencia), 3],
    [filled(data.pretensaoSalarial), 3],
    [filled(data.mensagemEmpresas), 2],
    [filled(data.curriculo), 2],
  ];
  recommendedChecks.forEach(([ok, pts]) => { if (ok) score += pts; });

  const optionalChecks: [boolean, number][] = [
    [filled(data.fotoPerfil), 2],
    [[data.sexoBiologico, data.identidadeGenero, data.orientacaoSexual, data.estadoCivil, data.religiao, data.antecedentes].some(filled), 2],
    [filled(data.possuiFilhos), 1],
    [filled(data.disponibilidadeMudanca), 1],
    [filled(data.aceitaViagens), 1],
    [anyCheckbox(data.maquinasEquipamentos), 3],
    [anyCheckbox(data.qualidadeProcessos), 3],
    [anyCheckbox(data.informatica), 3],
    [filled(data.possuiCNH), 1],
    [filled(data.certificados), 1],
    [filled(data.cnhDocumento), 1],
    [filled(data.atestado), 1],
    [anyEmpresa(data.empresas), 3],
  ];
  optionalChecks.forEach(([ok, pts]) => { if (ok) score += pts; });

  return Math.min(100, Math.max(0, score));
}

export function getCompletionMilestone(percent: number): 30 | 60 | 80 | 100 {
  if (percent >= 100) return 100;
  if (percent >= 80) return 80;
  if (percent >= 60) return 60;
  return 30;
}

export function getCompletionLabel(percent: number): string {
  if (percent >= 100) return '100% Completo';
  if (percent >= 80) return '80% Completo';
  if (percent >= 60) return '60% Completo';
  if (percent >= 30) return '30% Completo';
  return `${percent}% Completo`;
}

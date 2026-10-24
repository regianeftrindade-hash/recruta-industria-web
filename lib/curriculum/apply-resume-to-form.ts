import type { ResumeStructuredFields } from '@/lib/curriculum/types';
import { SEGMENTOS_INDUSTRIA, type CursoDetalhado } from '@/lib/professional-form-config';

export type ResumeFormEmpresa = {
  nome: string;
  cargo: string;
  segmento: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
};

export type ResumeFormApplyPatch = {
  formDataPatch: Record<string, unknown>;
  telefone?: string;
  telefone2?: string;
  dataNascimentoDisplay?: string;
  cursos?: CursoDetalhado[];
  empresas?: ResumeFormEmpresa[];
  filledLabels: string[];
  /** Campos do currículo que não foram aplicados porque o usuário já tinha digitado. */
  preservados: string[];
  /** Cidade bruta do currículo — casar com IBGE depois de carregar o estado. */
  cidadePendente?: string | null;
};

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function matchCidadeIbge(cidadeCurriculo: string, municipios: string[]): string | null {
  const needle = stripAccents(cidadeCurriculo.trim().toLowerCase());
  if (!needle || !municipios.length) return null;

  const exact = municipios.find((m) => stripAccents(m.toLowerCase()) === needle);
  if (exact) return exact;

  const starts = municipios.find((m) => stripAccents(m.toLowerCase()).startsWith(needle));
  if (starts) return starts;

  // "Sao Jose" → "São José dos Pinhais"
  const partial = municipios.find((m) => {
    const n = stripAccents(m.toLowerCase());
    return n.includes(needle) || needle.includes(n);
  });
  if (partial) return partial;

  // Primeiras palavras: "Sao Jose dos Pinhais - PR" já limpo
  const firstWords = needle.split(/\s+/).slice(0, 3).join(' ');
  if (firstWords.length >= 4) {
    const byPrefix = municipios.find((m) => stripAccents(m.toLowerCase()).startsWith(firstWords));
    if (byPrefix) return byPrefix;
  }

  return null;
}

function letras(value: string): string {
  return stripAccents(value.trim().toLowerCase()).replace(/[^a-z]/g, '');
}

function matchSegmento(value: string): string {
  const needle = letras(value);
  if (needle.length < 6) return '';
  const stem = needle.slice(0, 8);
  return SEGMENTOS_INDUSTRIA.find((item) => {
    const option = letras(item);
    return option === needle
      || option.startsWith(needle)
      || needle.startsWith(option)
      || option.startsWith(stem);
  }) || '';
}

function parsePeriodoToDates(periodo?: string | null): { dataInicio: string; dataFim: string } {
  if (!periodo) return { dataInicio: '', dataFim: '' };
  const m = periodo.match(
    /(\d{2}\/(?:19|20)\d{2}|(?:19|20)\d{2})\s*[-–—aà]+\s*(\d{2}\/(?:19|20)\d{2}|(?:19|20)\d{2}|atual|presente|hoje)/i,
  );
  if (!m) return { dataInicio: '', dataFim: '' };
  const toInput = (v: string) => {
    if (/atual|presente|hoje/i.test(v)) return '';
    if (/^\d{4}$/.test(v)) return `${v}-01`;
    const [mm, yyyy] = v.split('/');
    return `${yyyy}-${mm}`;
  };
  return { dataInicio: toInput(m[1]), dataFim: toInput(m[2]) };
}

/**
 * Converte structured (padrões) em patch do formulário de cadastro.
 */
export function buildResumeFormApplyPatch(
  structured: ResumeStructuredFields | null | undefined,
  current: {
    formData: Record<string, unknown>;
    telefone: string;
    telefone2: string;
    empresas?: Array<{ nome?: string; cargo?: string }>;
    cursos?: Array<{ nome?: string }>;
  },
  options?: { overwrite?: boolean },
): ResumeFormApplyPatch {
  const overwrite = Boolean(options?.overwrite);
  const livre = (key: string, value: unknown) => {
    if (overwrite) return true;
    if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return true;
    if ((key === 'whatsapp' || key === 'trabalhouIndustria' || key === 'possuiFilhos') && value === 'Não') {
      return true;
    }
    return false;
  };

  const canSet = (key: string) => livre(key, current.formData[key]);
  const patch: Record<string, unknown> = {};
  const filledLabels: string[] = [];
  const preservados: string[] = [];
  const guardar = (label: string, aplicar: () => void, ocupado: boolean) => {
    if (ocupado) preservados.push(label);
    else {
      aplicar();
      filledLabels.push(label);
    }
  };

  if (!structured) {
    return { formDataPatch: patch, filledLabels, preservados };
  }

  if (structured.nome) {
    guardar('Nome', () => { patch.nome = structured.nome; }, !canSet('nome'));
  }

  let dataNascimentoDisplay: string | undefined;
  if (structured.dataNascimentoDisplay && structured.dataNascimento) {
    guardar('Nascimento', () => {
      patch.dataNascimento = structured.dataNascimento;
      dataNascimentoDisplay = structured.dataNascimentoDisplay || undefined;
    }, !canSet('dataNascimento'));
  }

  if (structured.idade && !filledLabels.includes('Idade')) {
    guardar('Idade', () => { patch.idade = structured.idade; }, !canSet('idade'));
  }

  if (structured.contato?.email) {
    guardar('E-mail', () => { patch.email = structured.contato?.email; }, !canSet('email'));
  }

  let telefone: string | undefined;
  let telefone2: string | undefined;
  if (structured.contato?.telefone) {
    const ocupado = !overwrite && Boolean(current.telefone.trim());
    guardar('Telefone', () => {
      telefone = structured.contato?.telefone || undefined;
      patch.telefone = structured.contato?.telefone;
    }, ocupado);
  }
  if (structured.contato?.telefone2) {
    const ocupado = !overwrite && Boolean(current.telefone2.trim());
    guardar('Telefone 2', () => {
      telefone2 = structured.contato?.telefone2 || undefined;
      patch.telefone2 = structured.contato?.telefone2;
    }, ocupado);
  }

  if (structured.contato?.whatsapp) {
    guardar('WhatsApp', () => {
      patch.whatsapp = structured.contato?.whatsapp === 'Não' ? 'Não' : 'Sim';
    }, !canSet('whatsapp'));
  }

  if (structured.estado) {
    guardar('Estado', () => { patch.estado = structured.estado; }, !canSet('estado'));
  }

  let cidadePendente: string | null = null;
  if (structured.cidade) {
    guardar('Cidade', () => { cidadePendente = structured.cidade || null; }, !canSet('cidade'));
  }

  if (structured.escolaridade) {
    guardar('Escolaridade', () => { patch.escolaridade = structured.escolaridade; }, !canSet('escolaridade'));
  }
  if (structured.cursoFormacao) {
    guardar('Curso de formação', () => { patch.cursoFormacao = structured.cursoFormacao; }, !canSet('cursoFormacao'));
  }
  if (structured.instituicaoFormacao) {
    guardar('Instituição', () => { patch.instituicaoFormacao = structured.instituicaoFormacao; }, !canSet('instituicaoFormacao'));
  }
  if (structured.anoConclusaoFormacao) {
    guardar('Ano de conclusão', () => { patch.anoConclusaoFormacao = structured.anoConclusaoFormacao; }, !canSet('anoConclusaoFormacao'));
  }
  if (structured.conteudoFormacao) {
    guardar('Conteúdo da formação', () => { patch.conteudoFormacao = structured.conteudoFormacao; }, !canSet('conteudoFormacao'));
  }

  if (structured.cnh) {
    if (canSet('possuiCNH')) patch.possuiCNH = 'Sim';
    guardar(`CNH ${structured.cnh}`, () => { patch.categoriaCNH = structured.cnh; }, !canSet('categoriaCNH'));
  }

  if (structured.maquinasEquipamentos?.length) {
    guardar('Máquinas/equipamentos', () => {
      patch.maquinasEquipamentos = structured.maquinasEquipamentos;
    }, !canSet('maquinasEquipamentos'));
  }
  if (structured.qualidadeProcessos?.length) {
    guardar('Qualidade/processos', () => {
      patch.qualidadeProcessos = structured.qualidadeProcessos;
    }, !canSet('qualidadeProcessos'));
  }
  if (structured.informatica?.length) {
    guardar('Informática', () => { patch.informatica = structured.informatica; }, !canSet('informatica'));
  }

  let cursos: CursoDetalhado[] | undefined;
  if (structured.cursos?.length) {
    const cursosOcupados = !overwrite && (current.cursos || []).some((item) => String(item.nome || '').trim());
    guardar('Cursos', () => {
      cursos = structured.cursos?.map((nome) => ({ nome, possuiCertificado: false }));
    }, cursosOcupados);
  }

  let empresas: ResumeFormEmpresa[] | undefined;
  if (structured.experiencias?.length) {
    const experienciasOcupadas = !overwrite && (current.empresas || []).some(
      (item) => String(item.nome || '').trim() || String(item.cargo || '').trim(),
    );
    guardar('Experiências', () => {
      empresas = structured.experiencias?.map((exp) => {
        const dates = parsePeriodoToDates(exp.periodo);
        return {
          nome: exp.empresa || '',
          cargo: exp.cargo || '',
          segmento: matchSegmento(exp.segmento || ''),
          dataInicio: exp.dataInicio || dates.dataInicio,
          dataFim: exp.dataFim != null ? exp.dataFim : dates.dataFim,
          descricao: exp.descricao || '',
        };
      });
      if (canSet('trabalhouIndustria')) patch.trabalhouIndustria = 'Sim';
    }, experienciasOcupadas);
  }

  return {
    formDataPatch: patch,
    telefone,
    telefone2,
    dataNascimentoDisplay,
    cursos,
    empresas,
    filledLabels,
    preservados,
    cidadePendente,
  };
}

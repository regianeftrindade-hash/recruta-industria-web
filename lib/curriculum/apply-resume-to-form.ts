import type { ResumeStructuredFields } from '@/lib/curriculum/types';
import type { CursoDetalhado } from '@/lib/professional-form-config';

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

  const includes = municipios.find((m) => {
    const n = stripAccents(m.toLowerCase());
    return n.includes(needle) || needle.includes(n);
  });
  return includes || null;
}

function parsePeriodoToDates(periodo?: string | null): { dataInicio: string; dataFim: string } {
  if (!periodo) return { dataInicio: '', dataFim: '' };
  const m = periodo.match(
    /(\d{2}\/\d{4}|\d{4})\s*[-–—aà]+\s*(\d{2}\/\d{4}|\d{4}|atual|presente|hoje)/i,
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
  },
  options?: { overwrite?: boolean },
): ResumeFormApplyPatch {
  const overwrite = Boolean(options?.overwrite);
  const empty = (v: unknown) =>
    v == null || v === '' || (Array.isArray(v) && v.length === 0);

  const canSet = (key: string) => overwrite || empty(current.formData[key]);
  const patch: Record<string, unknown> = {};
  const filledLabels: string[] = [];

  if (!structured) {
    return { formDataPatch: patch, filledLabels };
  }

  if (structured.nome && canSet('nome')) {
    patch.nome = structured.nome;
    filledLabels.push('Nome');
  }

  let dataNascimentoDisplay: string | undefined;
  if (structured.dataNascimentoDisplay && structured.dataNascimento) {
    if (overwrite || empty(current.formData.dataNascimento)) {
      patch.dataNascimento = structured.dataNascimento;
      if (structured.idade) patch.idade = structured.idade;
      dataNascimentoDisplay = structured.dataNascimentoDisplay;
      filledLabels.push('Nascimento');
    }
  }

  if (structured.contato?.email && canSet('email')) {
    patch.email = structured.contato.email;
    filledLabels.push('E-mail');
  }

  let telefone: string | undefined;
  let telefone2: string | undefined;
  if (structured.contato?.telefone && (overwrite || !current.telefone.trim())) {
    telefone = structured.contato.telefone;
    patch.telefone = structured.contato.telefone;
    filledLabels.push('Telefone');
  }
  if (structured.contato?.telefone2 && (overwrite || !current.telefone2.trim())) {
    telefone2 = structured.contato.telefone2;
    patch.telefone2 = structured.contato.telefone2;
    filledLabels.push('Telefone 2');
  }

  if (structured.contato?.whatsapp && canSet('whatsapp')) {
    patch.whatsapp = structured.contato.whatsapp === 'Não' ? 'Não' : 'Sim';
    filledLabels.push('WhatsApp');
  }

  if (structured.estado && canSet('estado')) {
    patch.estado = structured.estado;
    filledLabels.push('Estado');
  }

  // Cidade: aplica depois do match IBGE (cidadePendente)
  const cidadePendente = structured.cidade || null;
  if (cidadePendente) filledLabels.push('Cidade');

  if (structured.escolaridade && canSet('escolaridade')) {
    patch.escolaridade = structured.escolaridade;
    filledLabels.push('Escolaridade');
  }
  if (structured.cursoFormacao && canSet('cursoFormacao')) {
    patch.cursoFormacao = structured.cursoFormacao;
    filledLabels.push('Curso de formação');
  }
  if (structured.instituicaoFormacao && canSet('instituicaoFormacao')) {
    patch.instituicaoFormacao = structured.instituicaoFormacao;
    filledLabels.push('Instituição');
  }
  if (structured.anoConclusaoFormacao && canSet('anoConclusaoFormacao')) {
    patch.anoConclusaoFormacao = structured.anoConclusaoFormacao;
    filledLabels.push('Ano de conclusão');
  }

  if (structured.cnh) {
    if (canSet('possuiCNH')) patch.possuiCNH = 'Sim';
    if (canSet('categoriaCNH')) {
      patch.categoriaCNH = structured.cnh;
      filledLabels.push(`CNH ${structured.cnh}`);
    }
  }

  if (structured.maquinasEquipamentos?.length && canSet('maquinasEquipamentos')) {
    patch.maquinasEquipamentos = structured.maquinasEquipamentos;
    filledLabels.push('Máquinas/equipamentos');
  }
  if (structured.qualidadeProcessos?.length && canSet('qualidadeProcessos')) {
    patch.qualidadeProcessos = structured.qualidadeProcessos;
    filledLabels.push('Qualidade/processos');
  }
  if (structured.informatica?.length && canSet('informatica')) {
    patch.informatica = structured.informatica;
    filledLabels.push('Informática');
  }

  let cursos: CursoDetalhado[] | undefined;
  if (structured.cursos?.length) {
    cursos = structured.cursos.map((nome) => ({
      nome,
      possuiCertificado: false,
    }));
    filledLabels.push('Cursos');
  }

  let empresas: ResumeFormEmpresa[] | undefined;
  if (structured.experiencias?.length) {
    empresas = structured.experiencias.map((exp) => {
      const dates = parsePeriodoToDates(exp.periodo);
      return {
        nome: exp.empresa || '',
        cargo: exp.cargo || '',
        segmento: '',
        dataInicio: exp.dataInicio || dates.dataInicio,
        dataFim: exp.dataFim || dates.dataFim,
        descricao: exp.descricao || '',
      };
    });
    patch.trabalhouIndustria = 'Sim';
    filledLabels.push('Experiências');
  }

  return {
    formDataPatch: patch,
    telefone,
    telefone2,
    dataNascimentoDisplay,
    cursos,
    empresas,
    filledLabels,
    cidadePendente,
  };
}

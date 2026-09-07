import type { Profile, User } from '@prisma/client';
import { calculateProfileCompletion } from '@/lib/profile-completion';
import {
  parseCursosDetalhados,
  parseCertificacoesDetalhadas,
  normalizeCursoDetalhado,
  buildCargoDesejado,
  collectSegmentosIndustria,
  type CursoDetalhado,
} from '@/lib/professional-form-config';

export function parseJsonSafe<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseLocation(location: string | null | undefined): { cidade: string; estado: string } {
  if (!location || location === 'Não informado' || location === 'Não preenchido') {
    return { cidade: '', estado: '' };
  }
  const parts = location.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    return {
      cidade: parts.slice(0, -1).join(', '),
      estado: parts[parts.length - 1],
    };
  }
  return { cidade: location, estado: '' };
}

function formatDateBR(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatCpfInput(value: string): string {
  const limpo = value.replace(/\D/g, '');
  if (limpo.length !== 11) return value;
  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9, 11)}`;
}

export function parseDateInput(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return true;
  if (value === false) return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (Array.isArray(value) && value.length === 1 && value[0] === '') return true;
  if (
    Array.isArray(value) &&
    value.length === 1 &&
    typeof value[0] === 'object' &&
    value[0] &&
    !(value[0] as EmpresaExperiencia).nome &&
    !(value[0] as EmpresaExperiencia).cargo
  ) {
    return true;
  }
  return false;
}

function hasRealEmpresas(empresas: EmpresaExperiencia[]): boolean {
  return empresas.some((e) => e.nome.trim() || e.cargo.trim());
}

function hasRealCursos(cursos: string[]): boolean {
  return cursos.some((c) => c.trim());
}

function boolToSimNaoOrEmpty(value: boolean | null | undefined): string {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return '';
}

function boolToSimNao(value: boolean | null | undefined): string {
  if (value === true) return 'Sim';
  if (value === false) return 'Não';
  return 'Não';
}

export function simNaoToBool(value: unknown): boolean | null {
  if (value === true || value === 'true' || value === 'Sim') return true;
  if (value === false || value === 'false' || value === 'Não') return false;
  return null;
}

export type EmpresaExperiencia = {
  nome: string;
  cargo: string;
  segmento?: string;
  dataInicio: string;
  dataFim: string;
  descricao?: string;
};

export type FormEditPayload = {
  formData: Record<string, unknown>;
  cpf: string;
  telefone: string;
  telefone2: string;
  pretensaoSalarial: string;
  dataNascimentoDisplay: string;
  cursos: string[];
  cursosDetalhados?: CursoDetalhado[];
  empresas: EmpresaExperiencia[];
};

const FORM_FIELD_KEYS = [
  'nome', 'dataNascimento', 'idade', 'sexoBiologico', 'identidadeGenero', 'orientacaoSexual',
  'estadoCivil', 'religiao', 'antecedentes', 'possuiFilhos', 'quantidadeFilhos', 'faixaEtariaFilhos',
  'email', 'telefone', 'telefone2', 'whatsapp', 'estado', 'cidade', 'disponibilidadeMudanca',
  'escolaridade', 'cursoFormacao', 'instituicaoFormacao', 'anoConclusaoFormacao', 'documentoFormacao', 'cursosCertificacoes', 'situacaoProfissional', 'areaInteresse', 'cargoDesejado',
  'nivelOperacional', 'areaNivel', 'detalheNivel',
  'turnoDisponivel', 'disponibilidadeInicio', 'trabalhouIndustria', 'tempoExperiencia',
  'experiencias', 'recolocacao', 'pretensaoSalarial', 'fotoPerfil', 'curriculo', 'atestado',
  'mensagemEmpresas', 'autorizoDados', 'declaroVerdadeiro', 'aceitoLGPD',
  'ultimoCargo', 'ultimaEmpresa', 'segmentosIndustria', 'maquinasEquipamentos',
  'qualidadeProcessos', 'informatica', 'possuiCNH', 'categoriaCNH', 'aceitaViagens',
  'disponivelContratacao', 'certificados', 'cnhDocumento', 'certificacoes', 'certificacoesDetalhadas', 'idiomas',
  'profileCompletion',
] as const;

export function storedPayloadToFormEdit(stored: Record<string, unknown>): FormEditPayload {
  const cursosDetalhados = parseCursosDetalhados(
    stored.cursosDetalhados ?? stored.cursos ?? stored.cursosCertificacoes,
  );
  const cursos = cursosDetalhados.map((c) => c.nome).filter((n) => n.trim());

  const empresas = Array.isArray(stored.empresas)
    ? normalizeExperiencias(stored.empresas)
    : normalizeExperiencias(stored.experiencias);

  const formData: Record<string, unknown> = {};
  FORM_FIELD_KEYS.forEach((key) => {
    if (key in stored && stored[key] !== undefined) {
      formData[key] = stored[key];
    }
  });

  const dataDisplay =
    typeof stored.dataNascimentoDisplay === 'string'
      ? stored.dataNascimentoDisplay
      : formatDateBR(parseDateInput(String(stored.dataNascimento || '')) || undefined);

  return {
    formData,
    cpf: formatCpfInput(String(stored.cpf || '')),
    telefone: String(stored.telefone || formData.telefone || ''),
    telefone2: String(stored.telefone2 || formData.telefone2 || ''),
    pretensaoSalarial: String(stored.pretensaoSalarial || formData.pretensaoSalarial || ''),
    dataNascimentoDisplay: dataDisplay,
    cursos: hasRealCursos(cursos) ? cursos : [''],
    cursosDetalhados,
    empresas: hasRealEmpresas(empresas)
      ? empresas
      : [{ nome: '', cargo: '', dataInicio: '', dataFim: '' }],
  };
}

export function mergeStoredOverApi(
  api: FormEditPayload,
  stored: Record<string, unknown>
): FormEditPayload {
  const fromStored = storedPayloadToFormEdit(stored);
  const mergedFormData: Record<string, unknown> = { ...fromStored.formData };

  FORM_FIELD_KEYS.forEach((key) => {
    const storedVal = mergedFormData[key];
    const apiVal = api.formData[key];
    if (isEmptyValue(storedVal) && !isEmptyValue(apiVal)) {
      mergedFormData[key] = apiVal;
    }
  });

  return {
    formData: mergedFormData,
    cpf: fromStored.cpf || formatCpfInput(api.cpf),
    telefone: fromStored.telefone || api.telefone,
    telefone2: fromStored.telefone2 || api.telefone2,
    pretensaoSalarial: fromStored.pretensaoSalarial || api.pretensaoSalarial,
    dataNascimentoDisplay: fromStored.dataNascimentoDisplay || api.dataNascimentoDisplay,
    cursos: hasRealCursos(fromStored.cursos) ? fromStored.cursos : api.cursos,
    cursosDetalhados: (fromStored.cursosDetalhados?.length ?? 0) > 0
      ? fromStored.cursosDetalhados
      : api.cursosDetalhados,
    empresas: hasRealEmpresas(fromStored.empresas) ? fromStored.empresas : api.empresas,
  };
}

export function buildFormEditForLoad(
  api: FormEditPayload | null,
  storedSources: Array<Record<string, unknown> | null>,
  preferStored = true
): FormEditPayload | null {
  let result = api;

  for (const stored of storedSources) {
    if (!stored) continue;
    if (!result) {
      result = storedPayloadToFormEdit(stored);
      continue;
    }
    result = preferStored
      ? mergeStoredOverApi(result, stored)
      : mergeFormEditWithStored(result, stored);
  }

  return result;
}

export function mergeFormEditWithStored(
  api: FormEditPayload | null,
  stored: Record<string, unknown>
): FormEditPayload {
  const fromStored = storedPayloadToFormEdit(stored);
  if (!api) return fromStored;

  const mergedFormData: Record<string, unknown> = { ...api.formData };
  FORM_FIELD_KEYS.forEach((key) => {
    const apiVal = mergedFormData[key];
    const storedVal = fromStored.formData[key];
    const apiEmpty = isEmptyValue(apiVal);
    const storedHas = !isEmptyValue(storedVal);

    if (storedHas && (apiEmpty || (apiVal === 'Não' && storedVal !== 'Não'))) {
      mergedFormData[key] = storedVal;
    }
  });

  return {
    formData: mergedFormData,
    cpf: !isEmptyValue(api.cpf) ? formatCpfInput(api.cpf) : fromStored.cpf,
    telefone: api.telefone || fromStored.telefone,
    telefone2: api.telefone2 || fromStored.telefone2,
    pretensaoSalarial: api.pretensaoSalarial || fromStored.pretensaoSalarial,
    dataNascimentoDisplay: api.dataNascimentoDisplay || fromStored.dataNascimentoDisplay,
    cursos: hasRealCursos(api.cursos) ? api.cursos : fromStored.cursos,
    cursosDetalhados: (api.cursosDetalhados?.length ?? 0) > 0
      ? api.cursosDetalhados
      : fromStored.cursosDetalhados,
    empresas: hasRealEmpresas(api.empresas) ? api.empresas : fromStored.empresas,
  };
}

export function prepareFormSnapshot(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

function parseQuantidadeFilhos(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed === '4+') return 4;
    const parsed = parseInt(trimmed.replace(/\D/g, ''), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function rebuildFormSnapshotFromProfile(profile: Profile, user: User): string {
  const edit = buildFormEditFromProfileColumns(profile, user);
  const skills = profile.skills ? parseJsonSafe<string[]>(profile.skills, []) : [];

  return prepareFormSnapshot({
    ...edit.formData,
    cpf: edit.cpf.replace(/\D/g, ''),
    telefone: edit.telefone,
    telefone2: edit.telefone2,
    pretensaoSalarial: edit.pretensaoSalarial,
    dataNascimentoDisplay: edit.dataNascimentoDisplay,
    cursos: edit.cursos.filter((c) => c.trim()),
    cursosCertificacoes: edit.cursos.filter((c) => c.trim()),
    cursosDetalhados: edit.cursosDetalhados ?? [],
    empresas: edit.empresas,
    experiencias: edit.empresas,
    certificacoes: skills,
    idiomas: [],
    profileCompletion: profile.profileCompletion ?? 0,
  });
}

export function buildProfileUpsertPayload(
  body: Record<string, unknown>,
  userEmail: string
) {
  const formDataJSON = prepareFormSnapshot(body);
  return {
    prismaData: {
      ...buildProfileUpsertData(body, userEmail),
      formDataJSON,
    },
    formDataJSON,
  };
}

function buildFormEditFromProfileColumns(profile: Profile, user: User): FormEditPayload {
  const cursosDetalhados = parseCursosDetalhados(profile.cursosCertificacoes);
  const cursosArr = cursosDetalhados.map((c) => c.nome).filter((n) => n.trim());
  const empresasArr = parseJsonSafe<EmpresaExperiencia[]>(profile.experienciasJSON, []);
  const faixaEtaria = parseJsonSafe<string[]>(profile.faixaEtariaFilhos, []);
  const parsedLocation = parseLocation(profile.location);

  const whatsapp =
    profile.whatsapp && profile.phone && profile.whatsapp === profile.phone
      ? 'Sim'
      : profile.whatsapp
        ? 'Sim'
        : 'Não';

  const dataNascimentoISO = profile.dataNascimento
    ? profile.dataNascimento.toISOString().split('T')[0]
    : '';

  return {
    formData: {
      nome: user.name || user.email?.split('@')[0] || '',
      dataNascimento: dataNascimentoISO,
      idade: profile.idade?.toString() || '',
      sexoBiologico: profile.sexoBiologico || '',
      identidadeGenero: profile.identidadeGenero || '',
      orientacaoSexual: profile.orientacaoSexual || '',
      estadoCivil: profile.estadoCivil || '',
      religiao: profile.religiao || '',
      antecedentes: profile.antecedentes === true ? 'Sim' : profile.antecedentes === false ? 'Não' : '',
      possuiFilhos: boolToSimNaoOrEmpty(profile.possuiFilhos),
      quantidadeFilhos: profile.quantidadeFilhos?.toString() || '',
      faixaEtariaFilhos: faixaEtaria,
      email: profile.email || user.email || '',
      telefone: profile.phone || '',
      telefone2: profile.telefone2 || '',
      whatsapp,
      estado: profile.estado || parsedLocation.estado,
      cidade: profile.cidade || parsedLocation.cidade,
      disponibilidadeMudanca: profile.disponibilidadeMudanca || '',
      escolaridade: profile.escolaridade || '',
      cursoFormacao: '',
      instituicaoFormacao: '',
      anoConclusaoFormacao: '',
      cursosCertificacoes: cursosArr.join(', '),
      situacaoProfissional: profile.situacaoProfissional || '',
      areaInteresse: profile.areaInteresse || '',
      cargoDesejado: profile.cargoDesejado || profile.title || '',
      nivelOperacional: '',
      areaNivel: '',
      detalheNivel: '',
      turnoDisponivel: profile.turnoDisponivel || '',
      disponibilidadeInicio: profile.disponibilidadeInicio || '',
      trabalhouIndustria: profile.trabalhouIndustria || '',
      tempoExperiencia: profile.tempoExperiencia || '',
      experiencias: '',
      recolocacao: profile.recolocacao || '',
      pretensaoSalarial: profile.pretensaoSalarial || '',
      fotoPerfil: profile.avatar || null,
      curriculo: profile.curricoURL || profile.portfolio || null,
      atestado: profile.atestadoURL || null,
      mensagemEmpresas: profile.mensagemEmpresas || profile.bio || profile.fullDescription || '',
      autorizoDados: true,
      declaroVerdadeiro: true,
      aceitoLGPD: true,
    },
    cpf: formatCpfInput(profile.cpf || ''),
    telefone: profile.phone || '',
    telefone2: profile.telefone2 || '',
    pretensaoSalarial: profile.pretensaoSalarial || '',
    dataNascimentoDisplay: formatDateBR(profile.dataNascimento),
    cursos: cursosArr.length > 0 ? cursosArr : [''],
    cursosDetalhados,
    empresas:
      empresasArr.length > 0
        ? empresasArr
        : [{ nome: '', cargo: '', segmento: '', dataInicio: '', dataFim: '' }],
  };
}

export function mapProfileToFormEdit(
  profile: Profile,
  user: User,
  formSnapshot?: string | null
): FormEditPayload {
  const fromColumns = buildFormEditFromProfileColumns(profile, user);

  const snapshotSource =
    formSnapshot ??
    (profile as Profile & { formDataJSON?: string | null }).formDataJSON;

  if (snapshotSource) {
    const saved = parseJsonSafe<Record<string, unknown> | null>(snapshotSource, null);
    if (saved && Object.keys(saved).length > 0) {
      const profileCpf = String(profile.cpf || '').replace(/\D/g, '');
      const savedCpf = String(saved.cpf || '').replace(/\D/g, '');

      return mergeStoredOverApi(fromColumns, {
        ...saved,
        nome:
          user.name?.trim() ||
          String(saved.nome || '').trim() ||
          user.email?.split('@')[0] ||
          '',
        email: user.email || saved.email || profile.email || '',
        cpf: profileCpf || savedCpf,
      });
    }
  }

  return fromColumns;
}

function getStringValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === 'object' && Object.keys(value).length === 0) {
    return null;
  }
  return null;
}

function normalizeCursos(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((c) => typeof c === 'string' && c.trim()).map((c) => c.trim());
  }
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((c) => c.trim()).filter(Boolean);
  }
  return [];
}

function normalizeExperiencias(value: unknown): EmpresaExperiencia[] {
  if (Array.isArray(value)) {
    return value
      .filter((e) => e && typeof e === 'object')
      .map((e: any) => ({
        nome: e.nome || '',
        cargo: e.cargo || '',
        segmento: e.segmento || '',
        dataInicio: e.dataInicio || '',
        dataFim: e.dataFim || '',
        descricao: e.descricao || '',
      }));
  }
  return [];
}

export function buildProfileUpsertData(body: Record<string, unknown>, userEmail: string) {
  const cursosDetalhados = parseCursosDetalhados(
    body.cursosDetalhados ?? body.cursos ?? body.cursosCertificacoes,
  );
  const cursos = cursosDetalhados.map((c) => c.nome).filter((n) => n.trim());
  const experiencias = normalizeExperiencias(body.empresas ?? body.experiencias);
  const segmentosIndustria = collectSegmentosIndustria(
    experiencias,
    Array.isArray(body.segmentosIndustria) ? (body.segmentosIndustria as string[]) : [],
  );
  const cargoDerivado = buildCargoDesejado({
    nivelOperacional: getStringValue(body.nivelOperacional) ?? undefined,
    areaNivel: getStringValue(body.areaNivel) ?? undefined,
    detalheNivel: getStringValue(body.detalheNivel) ?? undefined,
  });
  const cargoDesejado =
    getStringValue(body.cargoDesejado) || cargoDerivado || getStringValue(body.profissao);

  const cleanedAvatar =
    getStringValue(body.fotoPerfil) || getStringValue(body.avatar) || null;

  const cleanedPortfolio =
    getStringValue(body.curriculo) ||
    getStringValue(body.curricoURL) ||
    getStringValue(body.portfolio) ||
    null;

  const cleanedAtestado =
    getStringValue(body.atestado) || getStringValue(body.atestadoURL) || null;

  const cidade = getStringValue(body.cidade);
  const estado = getStringValue(body.estado);
  const telefone = getStringValue(body.telefone) || '';
  const whatsappRaw = body.whatsapp;

  const dataNascimento = parseDateInput(
    String(body.dataNascimento || body.dataNascimentoDisplay || '')
  );

  const faixaEtariaFilhos = Array.isArray(body.faixaEtariaFilhos)
    ? body.faixaEtariaFilhos
    : [];

  const skillTags: string[] = [
    ...(Array.isArray(body.maquinasEquipamentos) ? (body.maquinasEquipamentos as string[]) : []),
    ...(Array.isArray(body.qualidadeProcessos) ? (body.qualidadeProcessos as string[]) : []),
    ...(Array.isArray(body.informatica) ? (body.informatica as string[]) : []),
    ...(segmentosIndustria),
    ...(parseCertificacoesDetalhadas(body.certificacoesDetalhadas ?? body.certificacoes).map((c) => c.nome).filter(Boolean)),
    ...(Array.isArray(body.idiomas) ? (body.idiomas as string[]).filter(Boolean) : []),
  ];

  const existingSkills =
    typeof body.habilidades === 'string' && body.habilidades.trim()
      ? body.habilidades.split(',').map((h: string) => h.trim()).filter(Boolean)
      : Array.isArray(body.habilidades)
        ? (body.habilidades as string[])
        : [];

  const mergedSkills = [...new Set([...existingSkills, ...skillTags])];

  const completion =
    typeof body.profileCompletion === 'number'
      ? body.profileCompletion
      : calculateProfileCompletion({
          ...(body as Record<string, unknown>),
          cursos: normalizeCursos(body.cursosCertificacoes),
          certificacoes: parseCertificacoesDetalhadas(body.certificacoesDetalhadas ?? body.certificacoes).map((c) => c.nome),
          idiomas: Array.isArray(body.idiomas) ? (body.idiomas as string[]) : [],
          empresas: experiencias,
        });

  return {
    title: cargoDesejado || getStringValue(body.nome) || 'Profissional',
    bio:
      getStringValue(body.mensagemEmpresas) ||
      getStringValue(body.experiencias) ||
      getStringValue(body.descricaoPessoal) ||
      null,
    fullDescription:
      getStringValue(body.mensagemEmpresas) ||
      getStringValue(body.descricaoPessoal) ||
      getStringValue(body.experiencias) ||
      null,
    location: cidade && estado ? `${cidade}, ${estado}` : estado || cidade || 'Não informado',
    phone: telefone,
    whatsapp: whatsappRaw === 'Sim' ? telefone : getStringValue(body.whatsapp) || '',
    email: getStringValue(body.email) || userEmail,
    skills: mergedSkills.length > 0 ? JSON.stringify(mergedSkills) : null,
    experience: getStringValue(body.tempoExperiencia) || null,
    avatar: cleanedAvatar,
    portfolio: cleanedPortfolio,
    curricoURL: cleanedPortfolio,
    atestadoURL: cleanedAtestado,
    cpf: body.cpf ? formatCpfInput(String(body.cpf)) : null,
    dataNascimento,
    idade:
      typeof body.idade === 'string' || typeof body.idade === 'number'
        ? parseInt(String(body.idade), 10) || null
        : null,
    sexoBiologico: getStringValue(body.sexoBiologico),
    identidadeGenero: getStringValue(body.identidadeGenero),
    orientacaoSexual: getStringValue(body.orientacaoSexual),
    estadoCivil: getStringValue(body.estadoCivil),
    religiao: getStringValue(body.religiao),
    antecedentes: simNaoToBool(body.antecedentes),
    possuiFilhos: simNaoToBool(body.possuiFilhos),
    quantidadeFilhos: parseQuantidadeFilhos(body.quantidadeFilhos),
    faixaEtariaFilhos:
      faixaEtariaFilhos.length > 0 ? JSON.stringify(faixaEtariaFilhos) : null,
    telefone2: getStringValue(body.telefone2),
    estado,
    cidade,
    disponibilidadeMudanca: getStringValue(body.disponibilidadeMudanca),
    escolaridade: getStringValue(body.escolaridade),
    cursosCertificacoes:
      cursosDetalhados.length > 0
        ? JSON.stringify(cursosDetalhados)
        : cursos.length > 0
          ? JSON.stringify(cursos)
          : null,
    situacaoProfissional: getStringValue(body.situacaoProfissional),
    areaInteresse: getStringValue(body.areaInteresse),
    cargoDesejado,
    trabalhouIndustria: getStringValue(body.trabalhouIndustria),
    tempoExperiencia: getStringValue(body.tempoExperiencia),
    experienciasJSON: experiencias.length > 0 ? JSON.stringify(experiencias) : null,
    turnoDisponivel: getStringValue(body.turnoDisponivel),
    disponibilidadeInicio: getStringValue(body.disponibilidadeInicio) || getStringValue(body.disponivelContratacao),
    recolocacao: getStringValue(body.recolocacao),
    pretensaoSalarial: getStringValue(body.pretensaoSalarial),
    mensagemEmpresas: getStringValue(body.mensagemEmpresas),
    profileCompletion: completion,
    disponivelContratacao: getStringValue(body.disponivelContratacao),
  };
}

export function mapProfileToDashboard(profile: Profile, user: User) {
  const skills = profile.skills ? parseJsonSafe<string[]>(profile.skills, []) : [];

  return {
    nome: user.name || user.email?.split('@')[0] || 'Usuário',
    email: profile.email || user.email,
    profissao: profile.cargoDesejado || profile.title || 'Não preenchido',
    cargoDesejado: profile.cargoDesejado || profile.title || 'Não preenchido',
    localizacao: profile.location || 'Não preenchido',
    experiencia: profile.experience || 'Não preenchido',
    experiencias: profile.experience || 'Não preenchido',
    formacao: profile.fullDescription || profile.mensagemEmpresas || 'Não preenchido',
    descricaoPessoal: profile.fullDescription || profile.mensagemEmpresas || 'Não preenchido',
    habilidades: skills,
    telefone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    fotoPerfil: profile.avatar || null,
    avatar: profile.avatar || null,
    curriculo: profile.curricoURL || profile.portfolio || null,
    atestado: profile.atestadoURL || null,
    dataVisualizacoes: profile.viewCount || 0,
    plano: 'free',
    profileCompletion: profile.profileCompletion ?? 0,
  };
}

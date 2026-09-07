export const PREFIRO_NAO_INFORMAR = 'Prefiro não informar';

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const ESCOLARIDADES_OPCOES = [
  'Fundamental incompleto',
  'Fundamental completo',
  'Médio incompleto',
  'Médio completo',
  'Técnico',
  'Superior incompleto',
  'Superior completo',
  'Pós-graduação',
  'MBA',
] as const;

export const SITUACAO_PROFISSIONAL_OPCOES = [
  'Empregado',
  'Desempregado',
  'Primeiro emprego',
  'Jovem Aprendiz (16 a 18)',
] as const;

export const AREAS_INTERESSE = [
  'Automotivo',
  'Aviação',
  'Celulose e Papel',
  'Cerâmica',
  'Construção Civil',
  'Defesa e Segurança',
  'Eletricidade',
  'Eletrônica',
  'Energia',
  'Engenharia',
  'Farmacêutica',
  'Ferramentas',
  'Fiação e Tecelagem',
  'Fundição',
  'Gás Industrial',
  'Indústria Alimentícia',
  'Indústria Beverages',
  'Indústria Cosmética',
  'Indústria de Embalagem',
  'Indústria de Máquinas',
  'Indústria de Plástico',
  'Indústria de Química',
  'Indústria de Vestuário',
  'Indústria Gráfica',
  'Indústria Metal-Mecânica',
  'Indústria Têxtil',
  'Infraestrutura',
  'Instalações Elétricas',
  'Laminação',
  'Logística Industrial',
  'Louças e Vidros',
  'Madeira e Móveis',
  'Manutenção Industrial',
  'Mármore e Granito',
  'Materiais de Construção',
  'Materiais Elétricos',
  'Mecânica de Precisão',
  'Mecânica Industrial',
  'Metalurgia',
  'Mineração',
  'Petroquímica',
  'Plástico',
  'Pneumática e Hidráulica',
  'Produtos Químicos',
  'Refinaria',
  'Siderurgia',
  'Solda e Estruturas Metálicas',
  'Tratamento de Água',
  'Tratamento de Resíduos',
  'Tubo e Conexões',
  'Usina Hidrelétrica',
  'Usina Termelétrica',
] as const;

export const TURNOS_DISPONIVEIS = [
  '1º Turno',
  '2º Turno',
  '3º Turno',
  'Integral',
] as const;

export const DISPONIBILIDADE_INICIO_OPCOES = [
  'Imediata',
  '15 dias',
  '30 dias',
  '2 meses',
] as const;

export const DISPONIBILIDADE_MUDANCA_OPCOES = [
  'Sim',
  'Não',
  'Dependendo da oportunidade',
] as const;

export const ACEITA_VIAGENS_OPCOES = [
  'Sim',
  'Não',
  'Dependendo',
  PREFIRO_NAO_INFORMAR,
] as const;

export const POSSUI_CNH_OPCOES = [
  'Sim',
  'Não',
  PREFIRO_NAO_INFORMAR,
] as const;

export const TRABALHO_INDUSTRIA_OPCOES = [
  'Não',
  'Primeiro emprego',
  'Jovem aprendiz',
  'Sim',
] as const;

export const TEMPOS_EXPERIENCIA_OPCOES = [
  'Menos de 1 ano',
  '1-2 anos',
  '3-5 anos',
  '6-10 anos',
  'Mais de 10 anos',
] as const;

/** Compara valor salvo no perfil com opção escolhida no filtro (ex.: Dependendo ↔ Dependendo da oportunidade). */
export function opcaoSelectCompativel(valorPerfil: string, valorFiltro: string): boolean {
  if (!valorFiltro.trim()) return true;
  const perfil = valorPerfil.trim();
  const filtro = valorFiltro.trim();
  if (!perfil) return false;
  if (perfil === filtro) return true;
  if (filtro.toLowerCase() === 'dependendo' && perfil.toLowerCase().includes('dependendo')) return true;
  return false;
}

export const SEGMENTOS_INDUSTRIA = [
  'Metalúrgica',
  'Automotiva',
  'Alimentícia',
  'Logística',
  'Farmacêutica',
  'Plástico',
  'Papel e Celulose',
  'Construção Civil',
] as const;

export const MAQUINAS_EQUIPAMENTOS = [
  'CNC',
  'CNC Fanuc',
  'CNC Siemens',
  'CNC Mazatrol',
  'Centro de Usinagem',
  'Torno Convencional',
  'Injetora',
  'Prensa',
  'Empilhadeira',
  'Ponte Rolante',
  'Outros',
] as const;

export const CURSOS_INDUSTRIAIS_SUGERIDOS = [
  'NR-10 (Segurança em Eletricidade)',
  'NR-11 (Transporte e Movimentação de Materiais)',
  'NR-12 (Segurança em Máquinas)',
  'NR-13 (Caldeiras e Vasos de Pressão)',
  'NR-33 (Espaços Confinados)',
  'NR-35 (Trabalho em Altura)',
  'Operador de Empilhadeira',
  'Operador de Ponte Rolante',
  'Metrologia',
  'Leitura e Interpretação de Desenho Técnico',
  'Solda MIG/MAG',
  'Solda TIG',
  'Solda Eletrodo Revestido',
  'CNC Fanuc',
  'CNC Siemens',
  'CNC Mazatrol',
  'Torneiro Mecânico',
  'Fresador',
  'ISO 9001',
  'IATF 16949',
  'Lean Manufacturing',
  'Lean Six Sigma (Yellow Belt)',
  'Lean Six Sigma (Green Belt)',
  'Lean Six Sigma (Black Belt)',
  'Kaizen',
  '5S',
] as const;

export const QUALIDADE_PROCESSOS = [
  'ISO 9001',
  'IATF 16949',
  'CEP',
  'FMEA',
  'MASP',
  '5S',
  'Ishikawa',
  'Pareto',
  'Lean Manufacturing',
  'Kaizen',
] as const;

export const INFORMATICA_OPCOES = [
  'Excel Básico',
  'Excel Intermediário',
  'Excel Avançado',
  'SAP',
  'TOTVS',
  'ERP Outros',
] as const;

export const CNH_CATEGORIAS = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'] as const;

export const AREAS_CURSO = [
  'Qualidade',
  'Usinagem',
  'CNC',
  'Segurança do Trabalho',
  'Logística',
  'Administração',
  'Manutenção',
  'Produção',
  'Outros',
] as const;

export type AreaCurso = (typeof AREAS_CURSO)[number];

export type CursoDetalhado = {
  nome: string;
  instituicao?: string;
  cargaHoraria?: string;
  dataConclusao?: string;
  validadeCertificado?: string;
  areaCurso?: AreaCurso | '';
  possuiCertificado?: boolean;
  certificadoUrl?: string;
  verificado?: boolean;
};

export type CursoStatus =
  | 'sem_certificado'
  | 'nao_enviado'
  | 'enviado'
  | 'verificado'
  | 'vencido';

export const CURSO_STATUS_META: Record<
  CursoStatus,
  { label: string; bg: string; border: string; color: string }
> = {
  verificado: {
    label: '✓ Certificado verificado',
    bg: 'rgba(72, 187, 120, 0.22)',
    border: 'rgba(72, 187, 120, 0.6)',
    color: '#8be8a8',
  },
  enviado: {
    label: '📎 Certificado enviado',
    bg: 'rgba(200, 155, 60, 0.22)',
    border: 'rgba(200, 155, 60, 0.6)',
    color: '#C89B3C',
  },
  nao_enviado: {
    label: '⚠ Certificado não enviado',
    bg: 'rgba(200, 155, 60, 0.14)',
    border: 'rgba(200, 155, 60, 0.4)',
    color: '#C89B3C',
  },
  vencido: {
    label: '⌛ Certificado vencido',
    bg: 'rgba(220, 80, 80, 0.22)',
    border: 'rgba(220, 80, 80, 0.6)',
    color: '#f88',
  },
  sem_certificado: {
    label: 'Sem certificado',
    bg: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.15)',
    color: '#9a9a9a',
  },
};

export const CURSO_CERTIFICADO_MAX_BYTES = 10 * 1024 * 1024;

export const CURSO_CERTIFICADO_MIMES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export function isCursoCertificadoMime(mime: string): boolean {
  return (CURSO_CERTIFICADO_MIMES as readonly string[]).includes(mime);
}

export function getCursoStatus(curso: CursoDetalhado, now: Date = new Date()): CursoStatus {
  if (curso.validadeCertificado) {
    const validade = new Date(curso.validadeCertificado);
    if (!Number.isNaN(validade.getTime()) && validade.getTime() < now.getTime()) {
      return 'vencido';
    }
  }
  if (curso.verificado) return 'verificado';
  if (curso.certificadoUrl) return 'enviado';
  if (curso.possuiCertificado) return 'nao_enviado';
  return 'sem_certificado';
}

export function normalizeCursoDetalhado(input: unknown): CursoDetalhado | null {
  if (typeof input === 'string') {
    const nome = input.trim();
    if (!nome) return null;
    return { nome };
  }
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const nome = typeof raw.nome === 'string' ? raw.nome.trim() : '';
    if (!nome) return null;
    const areaCurso =
      typeof raw.areaCurso === 'string' && AREAS_CURSO.includes(raw.areaCurso as AreaCurso)
        ? (raw.areaCurso as AreaCurso)
        : '';
    const certificadoUrl =
        typeof raw.certificadoUrl === 'string' && raw.certificadoUrl.trim()
          ? raw.certificadoUrl.trim()
          : undefined;
    return {
      nome,
      instituicao: typeof raw.instituicao === 'string' ? raw.instituicao.trim() : undefined,
      cargaHoraria: typeof raw.cargaHoraria === 'string' ? raw.cargaHoraria.trim() : undefined,
      dataConclusao: typeof raw.dataConclusao === 'string' ? raw.dataConclusao.trim() : undefined,
      validadeCertificado:
        typeof raw.validadeCertificado === 'string' ? raw.validadeCertificado.trim() : undefined,
      areaCurso,
      possuiCertificado: raw.possuiCertificado === true || Boolean(certificadoUrl),
      certificadoUrl,
      verificado: raw.verificado === true,
    };
  }
  return null;
}

export function parseCursosDetalhados(input: unknown): CursoDetalhado[] {
  if (Array.isArray(input)) {
    return input
      .map((c) => normalizeCursoDetalhado(c))
      .filter((c): c is CursoDetalhado => c !== null);
  }
  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseCursosDetalhados(parsed);
    } catch {
      return input
        .split(',')
        .map((s) => normalizeCursoDetalhado(s.trim()))
        .filter((c): c is CursoDetalhado => c !== null);
    }
  }
  return [];
}

export type CertificacaoDetalhada = {
  nome: string;
  emissor?: string;
  validade?: string;
  possuiCertificado?: boolean;
  certificadoUrl?: string;
  verificado?: boolean;
};

export function normalizeCertificacaoDetalhada(input: unknown): CertificacaoDetalhada | null {
  if (typeof input === 'string') {
    const nome = input.trim();
    if (!nome) return null;
    return { nome };
  }
  if (input && typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const nome = typeof raw.nome === 'string' ? raw.nome.trim() : '';
    if (!nome) return null;
    const certificadoUrl =
      typeof raw.certificadoUrl === 'string' && raw.certificadoUrl.trim()
        ? raw.certificadoUrl.trim()
        : undefined;
    return {
      nome,
      emissor: typeof raw.emissor === 'string' ? raw.emissor.trim() : undefined,
      validade: typeof raw.validade === 'string' ? raw.validade.trim() : undefined,
      possuiCertificado: raw.possuiCertificado === true || Boolean(certificadoUrl),
      certificadoUrl,
      verificado: raw.verificado === true,
    };
  }
  return null;
}

export function parseCertificacoesDetalhadas(input: unknown): CertificacaoDetalhada[] {
  if (Array.isArray(input)) {
    return input
      .map((c) => normalizeCertificacaoDetalhada(c))
      .filter((c): c is CertificacaoDetalhada => c !== null);
  }
  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseCertificacoesDetalhadas(parsed);
    } catch {
      return input
        .split(',')
        .map((s) => normalizeCertificacaoDetalhada(s.trim()))
        .filter((c): c is CertificacaoDetalhada => c !== null);
    }
  }
  return [];
}

export const IDIOMAS_OPCOES = [
  'Português',
  'Inglês',
  'Espanhol',
  'Italiano',
  'Alemão',
  'Francês',
  'Mandarim',
  'Japonês',
  'Outros',
] as const;

export type IdiomaEntry = {
  selecionado: string;
  custom?: string;
};

export function serializeIdioma(entry: IdiomaEntry): string {
  if (!entry.selecionado.trim()) return '';
  if (entry.selecionado === 'Outros') {
    return entry.custom?.trim() ? `Outros: ${entry.custom.trim()}` : '';
  }
  return entry.selecionado.trim();
}

export function parseIdiomaEntry(value: unknown): IdiomaEntry {
  if (value && typeof value === 'object') {
    const raw = value as Record<string, unknown>;
    const selecionado = typeof raw.selecionado === 'string' ? raw.selecionado : '';
    const custom = typeof raw.custom === 'string' ? raw.custom : '';
    if (selecionado) return { selecionado, custom: custom || undefined };
  }
  if (typeof value === 'string' && value.trim()) {
    const texto = value.trim();
    if (texto.startsWith('Outros:')) {
      return { selecionado: 'Outros', custom: texto.replace(/^Outros:\s*/i, '').trim() };
    }
    if ((IDIOMAS_OPCOES as readonly string[]).includes(texto)) {
      return { selecionado: texto };
    }
    return { selecionado: 'Outros', custom: texto };
  }
  return { selecionado: '' };
}

export function parseIdiomasDetalhados(input: unknown): IdiomaEntry[] {
  if (Array.isArray(input)) {
    return input.map((item) => parseIdiomaEntry(item)).filter((e) => e.selecionado.trim());
  }
  if (typeof input === 'string' && input.trim()) {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return parseIdiomasDetalhados(parsed);
    } catch {
      return input
        .split(',')
        .map((s) => parseIdiomaEntry(s.trim()))
        .filter((e) => e.selecionado.trim());
    }
  }
  return [];
}

export const NIVEIS_OPERACIONAIS = [
  'Operador',
  'Auxiliar',
  'Assistente',
  'Técnico',
  'Analista',
  'Supervisor',
  'Líder',
  'Encarregado',
  'Chefia',
  'Coordenador',
  'Liderança',
  'Gerente',
  'Outros',
] as const;

export const AREAS_COMPLEMENTO_NIVEL = [
  'Produção',
  'Qualidade',
  'Manutenção',
  'Logística',
  'Usinagem',
  'PCP',
  'Segurança do Trabalho',
  'Almoxarifado',
  'Engenharia',
  'RH / Administração',
  'Compras',
  'Outros',
] as const;

export function buildCargoDesejado(campos: {
  nivelOperacional?: string;
  areaNivel?: string;
  detalheNivel?: string;
}): string {
  const nivel = campos.nivelOperacional?.trim() || '';
  const area = campos.areaNivel?.trim() || '';
  const detalhe = campos.detalheNivel?.trim() || '';

  if (!nivel && !area && !detalhe) return '';

  const partes: string[] = [];
  if (nivel) partes.push(nivel);
  if (area) partes.push(nivel ? `de ${area}` : area);
  if (detalhe) partes.push(detalhe);
  return partes.join(' — ').trim();
}

export function collectSegmentosIndustria(
  empresas: { segmento?: string }[],
  legado: string[] = [],
): string[] {
  const set = new Set<string>();
  empresas.forEach((e) => {
    if (e.segmento?.trim()) set.add(e.segmento.trim());
  });
  legado.forEach((s) => {
    if (s.trim()) set.add(s.trim());
  });
  return [...set];
}

export function formatPretensaoSalarialInput(value: string): string {
  let apenasNumeros = value.replace(/\D/g, '');
  apenasNumeros = apenasNumeros.replace(/^0+/, '') || '';
  if (!apenasNumeros) return '';

  let centavos = '';
  let inteiro = '';
  if (apenasNumeros.length === 1) {
    inteiro = '0';
    centavos = `0${apenasNumeros}`;
  } else if (apenasNumeros.length === 2) {
    inteiro = '0';
    centavos = apenasNumeros;
  } else {
    centavos = apenasNumeros.slice(-2);
    inteiro = apenasNumeros.slice(0, -2);
  }

  const partes = inteiro.split('').reverse();
  const inteiroFormatado = partes
    .reduce((acc: string[], digit, index) => {
      if (index > 0 && index % 3 === 0) acc.push('.');
      acc.push(digit);
      return acc;
    }, [])
    .reverse()
    .join('');

  return `R$ ${inteiroFormatado},${centavos}`;
}

export type { ProfileCompletionInput } from '@/lib/profile-completion';
export {
  calculateProfileCompletion,
  getCompletionLabel,
  getCompletionMilestone,
} from '@/lib/profile-completion';

/**
 * Índice de Perfil Pessoal (IPP) — Recruta Indústria.
 *
 * Teste próprio para mapear como a pessoa age no dia a dia: reflexão, iniciativa,
 * estabilidade, relações e adaptação. Não é cópia de DISC, PDA ou outra ferramenta
 * comercial protegida.
 */

export type PerfilComportamental =
  | "reflexivo"
  | "dinamico"
  | "estavel"
  | "relacional"
  | "explorador";

export interface PerguntaTeste {
  id: number;
  texto: string;
  perfil: PerfilComportamental;
}

export interface PontuacoesComportamental {
  reflexivo: number;
  dinamico: number;
  estavel: number;
  relacional: number;
  explorador: number;
}

export interface ResultadoTesteComportamental {
  completedAt: string;
  respostas: Record<string, number>;
  pontuacoes: PontuacoesComportamental;
  perfilPrincipal: PerfilComportamental;
}

export const ESCALA_OPCOES = [
  { valor: 1, rotulo: "Discordo plenamente" },
  { valor: 2, rotulo: "Discordo" },
  { valor: 3, rotulo: "Neutro" },
  { valor: 4, rotulo: "Concordo" },
  { valor: 5, rotulo: "Concordo plenamente" },
] as const;

export const ESCALA_EXTREMOS = {
  min: { valor: 1 as const, rotulo: "Discordo plenamente" },
  max: { valor: 5 as const, rotulo: "Concordo plenamente" },
};

/**
 * 25 perguntas sobre comportamento no dia a dia — 5 por perfil.
 * Ids fixos para permitir migração e persistência estável.
 */
export const PERGUNTAS_TESTE: PerguntaTeste[] = [
  // Reflexivo — análise, introspecção, entender antes de agir
  { id: 1, texto: "Antes de tomar uma decisão importante na vida, costumo refletir e analisar prós e contras.", perfil: "reflexivo" },
  { id: 2, texto: "Prefiro entender bem o que está acontecendo em uma situação antes de reagir ou opinar.", perfil: "reflexivo" },
  { id: 3, texto: "Quando alguém me conta um problema, costumo pensar nas causas antes de sugerir algo.", perfil: "reflexivo" },
  { id: 4, texto: "Gosto de organizar meus pensamentos escrevendo, anotando ou conversando comigo mesmo.", perfil: "reflexivo" },
  { id: 5, texto: "Confio mais na minha análise do que em agir por impulso quando algo me afeta pessoalmente.", perfil: "reflexivo" },

  // Dinâmico — ação, energia, iniciativa na vida
  { id: 6, texto: "Quando tenho uma ideia, costumo colocá-la em prática logo, mesmo sem ter tudo planejado.", perfil: "dinamico" },
  { id: 7, texto: "Em situações novas, prefiro experimentar e aprender fazendo do que esperar orientações.", perfil: "dinamico" },
  { id: 8, texto: "Sinto-me bem quando o dia é agitado e tenho várias coisas para fazer e resolver.", perfil: "dinamico" },
  { id: 9, texto: "Quando vejo algo que precisa ser feito em casa, no trabalho ou na vida, costumo resolver na hora.", perfil: "dinamico" },
  { id: 10, texto: "Fico incomodado quando as coisas demoram demais para acontecer e procuro destravar a situação.", perfil: "dinamico" },

  // Estável — rotina, organização, previsibilidade
  { id: 11, texto: "Gosto de ter uma rotina definida para meu dia a dia (horários, hábitos, organização).", perfil: "estavel" },
  { id: 12, texto: "Me sinto mal quando minha casa, meu ambiente ou minhas coisas estão desorganizadas.", perfil: "estavel" },
  { id: 13, texto: "Prefiro estabilidade e previsibilidade a mudanças frequentes na minha vida.", perfil: "estavel" },
  { id: 14, texto: "Costumo cumprir compromissos e horários que assumi com família, amigos ou na vida pessoal.", perfil: "estavel" },
  { id: 15, texto: "Planejo com antecedência viagens, compromissos e tarefas importantes do dia a dia.", perfil: "estavel" },

  // Relacional — empatia, vínculos, apoio às pessoas
  { id: 16, texto: "Costumo perceber como as outras pessoas estão se sentindo, mesmo quando não dizem abertamente.", perfil: "relacional" },
  { id: 17, texto: "Gosto de ajudar amigos, familiares ou colegas quando precisam de apoio emocional ou prático.", perfil: "relacional" },
  { id: 18, texto: "Faço questão de manter contato e cuidar dos relacionamentos importantes na minha vida.", perfil: "relacional" },
  { id: 19, texto: "Consigo conversar e mediar quando há conflito entre pessoas próximas a mim.", perfil: "relacional" },
  { id: 20, texto: "As pessoas costumam me procurar para desabafar ou pedir conselho.", perfil: "relacional" },

  // Explorador — curiosidade, adaptação, busca de causas e soluções
  { id: 21, texto: "A curiosidade me leva a aprender coisas novas por conta própria, mesmo fora do trabalho.", perfil: "explorador" },
  { id: 22, texto: "Quando algo não funciona na minha vida, investigo a causa em vez de só aceitar ou reclamar.", perfil: "explorador" },
  { id: 23, texto: "Gosto de testar jeitos diferentes de resolver um problema antes de desistir.", perfil: "explorador" },
  { id: 24, texto: "Adaptar-me a mudanças inesperadas costuma ser mais fácil para mim do que para muitas pessoas.", perfil: "explorador" },
  { id: 25, texto: "Prefiro entender por que algo aconteceu do que apenas seguir em frente sem refletir.", perfil: "explorador" },
];

export const PERFIS_ORDEM: PerfilComportamental[] = [
  "reflexivo",
  "dinamico",
  "estavel",
  "relacional",
  "explorador",
];

/** Cada perfil usa 5 perguntas; cada resposta vale de 1 a 5 → máximo 25 pontos por perfil. */
export const QUESTOES_POR_PERFIL = 5;
export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;
export const PONTUACAO_MAXIMA_PERFIL = QUESTOES_POR_PERFIL * NOTA_MAXIMA;
export const TOTAL_PERGUNTAS_TESTE = PERGUNTAS_TESTE.length;

export const LEGENDA_PONTUACAO_TESTE =
  `O Índice de Perfil Pessoal (IPP) tem ${TOTAL_PERGUNTAS_TESTE} perguntas sobre como você age no dia a dia. Cada perfil soma 5 delas (notas de 1 a 5). Máximo: ${PONTUACAO_MAXIMA_PERFIL} pontos por perfil.`;

export const PERGUNTAS_POR_PERFIL: Record<PerfilComportamental, number[]> = {
  reflexivo: [1, 2, 3, 4, 5],
  dinamico: [6, 7, 8, 9, 10],
  estavel: [11, 12, 13, 14, 15],
  relacional: [16, 17, 18, 19, 20],
  explorador: [21, 22, 23, 24, 25],
};

export interface PerfilComportamentalInfo {
  emoji: string;
  titulo: string;
  paraCandidato: string;
  visaoRecrutador: string;
}

export const PERFIL_INFO: Record<PerfilComportamental, PerfilComportamentalInfo> = {
  reflexivo: {
    emoji: "🧠",
    titulo: "Reflexivo",
    paraCandidato:
      "Você tende a observar, analisar e entender antes de agir. Valoriza clareza mental e decisões bem pensadas na vida pessoal e profissional.",
    visaoRecrutador:
      "Perfil ponderado e analítico no dia a dia. Bom para funções que exigem atenção, critério e comunicação cuidadosa. Pode precisar de estímulo para agir com mais rapidez em cenários urgentes.",
  },
  dinamico: {
    emoji: "⚡",
    titulo: "Dinâmico",
    paraCandidato:
      "Você gosta de agir, tomar iniciativa e manter ritmo. Prefere resolver na prática e não esperar que as coisas aconteçam sozinhas.",
    visaoRecrutador:
      "Perfil de iniciativa e energia. Responde bem a metas, pressão e ambientes que pedem ação. Pode se beneficiar de rotinas e processos para equilibrar impulso e consistência.",
  },
  estavel: {
    emoji: "🗓️",
    titulo: "Estável",
    paraCandidato:
      "Você valoriza rotina, organização e compromissos. Gosta de previsibilidade e de manter a vida em ordem, o que traz segurança para você e para quem está ao seu redor.",
    visaoRecrutador:
      "Perfil confiável, pontual e disciplinado. Forte em funções com rotina, procedimentos e continuidade. Pode preferir estabilidade a mudanças frequentes de escopo.",
  },
  relacional: {
    emoji: "🤝",
    titulo: "Relacional",
    paraCandidato:
      "Você se conecta com as pessoas, percebe sentimentos e gosta de apoiar quem está perto. Relacionamentos e empatia são centrais no seu jeito de viver.",
    visaoRecrutador:
      "Perfil empático e colaborativo. Facilita trabalho em equipe, atendimento e ambientes que dependem de confiança humana. Pode precisar de reforço em tarefas muito solitárias ou altamente técnicas.",
  },
  explorador: {
    emoji: "🔍",
    titulo: "Explorador",
    paraCandidato:
      "Você é curioso, adaptável e gosta de entender causas e testar soluções. Aprende com a vida e se reinventa quando algo precisa mudar.",
    visaoRecrutador:
      "Perfil versátil e orientado a aprendizado. Bom para ambientes em mudança, resolução de problemas e novas responsabilidades. Pode precisar de estrutura para não dispersar energia em muitas frentes.",
  },
};

/** Perfis do formato industrial (IPI) e legado anterior. */
const MAPA_PERFIL_INDUSTRIAL: Record<string, PerfilComportamental> = {
  analitico: "reflexivo",
  executor: "dinamico",
  organizador: "estavel",
  lider_operacional: "relacional",
  solucionador: "explorador",
  analista: "reflexivo",
  planejador: "estavel",
  comunicador: "relacional",
};

function criarPontuacoesZeradas(): PontuacoesComportamental {
  return {
    reflexivo: 0,
    dinamico: 0,
    estavel: 0,
    relacional: 0,
    explorador: 0,
  };
}

function normalizarPerfilPrincipal(raw: string): PerfilComportamental {
  if (PERFIS_ORDEM.includes(raw as PerfilComportamental)) {
    return raw as PerfilComportamental;
  }
  return MAPA_PERFIL_INDUSTRIAL[raw] ?? "reflexivo";
}

function migrarPontuacoesSalvas(raw: Record<string, unknown>): PontuacoesComportamental {
  const pontuacoes = criarPontuacoesZeradas();

  for (const [chave, valor] of Object.entries(raw)) {
    const num = Number(valor);
    if (!Number.isFinite(num)) continue;

    if (chave in pontuacoes) {
      pontuacoes[chave as PerfilComportamental] = num;
      continue;
    }

    const alvo = MAPA_PERFIL_INDUSTRIAL[chave];
    if (alvo) pontuacoes[alvo] = num;
  }

  return pontuacoes;
}

export function calcularPontuacoes(respostas: Record<string, number>): PontuacoesComportamental {
  const pontuacoes = criarPontuacoesZeradas();

  for (const perfil of PERFIS_ORDEM) {
    pontuacoes[perfil] = PERGUNTAS_POR_PERFIL[perfil].reduce((soma, id) => {
      const nota = Number(respostas[String(id)]);
      return soma + (nota >= 1 && nota <= 5 ? nota : 0);
    }, 0);
  }

  return pontuacoes;
}

export function definirPerfilPrincipal(pontuacoes: PontuacoesComportamental): PerfilComportamental {
  let melhor: PerfilComportamental = "reflexivo";
  let maior = -1;

  for (const perfil of PERFIS_ORDEM) {
    if (pontuacoes[perfil] > maior) {
      maior = pontuacoes[perfil];
      melhor = perfil;
    }
  }

  return melhor;
}

export function validarRespostas(respostas: unknown): Record<string, number> | null {
  if (!respostas || typeof respostas !== "object") return null;

  const normalizadas: Record<string, number> = {};
  const obj = respostas as Record<string, unknown>;

  for (let i = 1; i <= TOTAL_PERGUNTAS_TESTE; i++) {
    const raw = obj[String(i)] ?? obj[i];
    const nota = Number(raw);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) return null;
    normalizadas[String(i)] = nota;
  }

  return normalizadas;
}

export function gerarResultado(respostas: Record<string, number>): ResultadoTesteComportamental {
  const pontuacoes = calcularPontuacoes(respostas);
  return {
    completedAt: new Date().toISOString(),
    respostas,
    pontuacoes,
    perfilPrincipal: definirPerfilPrincipal(pontuacoes),
  };
}

export function parseTesteComportamentalJSON(
  raw: string | null | undefined
): ResultadoTesteComportamental | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ResultadoTesteComportamental> & {
      pontuacoes?: Record<string, unknown>;
    };
    if (!parsed.pontuacoes || !parsed.respostas) return null;

    const perfilPrincipal = normalizarPerfilPrincipal(
      typeof parsed.perfilPrincipal === "string" ? parsed.perfilPrincipal : ""
    );
    const pontuacoes = migrarPontuacoesSalvas(parsed.pontuacoes);

    return {
      completedAt: parsed.completedAt ?? new Date().toISOString(),
      respostas: parsed.respostas,
      pontuacoes,
      perfilPrincipal,
    };
  } catch {
    return null;
  }
}

export function serializeTesteComportamental(resultado: ResultadoTesteComportamental): string {
  return JSON.stringify(resultado);
}

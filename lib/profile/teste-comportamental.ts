export type PerfilComportamental = "executor" | "comunicador" | "planejador" | "analista";

export interface PerguntaTeste {
  id: number;
  texto: string;
  perfil: PerfilComportamental;
}

export interface PontuacoesComportamental {
  executor: number;
  comunicador: number;
  planejador: number;
  analista: number;
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

export const PERGUNTAS_TESTE: PerguntaTeste[] = [
  { id: 1, texto: "Quando tenho um problema para resolver, prefiro agir rápido e tentar uma solução prática imediatamente em vez de planejar muito.", perfil: "executor" },
  { id: 2, texto: "Tenho muita facilidade para puxar assunto, fazer novos amigos e me enturmar em ambientes onde não conheço ninguém.", perfil: "comunicador" },
  { id: 3, texto: "Sinto-me muito desconfortável quando mudam a minha rotina ou os meus planos de última hora.", perfil: "planejador" },
  { id: 4, texto: "Sou extremamente detalhista e reviso minhas tarefas várias vezes para garantir que não haja nenhum erro.", perfil: "analista" },
  { id: 5, texto: "Se vejo uma meta difícil pela frente, fico ainda mais motivado e determinado a superá-la.", perfil: "executor" },
  { id: 6, texto: "Em um grupo ou equipe, eu naturalmente assumo o papel de animar as pessoas e manter o ambiente leve e divertido.", perfil: "comunicador" },
  { id: 7, texto: "Prefiro realizar minhas tarefas de forma calma, constante e segura, seguindo um passo a passo, em vez de trabalhar sob forte pressão.", perfil: "planejador" },
  { id: 8, texto: "Eu sigo as regras e normas estritamente, mesmo quando não concordo totalmente com elas.", perfil: "analista" },
  { id: 9, texto: "Não tenho medo de assumir a liderança de uma situação ou de tomar decisões difíceis quando ninguém quer assumir.", perfil: "executor" },
  { id: 10, texto: "Para mim, o relacionamento humano e o bem-estar das pessoas ao meu redor são mais importantes do que processos rígidos.", perfil: "comunicador" },
  { id: 11, texto: "Detesto discussões e conflitos; muitas vezes prefiro ceder ou ficar em silêncio para manter a paz e a harmonia.", perfil: "planejador" },
  { id: 12, texto: "Tomo minhas decisões diárias e financeiras baseado estritamente em dados, fatos e lógica, nunca pela emoção ou impulso.", perfil: "analista" },
  { id: 13, texto: "Fico muito impaciente quando as coisas demoram para acontecer ou quando convivo com pessoas que agem de forma lenta.", perfil: "executor" },
  { id: 14, texto: "Gosto de expressar minhas opiniões em público, participar de debates e vender minhas ideias para os outros.", perfil: "comunicador" },
  { id: 15, texto: "Sou uma pessoa muito paciente para ouvir o desabafo ou os problemas dos outros e oferecer apoio.", perfil: "planejador" },
  { id: 16, texto: "Sinto uma grande satisfação pessoal em ver minhas coisas, papéis ou arquivos organizados por categorias e padrões claros.", perfil: "analista" },
  { id: 17, texto: "Prefiro que me deem apenas o objetivo final e me deixem livre para trabalhar do meu jeito, com total autonomia.", perfil: "executor" },
  { id: 18, texto: "Trabalhar isolado por muito tempo, sem poder conversar ou interagir com ninguém, me deixa desanimado.", perfil: "comunicador" },
  { id: 19, texto: "Sou muito leal e constante: quando começo um projeto ou assumo um compromisso, vou até o fim sem oscilar.", perfil: "planejador" },
  { id: 20, texto: "Antes de começar a usar uma ferramenta nova, prefiro ler o manual ou assistir a um tutorial completo em vez de ir testando na prática.", perfil: "analista" },
];

const ORDEM_DESEMPATE: PerfilComportamental[] = ["executor", "comunicador", "planejador", "analista"];

/** Cada perfil usa 5 perguntas; cada resposta vale de 1 a 5 → máximo 25 pontos por perfil. */
export const QUESTOES_POR_PERFIL = 5;
export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;
export const PONTUACAO_MAXIMA_PERFIL = QUESTOES_POR_PERFIL * NOTA_MAXIMA;
export const TOTAL_PERGUNTAS_TESTE = PERGUNTAS_TESTE.length;

export const LEGENDA_PONTUACAO_TESTE =
  `O teste tem ${TOTAL_PERGUNTAS_TESTE} perguntas. Cada perfil soma 5 delas (notas de 1 a 5). Máximo: ${PONTUACAO_MAXIMA_PERFIL} pontos por perfil.`;

export const PERGUNTAS_POR_PERFIL: Record<PerfilComportamental, number[]> = {
  executor: [1, 5, 9, 13, 17],
  comunicador: [2, 6, 10, 14, 18],
  planejador: [3, 7, 11, 15, 19],
  analista: [4, 8, 12, 16, 20],
};

export interface PerfilComportamentalInfo {
  emoji: string;
  titulo: string;
  paraCandidato: string;
  visaoRecrutador: string;
}

export const PERFIL_INFO: Record<PerfilComportamental, PerfilComportamentalInfo> = {
  executor: {
    emoji: "🚀",
    titulo: "Executor",
    paraCandidato:
      "Você é alguém determinado, que gosta de desafios e não espera as coisas acontecerem. Tem iniciativa e liderança natural.",
    visaoRecrutador:
      "Jovem com forte potencial para posições que exigem proatividade, metas e tomada de decisão. Possui senso de dono e urgência elevado. Deve ser lapidado para não parecer impaciente.",
  },
  comunicador: {
    emoji: "📣",
    titulo: "Comunicador",
    paraCandidato:
      "Você tem facilidade para fazer amigos, se expressa muito bem e adora trabalhar em equipe. É o ponto de alegria do grupo.",
    visaoRecrutador:
      "Excelente para áreas de atendimento, recepção, vendas ou RH. Tem alta inteligência social e empatia. O foco do desenvolvimento deve ser a atenção a rotinas detalhadas.",
  },
  planejador: {
    emoji: "🤝",
    titulo: "Planejador",
    paraCandidato:
      "Você é uma pessoa confiável, leal e empática. Gosta de ambientes calmos e faz de tudo para ajudar quem está ao seu redor.",
    visaoRecrutador:
      "Perfil ideal para suporte administrativo, atendimento ao cliente e áreas de backoffice. É constante nas entregas, muito ético e lida muito bem com regras e hierarquias.",
  },
  analista: {
    emoji: "🎯",
    titulo: "Analista",
    paraCandidato:
      "Você é focado, observador e muito organizado. Prefere agir com certeza, baseando-se em fatos, regras e lógica.",
    visaoRecrutador:
      "Altíssimo potencial para controle de qualidade, almoxarifado, TI, finanças ou áreas técnicas. Demonstra maturidade precoce, forte compromisso com a ética, conformidade com normas e precisão nas tarefas enviadas.",
  },
};

export function calcularPontuacoes(respostas: Record<string, number>): PontuacoesComportamental {
  const pontuacoes: PontuacoesComportamental = {
    executor: 0,
    comunicador: 0,
    planejador: 0,
    analista: 0,
  };

  for (const perfil of ORDEM_DESEMPATE) {
    pontuacoes[perfil] = PERGUNTAS_POR_PERFIL[perfil].reduce((soma, id) => {
      const nota = Number(respostas[String(id)]);
      return soma + (nota >= 1 && nota <= 5 ? nota : 0);
    }, 0);
  }

  return pontuacoes;
}

export function definirPerfilPrincipal(pontuacoes: PontuacoesComportamental): PerfilComportamental {
  let melhor: PerfilComportamental = "executor";
  let maior = -1;

  for (const perfil of ORDEM_DESEMPATE) {
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

  for (let i = 1; i <= 20; i++) {
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
    const parsed = JSON.parse(raw) as Partial<ResultadoTesteComportamental>;
    if (!parsed.perfilPrincipal || !parsed.pontuacoes || !parsed.respostas) return null;
    const perfil = parsed.perfilPrincipal;
    if (!ORDEM_DESEMPATE.includes(perfil)) return null;
    return {
      completedAt: parsed.completedAt ?? new Date().toISOString(),
      respostas: parsed.respostas,
      pontuacoes: parsed.pontuacoes,
      perfilPrincipal: perfil,
    };
  } catch {
    return null;
  }
}

export function serializeTesteComportamental(resultado: ResultadoTesteComportamental): string {
  return JSON.stringify(resultado);
}

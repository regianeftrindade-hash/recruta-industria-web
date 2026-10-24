import {
  INFORMATICA_OPCOES,
  MAQUINAS_EQUIPAMENTOS,
  QUALIDADE_PROCESSOS,
} from "@/lib/professional-form-config";

export type SanitizedResumeFields = {
  cursoFormacao: string;
  instituicaoFormacao: string;
  cursos: string[];
  conteudoFormacao: string;
  certificacoes: string[];
  maquinasEquipamentos: string[];
  qualidadeProcessos: string[];
  informatica: string[];
};

const BULLET = /^[\s➢•*\-–—]+/;

function cleanLine(value: string): string {
  return value.replace(BULLET, "").replace(/\s+/g, " ").trim();
}

function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return cleanLine(item);
        if (item && typeof item === "object" && "nome" in item) {
          return cleanLine(String((item as { nome?: unknown }).nome || ""));
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [cleanLine(value)];
  return [];
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** "Curso Auxiliar Administrativo — Faculdade Metropolitana" */
const FORMATION_LINE =
  /^(?:curso|gradua[cç][aã]o|tecn[oó]logo(?:\s+em)?|bacharel(?:ado)?(?:\s+em)?|licenciatura(?:\s+em)?)\s+(.+?)\s+[—–-]\s+((?:faculdade|universidade|centro universit[aá]rio|escola|senai|senac|sesi|instituto)\b.+)$/i;

function isStatusOnly(value: string): boolean {
  return /^\(?\s*(cursando|em andamento|incompleto|conclu[ií]do)\s*\)?$/i.test(value.trim());
}

function isSyllabus(value: string): boolean {
  return /^(rotinas|emiss[aã]o|no[cç][oõ]es|controle|conhecimentos?|atividades|respons[aá]vel|acompanhamento)\b/i.test(
    value,
  );
}

function isHeaderJunk(value: string): boolean {
  return /^(uf|cep|nacionalidade|pa[ií]s|naturalidade)\s*:/i.test(value);
}

function isEscolaridadeLine(value: string): boolean {
  const plain = stripAccents(value.toLowerCase());
  return /^(ensino\s+)?(superior|medio|fundamental)\s+(completo|incompleto)$/.test(plain)
    || plain === "pos-graduacao"
    || plain === "mba"
    || plain === "tecnico";
}

function looksLikePersonName(value: string, nome: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 6) return false;
  if (/\d|curso|nr-?\d|excel|iso|certific|senai|senac/i.test(value)) return false;
  if (!words.every((word) => /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(word))) return false;
  const nomeWords = new Set(
    stripAccents(nome)
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length >= 4),
  );
  if (!nomeWords.size) return false;
  return stripAccents(value)
    .toLowerCase()
    .split(/\s+/)
    .some((word) => nomeWords.has(word));
}

function titleWithoutStatus(value: string): { title: string; cursando: boolean } {
  const cursando = /\(\s*cursando\s*\)/i.test(value);
  const title = value.replace(/\(\s*cursando\s*\)/gi, "").replace(/\s+/g, " ").trim();
  return { title, cursando };
}

/**
 * O PDF às vezes joga rótulo, ementa e o nome da pessoa dentro de cursos e certificações.
 * Devolve o curso e a instituição reais, e tira o que não é curso.
 */
export function sanitizeResumeProfileFields(input: {
  nome?: string | null;
  cursoFormacao?: unknown;
  instituicaoFormacao?: unknown;
  cursos?: unknown;
  certificacoes?: unknown;
  maquinasEquipamentos?: unknown;
  qualidadeProcessos?: unknown;
  informatica?: unknown;
}): SanitizedResumeFields {
  const nome = String(input.nome || "");
  let cursoFormacao = cleanLine(String(input.cursoFormacao || ""));
  let instituicaoFormacao = cleanLine(String(input.instituicaoFormacao || ""));
  const cursandoNoCampo = isStatusOnly(cursoFormacao) || /\bcursando\b/i.test(cursoFormacao);
  if (isStatusOnly(cursoFormacao)) cursoFormacao = "";

  const cursos: string[] = [];
  const conteudo: string[] = [];
  let foundCurso = "";
  let foundInstituicao = "";

  for (const raw of asStrings(input.cursos)) {
    if (isHeaderJunk(raw) || isEscolaridadeLine(raw)) continue;
    const formation = raw.match(FORMATION_LINE);
    if (formation) {
      const parsed = titleWithoutStatus(formation[1]);
      foundCurso = parsed.title;
      foundInstituicao = cleanLine(formation[2]);
      if (parsed.cursando) cursoFormacao = cursoFormacao || foundCurso;
      continue;
    }
    if (isSyllabus(raw)) {
      conteudo.push(raw.replace(/\.$/, ""));
      continue;
    }
    if (!cursos.includes(raw)) cursos.push(raw);
  }

  if (foundCurso && (!cursoFormacao || cursandoNoCampo)) {
    cursoFormacao = foundCurso;
  }
  if (/\bcursando\b/i.test(String(input.cursoFormacao || "")) && cursoFormacao && !/\bcursando\b/i.test(cursoFormacao)) {
    cursoFormacao = `${cursoFormacao} (cursando)`;
  }

  if (foundInstituicao) {
    const atual = stripAccents(instituicaoFormacao.toLowerCase()).replace(/\(.*?\)/g, "").trim();
    const completa = stripAccents(foundInstituicao.toLowerCase());
    if (!atual || (completa.includes(atual) && atual !== completa)) {
      instituicaoFormacao = foundInstituicao;
    }
  }

  const certificacoes = asStrings(input.certificacoes).filter(
    (item) => item && !looksLikePersonName(item, nome),
  );

  const maquinaCatalogo = new Set<string>(MAQUINAS_EQUIPAMENTOS);
  const qualidadeCatalogo = new Set<string>(QUALIDADE_PROCESSOS);
  const informaticaCatalogo = new Set<string>(INFORMATICA_OPCOES);
  const maquinasEquipamentos: string[] = [];
  const qualidadeProcessos = asStrings(input.qualidadeProcessos);
  const informatica = asStrings(input.informatica);

  for (const item of asStrings(input.maquinasEquipamentos)) {
    if (informaticaCatalogo.has(item)) {
      if (!informatica.includes(item)) informatica.push(item);
      continue;
    }
    if (qualidadeCatalogo.has(item) && !maquinaCatalogo.has(item)) {
      if (!qualidadeProcessos.includes(item)) qualidadeProcessos.push(item);
      continue;
    }
    if (!maquinasEquipamentos.includes(item)) maquinasEquipamentos.push(item);
  }

  return {
    cursoFormacao,
    instituicaoFormacao,
    cursos: cursos.slice(0, 12),
    conteudoFormacao: conteudo.join(" · "),
    certificacoes,
    maquinasEquipamentos,
    qualidadeProcessos,
    informatica,
  };
}

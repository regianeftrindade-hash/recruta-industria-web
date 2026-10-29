/** Dados públicos da vaga, sem a origem do anúncio. */

const FONTE = /\s*Fonte:\s*\S+/gi;
const ATRIBUICAO =
  /\s*Anúncio público do Emprega Campinas, código \d+, publicado em \d{2}\/\d{2}\/\d{4}\.?/gi;
const PRAZO = /até\s+(\d{2}\/\d{2}\/\d{4})/i;

const FATO_AUSENTE = /n[aã]o informad|n[aã]o preenchid|^outro$|^n\/a$/i;
const LINHA_AUSENTE =
  /^(?:tipo de contrata[cç][aã]o|contrata[cç][aã]o|modalidade|local(?: de trabalho)?|sal[aá]rio)\s*[:\-–]?\s*n[aã]o informad[oa]?(?:\s+no an[uú]ncio)?\.?$/i;
const FRASE_AUSENTE =
  /(?:tipo de contrata[cç][aã]o|contrata[cç][aã]o)\s*[:\-–]?\s*n[aã]o informad[oa]?(?:\s+no an[uú]ncio)?\.?/gi;
const SALARIO_ROTULO = /sal[aá]rio informado no an[uú]ncio\s*:/gi;
const QUANTIDADE =
  /quantidade de vagas(?:\s+no an[uú]ncio)?\s*:\s*\d+\.?/gi;

/** Valor que a vaga realmente trouxe. “Não informado” não entra na página. */
export function statedJobFact(value: string | null | undefined): string | null {
  const text = value?.replace(/\s+/g, " ").trim() || "";
  if (!text || FATO_AUSENTE.test(text)) return null;
  return text;
}

export function textWithoutJobSource(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(FONTE, "")
    .replace(ATRIBUICAO, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!cleaned) return null;
  if (/^Candidaturas abertas até \d{2}\/\d{2}\/\d{4}, conforme o anúncio\.?$/i.test(cleaned)) {
    return null;
  }
  return cleaned;
}

/** Texto público da vaga: só o que consta, com o salário no rótulo curto. */
export function publicJobCopy(value: string | null | undefined): string | null {
  const base = textWithoutJobSource(value);
  if (!base) return null;
  const lines = base
    .replace(SALARIO_ROTULO, "Salário:")
    .replace(QUANTIDADE, "")
    .replace(FRASE_AUSENTE, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .filter((line) => line && !LINHA_AUSENTE.test(line));
  const cleaned = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return cleaned || null;
}

export function jobApplicationDeadline(value: {
  applicationInstructions?: string | null;
  observations?: string | null;
}): string | null {
  const instructions = value.applicationInstructions?.match(PRAZO);
  if (instructions) return instructions[1];
  const observations = value.observations?.match(PRAZO);
  return observations?.[1] ?? null;
}

function publicationTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const time = Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return Number.isNaN(time) ? null : time;
}

/** Mais nova primeiro. Sem data fica no fim. Datas iguais mantêm a ordem recebida. */
export function comparePublicationDateDesc(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const left = publicationTime(a);
  const right = publicationTime(b);
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return right - left;
}

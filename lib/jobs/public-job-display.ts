/** Dados públicos da vaga, sem a origem do anúncio. */

const FONTE = /\s*Fonte:\s*\S+/gi;
const ATRIBUICAO =
  /\s*Anúncio público do Emprega Campinas, código \d+, publicado em \d{2}\/\d{2}\/\d{4}\.?/gi;
const PRAZO = /até\s+(\d{2}\/\d{2}\/\d{4})/i;

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

export function jobApplicationDeadline(value: {
  applicationInstructions?: string | null;
  observations?: string | null;
}): string | null {
  const instructions = value.applicationInstructions?.match(PRAZO);
  if (instructions) return instructions[1];
  const observations = value.observations?.match(PRAZO);
  return observations?.[1] ?? null;
}

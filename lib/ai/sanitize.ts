/**
 * Segurança: remover PII e bloquear dados sensíveis antes de enviar à OpenAI.
 */

const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "cpf", re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g },
  { name: "rg", re: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]\b/g },
  { name: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: "phone", re: /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\s?)?\d{4,5}-?\d{4}\b/g },
  { name: "cep", re: /\b\d{5}-?\d{3}\b/g },
];

/** Campos / termos sensíveis que a IA não deve usar para classificar. */
export const SENSITIVE_EVAL_FIELDS = [
  "religiao",
  "religião",
  "sexo",
  "sexoBiologico",
  "idade",
  "dataNascimento",
  "orientacaoSexual",
  "orientação sexual",
  "identidadeDeGenero",
  "identidade de gênero",
  "genero",
  "gênero",
] as const;

export function scrubPii(text: string): { text: string; redacted: string[] } {
  let out = String(text || "");
  const redacted: string[] = [];
  for (const { name, re } of PII_PATTERNS) {
    const next = out.replace(re, `[${name.toUpperCase()}_REMOVIDO]`);
    if (next !== out) redacted.push(name);
    out = next;
  }
  return { text: out, redacted: [...new Set(redacted)] };
}

/** Remove chaves sensíveis de objetos de contexto (nunca enviar à IA). */
export function stripSensitiveContext(
  input: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  const blocked = new Set(
    SENSITIVE_EVAL_FIELDS.map((s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")),
  );
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    const norm = key.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
    if (blocked.has(norm)) continue;
    if (
      /\b(cpf|rg|telefone|celular|email|e-mail|endereco|endereço|senha|password)\b/i.test(key)
    ) {
      continue;
    }
    if (typeof value === "string") {
      out[key] = scrubPii(value).text;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = stripSensitiveContext(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export const AI_DECISION_BAN =
  "Você NÃO pode contratar, reprovar, mudar etapas do funil, convidar ou tomar qualquer decisão automática. Apenas sugere textos; o usuário confirma antes de aplicar.";

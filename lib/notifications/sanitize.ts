/**
 * Remove dados sensíveis de textos/payloads antes de qualquer canal (WhatsApp incluso).
 */

const BLOCKED_KEYS = /^(cpf|rg|telefone2?|phone|whatsapp|email|endereco|endereço|antecedentes|curriculo|currículo|password|senha|sexo|religiao|religião|orientacao|orientação|identidade|dataNascimento|idade)$/i;

const PII_IN_TEXT = [
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
];

export function scrubNotificationText(text: string): string {
  let out = String(text || "");
  for (const re of PII_IN_TEXT) {
    out = out.replace(re, "[REMOVIDO]");
  }
  return out.slice(0, 500);
}

export function pickSafeMetadata(
  input?: Record<string, unknown> | null,
): Record<string, string | number | boolean | null> {
  if (!input) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(input)) {
    if (BLOCKED_KEYS.test(k)) continue;
    if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      if (typeof v === "string") out[k] = scrubNotificationText(v).slice(0, 200);
      else out[k] = v;
    }
  }
  return out;
}

/** Normaliza telefone BR para E.164 aproximado (só dígitos com 55). Não valida operadora. */
export function normalizePhoneE164(raw: string | null | undefined): string | null {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 10 || digits.length > 13) return null;
  if (digits.startsWith("55")) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return null;
}

import { stripSensitiveCompanyFormEdit } from "@/lib/privacy/company-profile-sanitize";

/**
 * Após desbloqueio, a empresa pode ver contatos autorizados,
 * mas nunca CPF nem dados sensíveis do Art. 11 da LGPD.
 */
export const COMPANY_ALLOWED_CONTACT_KEYS = [
  "email",
  "telefone",
  "whatsapp",
  "phone",
] as const;

export const COMPANY_FORBIDDEN_SENSITIVE_KEYS = [
  "orientacaoSexual",
  "religiao",
  "antecedentes",
  "identidadeGenero",
  "sexoBiologico",
  "cpf",
] as const;

export function sanitizeUnlockedCompanyPayload<T extends Record<string, unknown>>(
  payload: T,
): T {
  if (payload.formEdit && typeof payload.formEdit === "object") {
    stripSensitiveCompanyFormEdit(payload.formEdit as Record<string, unknown>);
  }

  // Garante ausência mesmo se algum campo sensível vazar no resumo/root.
  const resumo =
    payload.resumo && typeof payload.resumo === "object"
      ? (payload.resumo as Record<string, unknown>)
      : null;
  if (resumo) {
    for (const key of COMPANY_FORBIDDEN_SENSITIVE_KEYS) {
      if (key in resumo) delete resumo[key];
    }
  }
  for (const key of COMPANY_FORBIDDEN_SENSITIVE_KEYS) {
    if (key in payload) delete payload[key];
  }

  return payload;
}

export function assertUnlockedCompanyPayloadSafe(
  payload: Record<string, unknown>,
): { ok: true } | { ok: false; reason: string } {
  const blob = JSON.stringify(payload);
  if (/"cpf"\s*:\s*"[0-9]/.test(blob)) {
    return { ok: false, reason: "cpf_digits_present" };
  }
  for (const key of COMPANY_FORBIDDEN_SENSITIVE_KEYS) {
    if (key === "cpf") continue;
    const re = new RegExp(`"${key}"\\s*:\\s*"(?!\\s*")[^"]+"`);
    if (re.test(blob)) {
      return { ok: false, reason: `${key}_present` };
    }
  }
  return { ok: true };
}

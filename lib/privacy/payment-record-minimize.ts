/**
 * Minimização de PII em PaymentRecord.customer / meta para respostas e logs.
 * Não apaga o registro — só reduz exposição de dados pessoais.
 */

const SENSITIVE_CUSTOMER_KEYS =
  /^(name|nome|email|e-mail|cpf|cnpj|phone|telefone|mobile|address|endereco|document|tax_id|taxId)$/i;

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_CUSTOMER_KEYS.test(key)) {
    if (typeof value === "string" && value.includes("@")) return "[redacted-email]";
    return "[redacted]";
  }
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[redacted-doc]");
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return minimizePaymentCustomerObject(value as Record<string, unknown>);
  }
  return value;
}

export function minimizePaymentCustomerObject(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = redactValue(key, value);
  }
  return out;
}

/** customer/meta podem ser JSON string no banco. */
export function minimizePaymentRecordFields(fields: {
  customer?: string | null;
  meta?: string | null;
}): { customer: string | null; meta: string | null } {
  function scrub(raw: string | null | undefined): string | null {
    if (raw == null || raw === "") return raw ?? null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return JSON.stringify(
          minimizePaymentCustomerObject(parsed as Record<string, unknown>),
        );
      }
    } catch {
      // texto livre
    }
    return raw
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[redacted-doc]");
  }
  return {
    customer: scrub(fields.customer),
    meta: scrub(fields.meta),
  };
}

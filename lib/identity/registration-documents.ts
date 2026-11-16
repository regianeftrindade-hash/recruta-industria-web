import { formatCNPJ, formatCPF, isValidCNPJ, isValidCPF, isValidPhoneBR } from "@/lib/security/security";
import { normalizePhoneE164 } from "@/lib/notifications/sanitize";

/** País do cadastro quando o formulário não informa outro. */
export const DEFAULT_COUNTRY_CODE = "BR";

export type BrazilianDocumentKind = "CPF" | "CNPJ";

export type IdentityDocumentResult =
  | { supported: true; countryCode: "BR"; kind: BrazilianDocumentKind; valid: boolean }
  | { supported: false; countryCode: string; kind: string };

export function normalizeCountryCode(countryCode?: string | null): string {
  const code = (countryCode ?? DEFAULT_COUNTRY_CODE).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : DEFAULT_COUNTRY_CODE;
}

/**
 * Só o Brasil tem regra neste código: CPF e CNPJ.
 * Outro país fica explícito como não suportado, sem máscara nem algoritmo inventado.
 */
export function checkIdentityDocument(
  value: string,
  kind: string,
  countryCode?: string | null,
): IdentityDocumentResult {
  const country = normalizeCountryCode(countryCode);
  if (country !== "BR" || (kind !== "CPF" && kind !== "CNPJ")) {
    return { supported: false, countryCode: country, kind };
  }
  const valid = kind === "CPF" ? isValidCPF(value) : isValidCNPJ(value);
  return { supported: true, countryCode: "BR", kind, valid };
}

/** Máscara brasileira. Fora do Brasil, devolve o texto original. */
export function formatIdentityDocument(
  value: string,
  kind: string,
  countryCode?: string | null,
): string {
  const check = checkIdentityDocument(value, kind, countryCode);
  if (!check.supported) return value;
  if (check.kind === "CPF") return formatCPF(value);
  return formatCNPJ(value);
}

/** Brasil usa DDD ou +55. Outro país exige + e tamanho E.164, sem plano nacional. */
export function isValidPhone(phone: string, countryCode?: string | null): boolean {
  const country = normalizeCountryCode(countryCode);
  if (country === "BR") return isValidPhoneBR(phone);
  return normalizePhoneE164(phone, country) != null;
}

/** Mensagem atual do Brasil quando o documento é inválido. Fora do Brasil, o documento não é aceito. */
export function registrationDocumentError(
  value: string,
  kind: BrazilianDocumentKind,
  countryCode: string | null | undefined,
  invalidMessage: string,
): string | null {
  const check = checkIdentityDocument(value, kind, countryCode);
  if (!check.supported) {
    return kind === "CPF"
      ? "CPF só é aceito em cadastros do Brasil."
      : "CNPJ só é aceito em cadastros do Brasil.";
  }
  return check.valid ? null : invalidMessage;
}

/** Mensagem atual do Brasil quando o telefone é inválido. Fora do Brasil, não trata o número como DDD. */
export function registrationPhoneError(
  phone: string,
  countryCode: string | null | undefined,
  brazilianMessage: string,
): string | null {
  const country = normalizeCountryCode(countryCode);
  if (country === "BR") return isValidPhoneBR(phone) ? null : brazilianMessage;
  return isValidPhone(phone, country)
    ? null
    : "Informe o telefone com o código internacional, começando com +.";
}

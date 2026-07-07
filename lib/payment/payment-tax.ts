/** CPF/CNPJ apenas dígitos — válido para PagBank (11 ou 14). */
export function sanitizeTaxId(value: string | null | undefined): string | undefined {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 11 || digits.length === 14) return digits;
  return undefined;
}

/** Sandbox: CPF de teste aceito pelo PagBank quando o cadastro não tem documento. */
export function fallbackTaxIdForSandbox(): string {
  return '11144477735';
}

/**
 * Contratação pública do Premium profissional.
 * Sem PROFESSIONAL_PREMIUM_ENABLED, ou com outro valor, o plano fica oculto:
 * some das páginas de preço e contratação e a API recusa cobrança nova.
 * Preço, benefícios, assinaturas e pagamentos já registrados permanecem.
 * Reative com PROFESSIONAL_PREMIUM_ENABLED=true no ambiente e reinicie o servidor.
 */
export function isEnvFlagOn(value: string | undefined | null): boolean {
  return /^(1|true|yes|on)$/i.test(String(value ?? "").trim());
}

export function isProfessionalPremiumOfferingEnabled(): boolean {
  return isEnvFlagOn(process.env.PROFESSIONAL_PREMIUM_ENABLED);
}

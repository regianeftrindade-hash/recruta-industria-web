export type ProfessionalAccessState = "free" | "active" | "pending" | "declined" | "canceled";

/** Estado mostrado ao profissional. O Premium ativo vem do plano no servidor, não do navegador. */
export function professionalAccessState(input: {
  isPremium: boolean;
  latestChargeStatus?: string | null;
}): ProfessionalAccessState {
  if (input.isPremium) return "active";
  const status = String(input.latestChargeStatus || "").toUpperCase();
  if (status === "PENDING") return "pending";
  if (status === "DECLINED") return "declined";
  if (status === "CANCELED" || status === "CANCELLED") return "canceled";
  return "free";
}

/** Cobrança paga no registro local, mas o plano ainda não está Premium. Exige nova consulta ao gateway. */
export function professionalChargeNeedsSync(input: {
  isPremium: boolean;
  latestChargeStatus?: string | null;
}): boolean {
  return !input.isPremium && String(input.latestChargeStatus || "").toUpperCase() === "PAID";
}

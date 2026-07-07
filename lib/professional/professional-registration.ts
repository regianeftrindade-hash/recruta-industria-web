import type { Profile } from "@prisma/client";

/** Cadastro considerado completo quando há perfil com dados mínimos. */
export function isProfessionalRegistrationComplete(
  profile: Pick<Profile, "cpf" | "profileCompletion" | "formDataJSON"> | null | undefined,
): boolean {
  if (!profile) return false;

  const cpf = profile.cpf?.replace(/\D/g, "") ?? "";
  if (cpf.length === 11) return true;

  if ((profile.profileCompletion ?? 0) >= 40) return true;

  if (profile.formDataJSON?.trim()) {
    try {
      const parsed = JSON.parse(profile.formDataJSON) as { cpf?: string };
      const cpfForm = parsed.cpf?.replace(/\D/g, "") ?? "";
      if (cpfForm.length === 11) return true;
    } catch {
      /* ignora JSON inválido */
    }
  }

  return false;
}

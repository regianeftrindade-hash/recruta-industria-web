import type { Profile } from "@prisma/client";

export const AVISO_COMPLETAR_CADASTRO_VAGAS_SITE =
  "Complete o cadastro para concorrer às vagas direto do site.";

/** Conta criada só com nome, CPF, e-mail, telefone e senha. */
export function isCadastroRapidoPendente(formDataJSON: string | null | undefined): boolean {
  if (!formDataJSON?.trim()) return false;
  try {
    const parsed = JSON.parse(formDataJSON) as { cadastroRapido?: unknown };
    return parsed.cadastroRapido === true;
  } catch {
    return false;
  }
}

/** Cadastro considerado completo quando há perfil com dados mínimos. */
export function isProfessionalRegistrationComplete(
  profile: Pick<Profile, "cpf" | "profileCompletion" | "formDataJSON"> | null | undefined,
): boolean {
  if (!profile) return false;
  if (isCadastroRapidoPendente(profile.formDataJSON)) return false;

  const cpf = profile.cpf?.replace(/\D/g, "") ?? "";
  if (cpf.length === 11) return true;

  if ((profile.profileCompletion ?? 0) >= 40) return true;

  if (profile.formDataJSON?.trim()) {
    try {
      const parsed = JSON.parse(profile.formDataJSON) as {
        cpf?: string;
        nome?: string;
        email?: string;
      };
      const cpfForm = parsed.cpf?.replace(/\D/g, "") ?? "";
      if (cpfForm.length === 11) return true;
      if (String(parsed.nome || "").trim().length >= 3 && String(parsed.email || "").includes("@")) {
        return true;
      }
    } catch {
      /* ignora JSON inválido */
    }
  }

  return false;
}

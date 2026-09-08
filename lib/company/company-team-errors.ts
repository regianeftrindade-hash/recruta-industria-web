/**
 * Erros de convite/remoção de equipe → status HTTP + mensagem.
 * Extraído da API para testes sem banco.
 */
export function mapTeamInviteError(code: string): { status: number; error: string } | null {
  const map: Record<string, { status: number; error: string }> = {
    EMAIL_INVALID: { status: 400, error: "Informe um e-mail válido." },
    FORBIDDEN: { status: 403, error: "Somente o administrador pode convidar." },
    CANNOT_INVITE_SELF: { status: 400, error: "Você já faz parte da equipe." },
    CANNOT_REVOKE_OWNER: {
      status: 400,
      error: "Não é possível substituir o administrador principal.",
    },
    SEAT_LIMIT: {
      status: 403,
      error:
        "Limite de usuários atingido. Remova alguém, substitua um usuário ou compre um usuário extra.",
    },
    EMAIL_IS_PROFESSIONAL: {
      status: 400,
      error: "Este e-mail já está cadastrado como profissional.",
    },
    EMAIL_HAS_OWN_COMPANY: {
      status: 400,
      error: "Este e-mail já possui uma empresa própria. Use outro e-mail.",
    },
    ALREADY_MEMBER_ELSEWHERE: {
      status: 400,
      error: "Este e-mail já pertence a outra equipe.",
    },
    ALREADY_ACTIVE: { status: 400, error: "Este e-mail já está ativo na equipe." },
  };
  return map[code] ?? null;
}

export function mapTeamRevokeError(code: string): { status: number; error: string } | null {
  if (code === "FORBIDDEN") {
    return { status: 403, error: "Somente o administrador pode remover." };
  }
  if (code === "CANNOT_REVOKE_OWNER") {
    return { status: 400, error: "Não é possível remover o administrador." };
  }
  return null;
}

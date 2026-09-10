import { describe, expect, it } from "vitest";
import {
  mapTeamInviteError,
  mapTeamRevokeError,
} from "@/lib/company/company-team-errors";
import { getCompanySubscriptionKey } from "@/lib/company/company-team";

describe("erros de equipe", () => {
  it("mapeia convites inválidos para 400", () => {
    expect(mapTeamInviteError("EMAIL_INVALID")?.status).toBe(400);
    expect(mapTeamInviteError("EMAIL_IS_PROFESSIONAL")?.error).toMatch(/profissional/i);
    expect(mapTeamInviteError("EMAIL_HAS_OWN_COMPANY")?.status).toBe(400);
    expect(mapTeamInviteError("ALREADY_MEMBER_ELSEWHERE")?.status).toBe(400);
    expect(mapTeamInviteError("ALREADY_ACTIVE")?.status).toBe(400);
  });

  it("mapeia FORBIDDEN de convite para 403", () => {
    expect(mapTeamInviteError("FORBIDDEN")).toEqual({
      status: 403,
      error: "Somente o administrador pode convidar.",
    });
  });

  it("mapeia remoção do owner e código desconhecido", () => {
    expect(mapTeamRevokeError("CANNOT_REVOKE_OWNER")?.status).toBe(400);
    expect(mapTeamRevokeError("CANNOT_REVOKE_OWNER")?.error).toMatch(/administrador/i);
    expect(mapTeamInviteError("CODIGO_INEXISTENTE")).toBeNull();
    expect(mapTeamRevokeError("XYZ")).toBeNull();
  });
});

describe("chave de assinatura da equipe", () => {
  it("gera chave estável para chat/vídeo", () => {
    expect(getCompanySubscriptionKey("owner-1")).toBe("subscription:owner-1");
  });
});

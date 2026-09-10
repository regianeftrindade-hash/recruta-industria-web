import { describe, expect, it } from "vitest";
import { normalizeTeamInviteRole } from "@/lib/company/company-team";

describe("normalizeTeamInviteRole", () => {
  it("mantém roles convidáveis", () => {
    expect(normalizeTeamInviteRole("ADMIN")).toBe("ADMIN");
    expect(normalizeTeamInviteRole("RECRUITER")).toBe("RECRUITER");
    expect(normalizeTeamInviteRole("RH")).toBe("RH");
  });

  it("não promove OWNER nem aceita lixo — cai em RH", () => {
    expect(normalizeTeamInviteRole("OWNER")).toBe("RH");
    expect(normalizeTeamInviteRole("foo")).toBe("RH");
    expect(normalizeTeamInviteRole(undefined)).toBe("RH");
    expect(normalizeTeamInviteRole(null)).toBe("RH");
  });
});

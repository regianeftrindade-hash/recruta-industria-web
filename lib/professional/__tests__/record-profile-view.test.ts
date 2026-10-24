import { describe, expect, it } from "vitest";
import { PROFILE_VIEW_REPEAT_MS, companyProfileViewType, shouldRecordCompanyProfileView, visibleCompanyName } from "@/lib/professional/record-profile-view";
import { conteudoEmailPerfilVisualizado } from "@/lib/professional/professional-notifications";

describe("registro de visita ao perfil", () => {
  const now = new Date("2026-10-23T15:00:00.000Z");

  it("não conta o próprio profissional nem uma repetição recente", () => {
    expect(shouldRecordCompanyProfileView({
      companyUserId: "empresa-1",
      profileOwnerUserId: "empresa-1",
      lastViewAt: null,
      now,
    })).toBe(false);
    expect(shouldRecordCompanyProfileView({
      companyUserId: "empresa-1",
      profileOwnerUserId: "prof-1",
      lastViewAt: new Date(now.getTime() - PROFILE_VIEW_REPEAT_MS + 1000),
      now,
    })).toBe(false);
  });

  it("marca a visita como anônima e não monta e-mail com o nome da empresa", () => {
    expect(companyProfileViewType(true, true)).toBe("FULL_ANON");
    expect(companyProfileViewType(false, true)).toBe("SUMMARY_ANON");
    expect(companyProfileViewType(true, false)).toBe("FULL");
    const identificado = conteudoEmailPerfilVisualizado({
      professionalName: "Ana",
      companyName: "Metalúrgica Silva",
      anonymous: false,
      homeUrl: "https://recrutaindustria.com/",
    });
    expect(identificado?.text).toContain("Metalúrgica Silva");
    expect(conteudoEmailPerfilVisualizado({
      professionalName: "Ana",
      companyName: "Metalúrgica Silva",
      anonymous: true,
      homeUrl: "https://recrutaindustria.com/",
    })).toBeNull();
  });

  it("não revela o nome da empresa para o plano gratuito nem para visita anônima", () => {
    expect(visibleCompanyName(false, "FULL", "Metalúrgica Silva")).toBeNull();
    expect(visibleCompanyName(true, "FULL_ANON", "Metalúrgica Silva")).toBeNull();
    expect(visibleCompanyName(true, "FULL", "  ")).toBeNull();
    expect(visibleCompanyName(true, "SUMMARY", "Metalúrgica Silva")).toBe("Metalúrgica Silva");
  });

  it("registra a primeira visita de uma empresa e uma nova visita depois do intervalo", () => {
    expect(shouldRecordCompanyProfileView({
      companyUserId: "empresa-1",
      profileOwnerUserId: "prof-1",
      lastViewAt: null,
      now,
    })).toBe(true);
    expect(shouldRecordCompanyProfileView({
      companyUserId: "empresa-1",
      profileOwnerUserId: "prof-1",
      lastViewAt: new Date(now.getTime() - PROFILE_VIEW_REPEAT_MS - 1),
      now,
    })).toBe(true);
  });
});

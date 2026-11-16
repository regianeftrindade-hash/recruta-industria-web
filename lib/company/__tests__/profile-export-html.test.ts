import { describe, expect, it } from "vitest";
import { profileExportDecision, profileExportFileSlug } from "@/lib/company/profile-export-access";
import { renderProfileExportHtml } from "@/lib/company/profile-export-html";
import { SUPPORTED_LOCALES, htmlLang } from "@/lib/i18n/locales";

const profile = {
  nome: "Ana Souza",
  cargo: "Soldadora",
  area: "Caldeiraria",
  cidade: "Campinas",
  estado: "SP",
  email: "ana@example.invalid",
  phone: "(19) 99999-0000",
  whatsapp: null,
  disponibilidade: "Imediata",
  escolaridade: "Técnico",
  cursos: ["NR-35"],
  certificacoes: [],
  idiomas: ["Português"],
  tempoExperiencia: "5 anos",
  segmentos: ["Metalurgia"],
  maquinas: [],
  qualidade: [],
  informatica: [],
  empresas: [{ cargo: "Soldadora", nome: "Metalúrgica Aurora" }],
  turno: "Comercial",
  pretensao: "R$ 3.500,00",
  cnh: "Sim",
  categoriaCnh: "B",
  viagens: "Não",
  mudanca: "Sim",
  apresentacao: "Experiência no chão de fábrica.",
};

describe("exportação do perfil", () => {
  it("usa o idioma pedido e preserva os dados do candidato", () => {
    const html = renderProfileExportHtml(profile, "en", new Date("2026-11-16T15:00:00.000Z"));
    expect(html).toContain('lang="en"');
    expect(html).toContain("Desired role");
    expect(html).toContain("Ana Souza");
    expect(html).toContain("Campinas");
    expect(html).toContain("Soldadora");
    expect(html).toContain("Metalúrgica Aurora");
    expect(html).not.toContain("Cargo desejado");
  });

  it("cai para pt-BR quando o idioma não existe", () => {
    const html = renderProfileExportHtml(profile, "sv");
    expect(html).toContain(`lang="${htmlLang("pt-BR")}"`);
    expect(html).toContain("Cargo desejado");
  });

  it("exige desbloqueio e não coloca o nome cru no arquivo", () => {
    expect(profileExportDecision({ canExportProfiles: true, hasActiveUnlock: false })).toBe("locked");
    expect(profileExportDecision({ canExportProfiles: false, hasActiveUnlock: true })).toBe("plan");
    expect(profileExportDecision({ canExportProfiles: true, hasActiveUnlock: true })).toBe("ok");
    expect(profileExportFileSlug('Ana "Souza"\r\n../perfil')).toBe("Ana-Souza-perfil");
    expect(profileExportFileSlug("   ")).toBe("perfil");
  });

  it("escreve o html nos 12 idiomas sem apagar o nome", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderProfileExportHtml(profile, locale);
      expect(html).toContain(`lang="${htmlLang(locale)}"`);
      expect(html).toContain("Ana Souza");
      expect(html.length).toBeGreaterThan(200);
    }
  });
});

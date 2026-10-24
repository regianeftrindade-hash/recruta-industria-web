import { describe, expect, it } from "vitest";
import {
  INSTAGRAM_SHARE_URL,
  facebookShareUrl,
  jobShareMessage,
  jobSocialMetadata,
  publicJobUrl,
  safeJobReturnPath,
  whatsAppShareText,
  whatsAppShareUrl,
} from "@/lib/jobs/public-job-link";

const JOB_ID = "cmvig4kmr0000jm01gv6sr929";

describe("link público da vaga", () => {
  it("usa o domínio oficial e não leva dados de painel", () => {
    expect(publicJobUrl(JOB_ID)).toBe(`https://www.recrutaindustria.com/vagas/${JOB_ID}`);
  });

  it("monta o Facebook só com a URL pública", () => {
    const url = facebookShareUrl(JOB_ID);
    expect(url.startsWith("https://www.facebook.com/sharer/sharer.php?u=")).toBe(true);
    expect(decodeURIComponent(url)).toContain(`https://www.recrutaindustria.com/vagas/${JOB_ID}`);
    expect(url).not.toContain("admin");
    expect(url).not.toContain("@");
  });

  it("prepara o WhatsApp com o resumo público da vaga", () => {
    const vaga = {
      id: JOB_ID,
      title: "Auxiliar Administrativo",
      companyLabel: "Empresa confidencial",
      anonymous: true,
      workplace: "Campinas/SP",
      workModeLabel: "Presencial",
      contractLabel: "CLT",
      salaryLabel: "A combinar",
      description: "Atuação no chão de fábrica. Contato rh@secreta.com ou 11988887777.",
    };
    const text = whatsAppShareText(vaga);
    expect(text).toContain("Auxiliar Administrativo");
    expect(text).toContain("Empresa confidencial · Campinas/SP · Presencial · CLT · A combinar");
    expect(text).toContain("Atuação no chão de fábrica");
    expect(text).toContain(`https://www.recrutaindustria.com/vagas/${JOB_ID}`);
    expect(text).not.toContain("MetalurgicaSigilosaXYZ");
    expect(text).not.toContain("rh@secreta.com");
    expect(text).not.toContain("11988887777");
    expect(jobShareMessage(vaga)).toBe(text);
    expect(whatsAppShareUrl(vaga)).toContain("https://wa.me/?text=");
    expect(decodeURIComponent(whatsAppShareUrl(vaga))).toContain("Atuação no chão de fábrica");
    expect(INSTAGRAM_SHARE_URL).toBe("https://www.instagram.com/");
  });

  it("aceita somente o retorno interno da vaga de origem", () => {
    expect(safeJobReturnPath(`/vagas/${JOB_ID}`)).toBe(`/vagas/${JOB_ID}?candidatar=1`);
    expect(safeJobReturnPath(`/vagas/${JOB_ID}?candidatar=1`)).toBe(`/vagas/${JOB_ID}?candidatar=1`);
    expect(safeJobReturnPath("https://evil.example/vagas/abcdefghi")).toBeNull();
    expect(safeJobReturnPath("//evil.example")).toBeNull();
    expect(safeJobReturnPath("/admin")).toBeNull();
    expect(safeJobReturnPath(`/vagas/${JOB_ID}?candidatar=1&next=https://evil.example`)).toBeNull();
    expect(safeJobReturnPath("/vagas/../admin")).toBeNull();
    expect(safeJobReturnPath("/%2f%2fevil.example")).toBeNull();
  });

  it("não coloca o nome real da empresa anônima no título nem no resumo", () => {
    const social = jobSocialMetadata({
      title: "Auxiliar Administrativo",
      companyLabel: "Empresa confidencial",
      description: "Atuação no chão de fábrica. Contato rh@secreta.com ou 11988887777.",
      anonymous: true,
    });
    expect(social.title).toBe("Auxiliar Administrativo");
    expect(social.description.startsWith("Empresa confidencial.")).toBe(true);
    expect(social.title + social.description).not.toContain("MetalurgicaSigilosaXYZ");
    expect(social.description).not.toContain("rh@secreta.com");
    expect(social.description).not.toContain("11988887777");
  });

  it("pode citar o nome público quando a vaga é identificada", () => {
    const social = jobSocialMetadata({
      title: "Soldador",
      companyLabel: "Paizao na Cozinha",
      description: "Vaga aberta.",
      anonymous: false,
      workplace: "Campinas/SP",
      salaryLabel: "A combinar",
    });
    expect(social.title).toBe("Soldador · Paizao na Cozinha");
    expect(social.description).toContain("Paizao na Cozinha");
    expect(social.description).toContain("Campinas/SP");
    expect(social.description).toContain("A combinar");
  });
});

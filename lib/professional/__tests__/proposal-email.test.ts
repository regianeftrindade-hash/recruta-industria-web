import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, htmlLang } from "@/lib/i18n/locales";
import {
  proposalSalaryLabel,
  renderProposalReceivedEmail,
  renderProposalResponseEmail,
} from "@/lib/professional/proposal-email";

const base = {
  recipientName: "Ana Souza",
  companyName: "Metalúrgica Aurora",
  cargo: "Soldadora",
  salario: "3500",
  turno: "Comercial",
  cidade: "Campinas",
  homeUrl: "https://www.recrutaindustria.com",
};

describe("e-mail de proposta", () => {
  it("fala o idioma do destinatário e não traduz cargo, cidade nem empresa", () => {
    const message = renderProposalReceivedEmail({ ...base, locale: "en" });
    expect(message.html).toContain('lang="en"');
    expect(message.subject).toContain("New proposal");
    expect(message.subject).toContain("Soldadora");
    expect(message.html).toContain("Metalúrgica Aurora");
    expect(message.html).toContain("Campinas");
    expect(message.html).toContain("R$ 3500");
    expect(message.html).not.toContain("Nova proposta");
  });

  it("mantém salário já em reais e usa pt-BR sem preferência", () => {
    expect(proposalSalaryLabel("R$ 3.500,00")).toBe("R$ 3.500,00");
    const message = renderProposalReceivedEmail({ ...base, salario: "R$ 3.500,00", locale: null });
    expect(message.html).toContain('lang="pt-BR"');
    expect(message.html).toContain("Nova proposta recebida");
    expect(message.html).toContain("R$ 3.500,00");
    expect(message.html).not.toContain("R$ R$");
  });

  it("responde à empresa no idioma da conta", () => {
    const message = renderProposalResponseEmail({
      locale: "es",
      recipientName: "RH Aurora",
      professionalName: "Ana Souza",
      action: "INTERESTED",
      cargo: "Soldadora",
      homeUrl: base.homeUrl,
    });
    expect(message.html).toContain(`lang="${htmlLang("es")}"`);
    expect(message.html).toContain("Ana Souza");
    expect(message.html).toContain("Soldadora");
    expect(message.subject).not.toContain("demonstrou interesse");
  });

  it("gera assunto nos 12 idiomas", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const message = renderProposalReceivedEmail({ ...base, locale });
      expect(message.subject.trim().length).toBeGreaterThan(8);
      expect(message.html).toContain(`lang="${htmlLang(locale)}"`);
      expect(message.html).toContain("Soldadora");
    }
  });
});

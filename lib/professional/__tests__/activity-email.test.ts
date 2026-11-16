import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";
import {
  renderFavoriteEmail,
  renderInterviewInviteEmail,
  renderMessageReceivedEmail,
  renderProfileViewedEmail,
} from "@/lib/professional/activity-email";

const interview = {
  scheduledAt: "2026-11-16T15:00:00.000Z",
  locationType: "PRESENTIAL" as const,
  address: "Rua das Indústrias, 10",
  observacoes: "Levar documento",
};

describe("e-mails de atividade", () => {
  it("fala o idioma da conta e preserva empresa, texto e endereço", () => {
    const viewed = renderProfileViewedEmail({
      locale: "en",
      recipientName: "Ana Souza",
      companyName: "Metalúrgica Aurora",
      homeUrl: "https://recrutaindustria.com/",
    });
    expect(viewed.html).toContain('lang="en"');
    expect(viewed.subject).toContain("viewed your profile");
    expect(viewed.text).toContain("Metalúrgica Aurora");
    expect(viewed.html).not.toContain("visualizou");

    const message = renderMessageReceivedEmail({
      locale: "es",
      recipientName: "Ana Souza",
      companyName: "Metalúrgica Aurora",
      preview: "Podemos conversar amanhã?",
      homeUrl: "https://recrutaindustria.com/",
    });
    expect(message.html).toContain('lang="es"');
    expect(message.html).toContain("Podemos conversar amanhã?");
    expect(message.subject).not.toContain("Nova mensagem");

    const saved = renderFavoriteEmail({
      locale: null,
      recipientName: "Ana Souza",
      companyName: "Metalúrgica Aurora",
      homeUrl: "https://recrutaindustria.com/",
    });
    expect(saved.html).toContain('lang="pt-BR"');
    expect(saved.subject).toContain("favoritado");
  });

  it("monta o comprovante da entrevista no idioma do destinatário", () => {
    const invite = renderInterviewInviteEmail({
      locale: "en",
      recipientName: "Ana Souza",
      companyName: "Metalúrgica Aurora",
      interview,
      homeUrl: "https://recrutaindustria.com/",
    });
    expect(invite.html).toContain('lang="en"');
    expect(invite.html).toContain("Metalúrgica Aurora");
    expect(invite.html).toContain("Rua das Indústrias, 10");
    expect(invite.html).toContain("Levar documento");
    expect(invite.text).not.toContain("Comprovante de agendamento");

    const fallback = formatInterviewComprovante({
      companyName: "Metalúrgica Aurora",
      scheduledAt: interview.scheduledAt,
      locationType: "ONLINE",
      meetingUrl: "https://meet.example/sala",
      observacoes: "",
      locale: "sv",
    });
    expect(fallback.text).toContain("Comprovante de agendamento");
    expect(fallback.text).toContain("https://meet.example/sala");
  });

  it("cobre os 12 idiomas sem traduzir o nome da empresa", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const message = renderProfileViewedEmail({
        locale,
        recipientName: "Ana Souza",
        companyName: "Metalúrgica Aurora",
        homeUrl: "https://recrutaindustria.com/",
      });
      expect(message.html).toContain(`lang="${locale}"`);
      expect(message.text).toContain("Metalúrgica Aurora");
      expect(message.subject.length).toBeGreaterThan(8);
    }
  });
});

/**
 * Testes da camada de notificações (modo simulado — sem envio real).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { canSendWhatsApp, type UserNotificationPreferences } from "@/lib/notifications/preferences";
import { isWhatsAppEnabled, getWhatsAppConfig } from "@/lib/notifications/config";
import { normalizePhoneE164, scrubNotificationText } from "@/lib/notifications/sanitize";
import { renderTemplate, listTemplateKeys, getTemplate } from "@/lib/notifications/templates/pt-BR";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { getProviderForChannel } from "@/lib/notifications/providers";
import { verifyWhatsAppWebhookChallenge } from "@/lib/notifications/webhook";

function basePrefs(over: Partial<UserNotificationPreferences> = {}): UserNotificationPreferences {
  return {
    userId: "u1",
    inAppEnabled: true,
    emailEnabled: true,
    whatsappEnabled: false,
    phoneVerified: false,
    whatsappConsent: false,
    whatsappConsentAt: null,
    resolvedPhoneE164: "5511999999999",
    blocked: false,
    ...over,
  };
}

describe("WhatsApp desativado", () => {
  const prev = process.env.WHATSAPP_ENABLED;
  beforeEach(() => {
    process.env.WHATSAPP_ENABLED = "false";
  });
  afterEach(() => {
    process.env.WHATSAPP_ENABLED = prev;
  });

  it("isWhatsAppEnabled é false", () => {
    expect(isWhatsAppEnabled()).toBe(false);
  });

  it("provedor WhatsApp usa disabled e não falha", async () => {
    const p = getProviderForChannel("WHATSAPP");
    expect(p.isEnabled()).toBe(false);
    const result = await p.send({
      to: "5511999999999",
      userId: "u1",
      event: "interview_invite",
      templateKey: "interview_invite_pt",
      bodyText: "teste",
      payload: {
        eventLabel: "Convite",
        platformPath: "/professional/dashboard",
      },
    });
    expect(result.ok).toBe(true);
    expect(["skipped", "simulated"]).toContain(result.status);
  });
});

describe("consentimento e preferências", () => {
  it("número sozinho NÃO autoriza WhatsApp", () => {
    const r = canSendWhatsApp(
      basePrefs({
        resolvedPhoneE164: "5511988776655",
        whatsappEnabled: false,
        whatsappConsent: false,
        phoneVerified: false,
      }),
    );
    expect(r.ok).toBe(false);
  });

  it("exige opt-in + consentimento + telefone verificado", () => {
    expect(
      canSendWhatsApp(
        basePrefs({
          whatsappEnabled: true,
          whatsappConsent: true,
          phoneVerified: true,
          resolvedPhoneE164: "5511988776655",
        }),
      ).ok,
    ).toBe(true);
  });

  it("bloqueia usuário", () => {
    expect(
      canSendWhatsApp(
        basePrefs({
          blocked: true,
          whatsappEnabled: true,
          whatsappConsent: true,
          phoneVerified: true,
        }),
      ).reason,
    ).toBe("USER_BLOCKED");
  });
});

describe("templates e sanitização", () => {
  it("tem modelos para os eventos principais", () => {
    const keys = listTemplateKeys();
    expect(keys.some((k) => k.includes("interview_invite"))).toBe(true);
    expect(keys.some((k) => k.includes("interview_cancelled"))).toBe(true);
  });

  it("render não inclui CPF no texto", () => {
    const rendered = renderTemplate("interview_invite", {
      companyName: "Empresa X",
      eventLabel: "Convite",
      scheduledAtLabel: "01/08/2026 10:00",
      platformPath: "/professional/dashboard?cpf=123",
    });
    expect(rendered).toBeTruthy();
    expect(rendered!.bodyText).not.toMatch(/123\.456/);
    expect(rendered!.platformUrl).not.toContain("cpf=");
    expect(rendered!.title).toBe("Convite para entrevista");
  });

  it("escolhe o modelo do idioma da conta e volta ao português se o idioma não existir", () => {
    const payload = {
      companyName: "Empresa X",
      professionalName: "Ana",
      eventLabel: "Convite",
      scheduledAtLabel: "01/08/2026 10:00",
      stageLabel: "Entrevista",
      platformPath: "/professional/dashboard",
    };
    const english = renderTemplate("interview_invite", { ...payload, locale: "en" });
    expect(english!.title).toBe("Interview invitation");
    expect(english!.templateKey).toBe("interview_invite_en");
    expect(english!.bodyText).toContain("Empresa X");
    expect(english!.bodyText).toContain("01/08/2026 10:00");
    expect(english!.platformUrl).toContain("/professional/dashboard");

    const spanish = renderTemplate("interview_invite", { ...payload, locale: "es" });
    expect(spanish!.title).toBe("Invitación a entrevista");
    expect(spanish!.templateKey).toBe("interview_invite_es");
    expect(spanish!.bodyText).toContain("Empresa X");
    expect(spanish!.title).not.toBe(english!.title);

    const european = renderTemplate("invite_accepted", { ...payload, locale: "pt-PT" });
    expect(european!.title).toBe("Convite aceite");
    expect(european!.bodyText).toContain("Ana");

    const unknown = renderTemplate("interview_invite", { ...payload, locale: "sv" as "en" });
    expect(unknown!.title).toBe("Convite para entrevista");
    expect(unknown!.templateKey).toBe("interview_invite_pt");

    const events = [
      "interview_invite",
      "interview_confirmed",
      "interview_rescheduled",
      "interview_cancelled",
      "interview_reminder",
      "new_message",
      "invite_accepted",
      "invite_declined",
      "process_stage_changed",
    ] as const;
    for (const locale of SUPPORTED_LOCALES) {
      for (const event of events) {
        const rendered = renderTemplate(event, { ...payload, locale });
        expect(rendered?.title.trim().length).toBeGreaterThan(0);
        if (event === "invite_accepted" || event === "invite_declined") {
          expect(rendered?.bodyText).toContain("Ana");
        } else {
          expect(rendered?.bodyText).toContain("Empresa X");
        }
        expect(rendered?.bodyText).toContain(rendered!.platformUrl);
        expect(getTemplate(event, locale)?.locale).toBe(locale);
      }
    }
    expect(listTemplateKeys()).toHaveLength(SUPPORTED_LOCALES.length * events.length);
  });

  it("scrub remove e-mail de texto livre", () => {
    expect(scrubNotificationText("fale com a@b.com")).toContain("[REMOVIDO]");
  });

  it("normalizePhoneE164", () => {
    expect(normalizePhoneE164("(11) 98877-6655")).toBe("5511988776655");
    expect(normalizePhoneE164("123")).toBeNull();
  });
});

describe("webhook verify", () => {
  const prev = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  beforeEach(() => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "token-teste";
  });
  afterEach(() => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = prev;
  });

  it("aceita challenge com token correto", () => {
    const r = verifyWhatsAppWebhookChallenge({
      mode: "subscribe",
      token: "token-teste",
      challenge: "12345",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.challenge).toBe("12345");
  });

  it("rejeita token errado", () => {
    const r = verifyWhatsAppWebhookChallenge({
      mode: "subscribe",
      token: "errado",
      challenge: "1",
    });
    expect(r.ok).toBe(false);
  });
});

describe("config sem NEXT_PUBLIC de token", () => {
  it("getWhatsAppConfig não lê NEXT_PUBLIC_ACCESS_TOKEN", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN = "nao-deve-usar";
    process.env.WHATSAPP_ACCESS_TOKEN = "";
    const cfg = getWhatsAppConfig();
    expect(cfg.accessToken).toBe("");
    delete process.env.NEXT_PUBLIC_WHATSAPP_ACCESS_TOKEN;
  });
});

import { PREMIUM_RESUME_PROMPT } from "@/lib/curriculum/resume-copy";
import {
  type ApplicationMode,
  JobPostingError,
  formatWhatsappDisplay,
  isApplicationMode,
} from "@/lib/jobs/job-posting";

export type ProfessionalPlan = "FREE" | "PREMIUM";

export type ApplicantContact = {
  kind: "email" | "whatsapp" | "url";
  value: string;
};

export type ApplyDelivery = "internal" | "automatic" | "manual";

const PREMIUM_REQUIRED =
  "No plano Free, copie o dado desta vaga e envie a candidatura por conta própria. O envio automático é do Premium.";

const WHATSAPP_MANUAL =
  "Este canal não envia a mensagem automaticamente. Copie o WhatsApp e envie o currículo por conta própria.";

const EXTERNAL_MANUAL =
  "Esta vaga recebe a candidatura no site da empresa. O Recruta Indústria não conclui essa inscrição automaticamente.";

export function applicationModeLabel(mode: ApplicationMode): string {
  if (mode === "EMAIL") return "Candidatura por e-mail";
  if (mode === "WHATSAPP") return "Candidatura por WhatsApp";
  if (mode === "EXTERNAL") return "Candidatura pelo site da empresa";
  return "Candidatura pelo Recruta Indústria";
}

export function normalizeApplicationMode(value: string | null | undefined): ApplicationMode {
  return value && isApplicationMode(value) ? value : "INTERNAL";
}

/**
 * Dado que o profissional autenticado pode ver. A página pública e o Premium
 * no e-mail não recebem o endereço: o servidor usa o e-mail só para enviar.
 */
export function discloseApplicationContact(input: {
  audience: "anonymous" | "company" | "professional";
  plan: ProfessionalPlan | null;
  mode: ApplicationMode;
  email: string | null;
  whatsapp: string | null;
  url: string | null;
}): { delivery: ApplyDelivery; contact: ApplicantContact | null } {
  const mode = input.mode;
  if (mode === "INTERNAL") {
    return { delivery: "internal", contact: null };
  }
  if (mode === "EMAIL" && input.audience === "professional" && input.plan === "PREMIUM") {
    return { delivery: "automatic", contact: null };
  }

  if (input.audience !== "professional" && mode !== "EXTERNAL") {
    return { delivery: "manual", contact: null };
  }

  if (mode === "EMAIL" && input.email) {
    return { delivery: "manual", contact: { kind: "email", value: input.email } };
  }
  if (mode === "WHATSAPP" && input.whatsapp) {
    return {
      delivery: "manual",
      contact: { kind: "whatsapp", value: formatWhatsappDisplay(input.whatsapp) },
    };
  }
  if (mode === "EXTERNAL" && input.url) {
    return { delivery: "manual", contact: { kind: "url", value: input.url } };
  }
  return { delivery: "manual", contact: null };
}

export type ApplyPanel = {
  methodLabel: string;
  detail: string;
  contact: ApplicantContact | null;
  automatic: boolean;
  needsResume: boolean;
  externalLink: string | null;
  copyLabel: string | null;
};

/** Painel depois do clique. Mostra um único dado, o do método da vaga. */
export function describeApplyPanel(input: {
  mode: ApplicationMode;
  plan: ProfessionalPlan | null;
  contact: ApplicantContact | null;
  hasResume: boolean;
}): ApplyPanel {
  const disclosed = discloseApplicationContact({
    audience: input.plan ? "professional" : "anonymous",
    plan: input.plan,
    mode: input.mode,
    email: input.contact?.kind === "email" ? input.contact.value : null,
    whatsapp: input.contact?.kind === "whatsapp" ? input.contact.value : null,
    url: input.contact?.kind === "url" ? input.contact.value : null,
  });
  const contact = disclosed.contact?.kind === "email" && input.mode !== "EMAIL"
    ? null
    : disclosed.contact?.kind === "whatsapp" && input.mode !== "WHATSAPP"
      ? null
      : disclosed.contact?.kind === "url" && input.mode !== "EXTERNAL"
        ? null
        : disclosed.contact;

  if (input.mode === "INTERNAL") {
    return {
      methodLabel: applicationModeLabel("INTERNAL"),
      detail: "A candidatura fica registrada aqui no Recruta Indústria.",
      contact: null,
      automatic: false,
      needsResume: false,
      externalLink: null,
      copyLabel: null,
    };
  }

  if (input.mode === "EMAIL" && input.plan === "PREMIUM") {
    return {
      methodLabel: applicationModeLabel("EMAIL"),
      detail: input.hasResume
        ? "O envio automático anexa o currículo salvo no seu perfil e só confirma quando o e-mail é aceito."
        : PREMIUM_RESUME_PROMPT,
      contact: null,
      automatic: true,
      needsResume: !input.hasResume,
      externalLink: null,
      copyLabel: null,
    };
  }

  if (input.mode === "EMAIL") {
    return {
      methodLabel: applicationModeLabel("EMAIL"),
      detail: "Copie o e-mail, escreva a mensagem, anexe seu currículo e envie por conta própria. No plano Free o Recruta Indústria não envia a candidatura.",
      contact: contact?.kind === "email" ? contact : null,
      automatic: false,
      needsResume: false,
      externalLink: null,
      copyLabel: "Copiar e-mail",
    };
  }

  if (input.mode === "WHATSAPP") {
    return {
      methodLabel: applicationModeLabel("WHATSAPP"),
      detail: "Não há integração para concluir o WhatsApp aqui. Copie o número, abra o WhatsApp, anexe seu currículo e envie por conta própria.",
      contact: contact?.kind === "whatsapp" ? contact : null,
      automatic: false,
      needsResume: false,
      externalLink: null,
      copyLabel: "Copiar número",
    };
  }

  return {
    methodLabel: applicationModeLabel("EXTERNAL"),
    detail: "Acesse o site para concluir a candidatura. O Recruta Indústria não preenche login, formulário ou teste desse site e não confirma o envio.",
    contact: contact?.kind === "url" ? contact : null,
    automatic: false,
    needsResume: false,
    externalLink: contact?.kind === "url" ? contact.value : null,
    copyLabel: "Copiar link",
  };
}

/**
 * Decide o que o servidor pode executar. O plano vem do banco, nunca do navegador.
 * Retorna a ação real. Canais sem integração lançam erro e não gravam envio.
 */
export function assertServerDelivery(input: {
  mode: ApplicationMode;
  plan: ProfessionalPlan;
  hasValidResume: boolean;
}): "send-email" | "register-internal" {
  if (input.mode === "WHATSAPP") {
    throw new JobPostingError(WHATSAPP_MANUAL, 400, "MANUAL_CHANNEL");
  }
  if (input.mode === "EXTERNAL") {
    throw new JobPostingError(EXTERNAL_MANUAL, 400, "MANUAL_CHANNEL");
  }
  if (input.mode === "INTERNAL") {
    return "register-internal";
  }
  if (input.plan !== "PREMIUM") {
    throw new JobPostingError(PREMIUM_REQUIRED, 403, "PREMIUM_REQUIRED");
  }
  if (!input.hasValidResume) {
    throw new JobPostingError(
      "Para o envio automático, anexe um currículo em PDF ou DOCX ao seu perfil.",
      400,
      "RESUME_REQUIRED",
    );
  }
  return "send-email";
}

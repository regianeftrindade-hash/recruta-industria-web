import type { NotificationEvent, SafeNotificationPayload } from "@/lib/notifications/types";
import { scrubNotificationText } from "@/lib/notifications/sanitize";

export type MessageTemplate = {
  key: string;
  event: NotificationEvent;
  locale: "pt-BR";
  /** Título curto (in-app / e-mail) */
  title: string;
  /** Corpo controlado — sem texto livre de empresas */
  body: (p: SafeNotificationPayload, platformUrl: string) => string;
};

function baseUrl(): string {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function platformUrlFromPath(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Sem query com dados privados
  return `${baseUrl()}${clean.split("?")[0]}`;
}

const TEMPLATES_PT_BR: MessageTemplate[] = [
  {
    key: "interview_invite_pt",
    event: "interview_invite",
    locale: "pt-BR",
    title: "Convite para entrevista",
    body: (p, url) =>
      `Recruta Indústria: ${p.companyName || "Uma empresa"} convidou você para entrevista${
        p.scheduledAtLabel ? ` em ${p.scheduledAtLabel}` : ""
      }. Acesse: ${url}`,
  },
  {
    key: "interview_confirmed_pt",
    event: "interview_confirmed",
    locale: "pt-BR",
    title: "Entrevista confirmada",
    body: (p, url) =>
      `Recruta Indústria: entrevista com ${p.companyName || "a empresa"} confirmada${
        p.scheduledAtLabel ? ` (${p.scheduledAtLabel})` : ""
      }. Detalhes: ${url}`,
  },
  {
    key: "interview_rescheduled_pt",
    event: "interview_rescheduled",
    locale: "pt-BR",
    title: "Entrevista reagendada",
    body: (p, url) =>
      `Recruta Indústria: nova data/horário com ${p.companyName || "a empresa"}${
        p.scheduledAtLabel ? `: ${p.scheduledAtLabel}` : ""
      }. Veja: ${url}`,
  },
  {
    key: "interview_cancelled_pt",
    event: "interview_cancelled",
    locale: "pt-BR",
    title: "Entrevista cancelada",
    body: (p, url) =>
      `Recruta Indústria: entrevista com ${p.companyName || "a empresa"} foi cancelada. Acompanhe: ${url}`,
  },
  {
    key: "interview_reminder_pt",
    event: "interview_reminder",
    locale: "pt-BR",
    title: "Lembrete de entrevista",
    body: (p, url) =>
      `Recruta Indústria: lembrete — entrevista${
        p.scheduledAtLabel ? ` em ${p.scheduledAtLabel}` : ""
      }${p.companyName ? ` com ${p.companyName}` : ""}. Abrir: ${url}`,
  },
  {
    key: "new_message_pt",
    event: "new_message",
    locale: "pt-BR",
    title: "Nova mensagem",
    body: (p, url) =>
      `Recruta Indústria: nova mensagem${p.companyName ? ` de ${p.companyName}` : ""}. Ler no painel: ${url}`,
  },
  {
    key: "invite_accepted_pt",
    event: "invite_accepted",
    locale: "pt-BR",
    title: "Convite aceito",
    body: (p, url) =>
      `Recruta Indústria: ${p.professionalName || "O profissional"} aceitou o convite. Painel: ${url}`,
  },
  {
    key: "invite_declined_pt",
    event: "invite_declined",
    locale: "pt-BR",
    title: "Convite recusado",
    body: (p, url) =>
      `Recruta Indústria: ${p.professionalName || "O profissional"} recusou o convite. Painel: ${url}`,
  },
  {
    key: "process_stage_changed_pt",
    event: "process_stage_changed",
    locale: "pt-BR",
    title: "Atualização do processo",
    body: (p, url) =>
      `Recruta Indústria: etapa atualizada${p.stageLabel ? ` — ${p.stageLabel}` : ""}${
        p.companyName ? ` (${p.companyName})` : ""
      }. Ver: ${url}`,
  },
];

export function getTemplate(
  event: NotificationEvent,
  locale: "pt-BR" = "pt-BR",
): MessageTemplate | null {
  return TEMPLATES_PT_BR.find((t) => t.event === event && t.locale === locale) || null;
}

export function renderTemplate(
  event: NotificationEvent,
  payload: SafeNotificationPayload,
): { templateKey: string; title: string; bodyText: string; platformUrl: string } | null {
  const locale = payload.locale || "pt-BR";
  const tpl = getTemplate(event, locale);
  if (!tpl) return null;
  const platformUrl = platformUrlFromPath(payload.platformPath);
  const safePayload: SafeNotificationPayload = {
    ...payload,
    companyName: payload.companyName
      ? scrubNotificationText(payload.companyName).slice(0, 80)
      : undefined,
    professionalName: payload.professionalName
      ? scrubNotificationText(payload.professionalName).slice(0, 80)
      : undefined,
    eventLabel: scrubNotificationText(payload.eventLabel).slice(0, 80),
    scheduledAtLabel: payload.scheduledAtLabel
      ? scrubNotificationText(payload.scheduledAtLabel).slice(0, 80)
      : undefined,
    stageLabel: payload.stageLabel
      ? scrubNotificationText(payload.stageLabel).slice(0, 80)
      : undefined,
  };
  return {
    templateKey: tpl.key,
    title: tpl.title,
    bodyText: scrubNotificationText(tpl.body(safePayload, platformUrl)),
    platformUrl,
  };
}

export function listTemplateKeys(): string[] {
  return TEMPLATES_PT_BR.map((t) => t.key);
}

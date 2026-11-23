import { sendEmailDetailed } from "@/lib/infra/email";
import { JobPostingError } from "@/lib/jobs/job-posting";
import {
  DOCX_MIME,
  isDocxBuffer,
  isPdfBuffer,
  RESUME_REQUIRED_MESSAGE,
  resumeFormatFromName,
  resumePathOwnedBy,
} from "@/lib/jobs/resume-pdf";
import { downloadPrivateFile, extractStoragePath } from "@/lib/storage/private-uploads";
import { resolveLocale, type SupportedLocale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

const SEND_FAILURE = "Não foi possível enviar a candidatura agora. Tente novamente mais tarde.";

export const APPLICATION_EMAIL_SUCCESS =
  "Candidatura enviada com sucesso! Seu currículo foi encaminhado para o processo seletivo desta vaga.";

export const APPLICATION_PROFILE_EMAIL_SUCCESS =
  "Candidatura enviada com sucesso! Seu perfil do Recruta Indústria foi encaminhado para o processo seletivo desta vaga.";

export type ApplicationProfileMail = {
  cargo: string | null;
  area: string | null;
  local: string | null;
  escolaridade: string | null;
  turno: string | null;
  experiencia: string | null;
  experiencias: string | null;
  recolocacao: string | null;
  pretensaoSalarial: string | null;
  mensagem: string | null;
  habilidades: string | null;
  profileUrl: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filled(value: string | null | undefined): string | null {
  const text = value?.trim() || "";
  return text || null;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_match, key: string) => vars[key] ?? "");
}

function text(key: MessageKey, locale: SupportedLocale, vars: Record<string, string> = {}): string {
  return fill(t(key, locale), vars);
}

const PROFILE_LABEL_KEYS: Array<[keyof ApplicationProfileMail, MessageKey]> = [
  ["cargo", "mail.application.label.cargo"],
  ["area", "mail.application.label.area"],
  ["local", "mail.application.label.local"],
  ["escolaridade", "mail.application.label.escolaridade"],
  ["turno", "mail.application.label.turno"],
  ["experiencia", "mail.application.label.experiencia"],
  ["experiencias", "mail.application.label.experiencias"],
  ["recolocacao", "mail.application.label.recolocacao"],
  ["pretensaoSalarial", "mail.application.label.pretensaoSalarial"],
  ["habilidades", "mail.application.label.habilidades"],
  ["mensagem", "mail.application.label.mensagem"],
];

export function applicationProfileLines(
  profile: ApplicationProfileMail,
  localeInput?: string | null,
): string[] {
  const locale = resolveLocale(localeInput);
  return PROFILE_LABEL_KEYS.flatMap(([field, key]) => {
    const value = filled(profile[field]);
    return value ? [`${text(key, locale)}: ${value}`] : [];
  });
}

export function buildApplicationMail(input: {
  jobTitle: string;
  professionalName: string | null;
  profile?: ApplicationProfileMail | null;
  resumeFormat?: "pdf" | "docx";
  /** Idioma da vaga ou do destinatário. Padrão pt-BR. */
  locale?: string | null;
}): { subject: string; text: string; html: string } {
  const locale = resolveLocale(input.locale);
  const title = input.jobTitle.trim() || "Vaga";
  const name = input.professionalName?.trim() || "Profissional";
  const profileLines = input.profile ? applicationProfileLines(input.profile, locale) : [];
  const profileUrl = filled(input.profile?.profileUrl);
  const formatLabel = input.resumeFormat === "docx" ? "DOCX" : "PDF";
  const body = profileLines.length || profileUrl
    ? [
      text("mail.application.profileFallback", locale),
      "",
      ...profileLines,
      ...(profileUrl
        ? ["", text("mail.application.profileUrl", locale, { url: profileUrl })]
        : []),
    ]
    : [text("mail.application.resumeAttached", locale, { format: formatLabel })];
  const textBody = [
    text("mail.application.greeting", locale),
    "",
    text("mail.application.intro", locale, { title }),
    "",
    text("mail.application.professional", locale, { name }),
    "",
    ...body,
    "",
    text("mail.application.signoff", locale),
    text("mail.application.brand", locale),
  ].join("\n");
  const html = textBody
    .split("\n")
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
    .join("");
  return {
    subject: text("mail.application.subject", locale, { title }),
    text: textBody,
    html,
  };
}

export async function tryLoadOwnedResumePdf(
  email: string,
  stored: string | null | undefined,
): Promise<Buffer | null> {
  try {
    return await loadOwnedResumePdf(email, stored);
  } catch (error) {
    if (error instanceof JobPostingError && (error.code === "RESUME_REQUIRED" || error.status === 502)) {
      return null;
    }
    throw error;
  }
}

export type OwnedResume = {
  bytes: Buffer;
  format: "pdf" | "docx";
  filename: string;
  contentType: string;
};

export async function loadOwnedResume(
  email: string,
  stored: string | null | undefined,
): Promise<OwnedResume> {
  const raw = stored?.trim() || "";
  const path = raw.includes("://") ? extractStoragePath(raw) : raw.replace(/^\/+/, "").split("?")[0];
  const format = path ? resumeFormatFromName(path) : null;
  if (!path || !format || !resumePathOwnedBy(path, email)) {
    throw new JobPostingError(RESUME_REQUIRED_MESSAGE, 400, "RESUME_REQUIRED");
  }

  let bytes: Buffer | null = null;
  try {
    bytes = await downloadPrivateFile(path);
  } catch {
    console.error("[candidatura-email] falha ao ler o currículo");
    throw new JobPostingError(SEND_FAILURE, 502);
  }

  const valid = Boolean(bytes) && (format === "pdf" ? isPdfBuffer(bytes as Buffer) : isDocxBuffer(bytes as Buffer));
  if (!bytes || !valid) {
    throw new JobPostingError(RESUME_REQUIRED_MESSAGE, 400, "RESUME_REQUIRED");
  }

  return {
    bytes,
    format,
    filename: format === "pdf" ? "curriculo.pdf" : "curriculo.docx",
    contentType: format === "pdf" ? "application/pdf" : DOCX_MIME,
  };
}

export async function loadOwnedResumePdf(email: string, stored: string | null | undefined): Promise<Buffer> {
  const resume = await loadOwnedResume(email, stored);
  if (resume.format !== "pdf") {
    throw new JobPostingError(RESUME_REQUIRED_MESSAGE, 400, "RESUME_REQUIRED");
  }
  return resume.bytes;
}

export async function sendJobApplicationEmail(input: {
  to: string;
  jobTitle: string;
  professionalName: string | null;
  professionalEmail: string;
  resume?: Buffer | null;
  resumeFormat?: "pdf" | "docx";
  profile?: ApplicationProfileMail | null;
  locale?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const format = input.resumeFormat === "docx" ? "docx" : "pdf";
  const mail = buildApplicationMail({
    jobTitle: input.jobTitle,
    professionalName: input.professionalName,
    profile: input.resume ? null : input.profile,
    resumeFormat: input.resume ? format : undefined,
    locale: input.locale,
  });
  const result = await sendEmailDetailed({
    to: input.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: input.professionalEmail,
    attachments: input.resume
      ? [
        {
          filename: format === "docx" ? "curriculo.docx" : "curriculo.pdf",
          content: input.resume,
          contentType: format === "docx" ? DOCX_MIME : "application/pdf",
        },
      ]
      : undefined,
  });

  if (!result.ok) {
    console.error("[candidatura-email] o serviço de e-mail não aceitou o envio");
    return { ok: false, error: SEND_FAILURE };
  }
  return { ok: true };
}

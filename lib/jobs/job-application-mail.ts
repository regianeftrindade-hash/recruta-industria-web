import { sendEmailDetailed } from "@/lib/infra/email";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { isPdfBuffer, RESUME_REQUIRED_MESSAGE, resumePathOwnedBy } from "@/lib/jobs/resume-pdf";
import { downloadPrivateFile, extractStoragePath } from "@/lib/storage/private-uploads";

const SEND_FAILURE = "Não foi possível enviar a candidatura agora. Tente novamente mais tarde.";

export const APPLICATION_EMAIL_SUCCESS =
  "Candidatura enviada com sucesso! Seu currículo foi encaminhado para o processo seletivo desta vaga.";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildApplicationMail(input: {
  jobTitle: string;
  professionalName: string | null;
}): { subject: string; text: string; html: string } {
  const title = input.jobTitle.trim() || "Vaga";
  const name = input.professionalName?.trim() || "Profissional";
  const text = [
    "Olá,",
    "",
    `Você recebeu uma nova candidatura para a vaga de ${title}, divulgada pelo Recruta Indústria.`,
    "",
    `Profissional: ${name}.`,
    "",
    "O currículo do candidato está anexado a este e-mail em formato PDF.",
    "",
    "Atenciosamente,",
    "Recruta Indústria",
  ].join("\n");
  const html = text
    .split("\n")
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br>"))
    .join("");
  return {
    subject: `Candidatura — ${title} — Recruta Indústria`,
    text,
    html,
  };
}

export async function loadOwnedResumePdf(email: string, stored: string | null | undefined): Promise<Buffer> {
  const raw = stored?.trim() || "";
  const path = raw.includes("://") ? extractStoragePath(raw) : raw.replace(/^\/+/, "").split("?")[0];
  if (!path || !resumePathOwnedBy(path, email)) {
    throw new JobPostingError(RESUME_REQUIRED_MESSAGE, 400, "RESUME_REQUIRED");
  }

  let bytes: Buffer | null = null;
  try {
    bytes = await downloadPrivateFile(path);
  } catch {
    console.error("[candidatura-email] falha ao ler o currículo");
    throw new JobPostingError(SEND_FAILURE, 502);
  }

  if (!bytes || !isPdfBuffer(bytes)) {
    throw new JobPostingError(RESUME_REQUIRED_MESSAGE, 400, "RESUME_REQUIRED");
  }
  return bytes;
}

export async function sendJobApplicationEmail(input: {
  to: string;
  jobTitle: string;
  professionalName: string | null;
  professionalEmail: string;
  resume: Buffer;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const mail = buildApplicationMail({
    jobTitle: input.jobTitle,
    professionalName: input.professionalName,
  });
  const result = await sendEmailDetailed({
    to: input.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: input.professionalEmail,
    attachments: [
      {
        filename: "curriculo.pdf",
        content: input.resume,
        contentType: "application/pdf",
      },
    ],
  });

  if (!result.ok) {
    console.error("[candidatura-email] o serviço de e-mail não aceitou o envio");
    return { ok: false, error: SEND_FAILURE };
  }
  return { ok: true };
}

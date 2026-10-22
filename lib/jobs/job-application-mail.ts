import { sendEmailDetailed } from "@/lib/infra/email";
import { JobPostingError } from "@/lib/jobs/job-posting";
import { isPdfBuffer, RESUME_REQUIRED_MESSAGE, resumePathOwnedBy } from "@/lib/jobs/resume-pdf";
import { downloadPrivateFile, extractStoragePath } from "@/lib/storage/private-uploads";

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

export function applicationProfileLines(profile: ApplicationProfileMail): string[] {
  const rows: Array<[string, string | null]> = [
    ["Cargo", profile.cargo],
    ["Área", profile.area],
    ["Local", profile.local],
    ["Escolaridade", profile.escolaridade],
    ["Turno", profile.turno],
    ["Experiência", profile.experiencia],
    ["Empresas em que trabalhou", profile.experiencias],
    ["Recolocação", profile.recolocacao],
    ["Pretensão salarial", profile.pretensaoSalarial],
    ["Habilidades", profile.habilidades],
    ["Apresentação", profile.mensagem],
  ];
  return rows.flatMap(([label, value]) => {
    const text = filled(value);
    return text ? [`${label}: ${text}`] : [];
  });
}

export function buildApplicationMail(input: {
  jobTitle: string;
  professionalName: string | null;
  profile?: ApplicationProfileMail | null;
}): { subject: string; text: string; html: string } {
  const title = input.jobTitle.trim() || "Vaga";
  const name = input.professionalName?.trim() || "Profissional";
  const profileLines = input.profile ? applicationProfileLines(input.profile) : [];
  const profileUrl = filled(input.profile?.profileUrl);
  const body = profileLines.length || profileUrl
    ? [
      "Este profissional não tinha currículo em PDF salvo. O perfil cadastrado no Recruta Indústria segue abaixo.",
      "",
      ...profileLines,
      ...(profileUrl ? ["", `Perfil no site: ${profileUrl}`] : []),
    ]
    : ["O currículo do candidato está anexado a este e-mail em formato PDF."];
  const text = [
    "Olá,",
    "",
    `Você recebeu uma nova candidatura para a vaga de ${title}, divulgada pelo Recruta Indústria.`,
    "",
    `Profissional: ${name}.`,
    "",
    ...body,
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
  resume?: Buffer | null;
  profile?: ApplicationProfileMail | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const mail = buildApplicationMail({
    jobTitle: input.jobTitle,
    professionalName: input.professionalName,
    profile: input.resume ? null : input.profile,
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
          filename: "curriculo.pdf",
          content: input.resume,
          contentType: "application/pdf",
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

import { sendEmailDetailed } from "@/lib/infra/email";
import { publicCompanyLabel } from "@/lib/jobs/job-posting";
import { createSignedMediaUrl, extractStoragePath } from "@/lib/storage/private-uploads";

type ApplicationMailInput = {
  to: string;
  jobTitle: string;
  confidential: boolean;
  companyName: string;
  professionalName: string | null;
  professionalEmail: string;
  profileTitle: string | null;
  resumeUrl: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function resolveResumeLink(storedUrl: string | null | undefined): Promise<string | null> {
  const raw = storedUrl?.trim();
  if (!raw) return null;

  const path = extractStoragePath(raw);
  if (path) {
    try {
      return await createSignedMediaUrl(path);
    } catch {
      return null;
    }
  }

  if (/^https:\/\//i.test(raw)) return raw;
  return null;
}

export async function sendJobApplicationEmail(input: ApplicationMailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.professionalName?.trim() || "Profissional";
  const company = publicCompanyLabel({
    confidential: input.confidential,
    companyName: input.companyName,
  });
  const title = input.jobTitle.trim() || "Vaga";
  const lines = [
    `${name} se candidatou à vaga "${title}" pelo Recruta Indústria.`,
    `Empresa: ${company}`,
    input.profileTitle?.trim() ? `Cargo no perfil: ${input.profileTitle.trim()}` : "",
    `E-mail do profissional: ${input.professionalEmail}`,
    input.resumeUrl ? `Currículo: ${input.resumeUrl}` : "Currículo: não havia arquivo salvo no perfil.",
    "",
    "A resposta pode ser enviada diretamente ao profissional por este e-mail.",
  ].filter(Boolean);

  const text = lines.join("\n");
  const html = lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const result = await sendEmailDetailed({
    to: input.to,
    subject: `Candidatura: ${title}`,
    text,
    html,
    replyTo: input.professionalEmail,
  });

  if (!result.ok) {
    return { ok: false, error: "Não foi possível enviar a candidatura por e-mail. Nada foi registrado." };
  }
  return { ok: true };
}

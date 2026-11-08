import {
  cleanJobText,
  JobPostingError,
  parseApplicationEmail,
  parseApplicationWhatsapp,
  parsePublicationDate,
  parseSalaryToCents,
} from "@/lib/jobs/job-posting";

export type ManualJobDraft = {
  title: string;
  companyName: string;
  workplace: string | null;
  description: string;
  publicationDate: Date;
  salaryCents: number | null;
  salaryNegotiable: boolean;
  applicationEmail: string | null;
  applicationWhatsapp: string | null;
  careOf: string;
  subject: string;
  deadline: string | null;
};

function readObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new JobPostingError("Dados da vaga inválidos.");
  }
  return input as Record<string, unknown>;
}

export function dataDeHojeSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function prazoParaTexto(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new JobPostingError("Informe o prazo no formato correto.");
  }
  const text = value.trim();
  if (!text) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  const year = Number(iso?.[1] ?? br?.[3]);
  const month = Number(iso?.[2] ?? br?.[2]);
  const day = Number(iso?.[3] ?? br?.[1]);
  if (!iso && !br) {
    throw new JobPostingError("Informe o prazo como uma data.");
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new JobPostingError("Informe um prazo válido.");
  }
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/** Campos do cadastro feito na aba de candidaturas manuais. */
export function parseManualJobDraft(input: unknown, now = new Date()): ManualJobDraft {
  const body = readObject(input);
  const title = cleanJobText(body.title ?? "", 160, "O cargo");
  const companyName = cleanJobText(body.companyName ?? "", 160, "O nome da empresa");
  const description = cleanJobText(body.description ?? "", 8000, "A descrição");
  const workplace = cleanJobText(body.workplace ?? "", 120, "O local de trabalho") || null;
  const careOf = cleanJobText(body.careOf ?? "", 80, "O nome de quem recebe");
  const subject = cleanJobText(body.subject ?? "", 120, "O assunto");
  if (title.length < 2) throw new JobPostingError("Informe o cargo da vaga.");
  if (companyName.length < 2) throw new JobPostingError("Informe o nome da empresa.");
  if (description.length < 2) throw new JobPostingError("Escreva a descrição da vaga.");
  if (careOf.length < 2) throw new JobPostingError("Informe aos cuidados de quem o currículo será enviado.");
  if (subject.length < 2) throw new JobPostingError("Informe o assunto do e-mail.");

  const publicationDate = parsePublicationDate(body.publicationDate || dataDeHojeSaoPaulo(now));
  if (!publicationDate) throw new JobPostingError("Informe a data da publicação.");

  const salaryNegotiable = body.salaryNegotiable === true;
  const salaryCents = salaryNegotiable ? null : parseSalaryToCents(typeof body.salary === "string" ? body.salary : "");
  const applicationEmail = parseApplicationEmail(body.applicationEmail);
  const applicationWhatsapp = parseApplicationWhatsapp(body.applicationWhatsapp);
  if (!applicationEmail && !applicationWhatsapp) {
    throw new JobPostingError("Informe o e-mail ou o WhatsApp para onde o currículo será enviado.");
  }

  return {
    title,
    companyName,
    workplace,
    description,
    publicationDate,
    salaryCents,
    salaryNegotiable,
    applicationEmail,
    applicationWhatsapp,
    careOf,
    subject,
    deadline: prazoParaTexto(body.deadline),
  };
}

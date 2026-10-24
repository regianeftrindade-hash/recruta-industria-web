import type { PublicJob } from "@/lib/jobs/job-posting";

export const PUBLIC_SITE_ORIGIN = "https://www.recrutaindustria.com";

const JOB_ID = /^[a-z0-9]{8,40}$/i;

export function publicJobUrl(jobId: string): string {
  return `${PUBLIC_SITE_ORIGIN}/vagas/${jobId}`;
}

export type JobShareSource = {
  id: string;
  title: string;
  companyLabel: string;
  anonymous?: boolean;
  salaryLabel?: string | null;
  contractLabel?: string | null;
  workModeLabel?: string | null;
  workplace?: string | null;
  description?: string | null;
};

const PLACEHOLDER_FACT = /n[aã]o informad|n[aã]o preenchid|^outro$|^-+$|^n\/a$/i;

function cleanFact(value: string | null | undefined): string {
  const text = value?.replace(/\s+/g, " ").trim() || "";
  if (!text || PLACEHOLDER_FACT.test(text)) return "";
  return text;
}

function clipText(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > 24 ? cut.slice(0, space) : cut).trimEnd();
  return `${base}…`;
}

/** Local, salário, modalidade e contrato. Sem “não informado” e sem e-mail ou telefone. */
export function usefulShareFacts(
  job: Pick<JobShareSource, "salaryLabel" | "contractLabel" | "workModeLabel" | "workplace">,
  order: "message" | "card" = "message",
): string[] {
  const workplace = cleanFact(job.workplace);
  const salary = cleanFact(job.salaryLabel);
  const mode = cleanFact(job.workModeLabel);
  const contract = cleanFact(job.contractLabel);
  const items = order === "card"
    ? [workplace, salary, mode, contract]
    : [workplace, mode, contract, salary];
  return items.filter(Boolean);
}

function publicExcerpt(text: string): string {
  const plain = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 90) return plain;
  return `${plain.slice(0, 87).trimEnd()}...`;
}

function limitShareText(text: string, max = 220): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trimEnd()}...`;
}

/** Resumo público: empresa visível, local, contrato e um trecho da descrição. Sem e-mail nem telefone. */
export function jobShareSummary(
  job: Pick<JobShareSource, "companyLabel" | "salaryLabel" | "contractLabel" | "workModeLabel" | "workplace" | "description">,
): string {
  const facts = [cleanFact(job.companyLabel), ...usefulShareFacts(job)].filter(Boolean).join(" · ");
  const excerpt = publicExcerpt(job.description || "");
  if (facts && excerpt) return limitShareText(`${facts}. ${excerpt}`);
  return limitShareText(facts || excerpt);
}

/**
 * Texto do cartão do WhatsApp. O celular mostra poucas letras,
 * então local e salário vêm antes do nome longo da empresa.
 */
export function jobPreviewDescription(
  job: Pick<JobShareSource, "companyLabel" | "salaryLabel" | "contractLabel" | "workModeLabel" | "workplace">,
): string {
  const parts = [...usefulShareFacts(job, "card"), cleanFact(job.companyLabel)].filter(Boolean);
  let line = "";
  for (const part of parts) {
    const next = line ? `${line} · ${part}` : part;
    if (next.length > 110) break;
    line = next;
  }
  return line || "Confira esta oportunidade no Recruta Indústria.";
}

export function jobShareMessage(job: JobShareSource): string {
  const title = job.title.trim() || "Vaga";
  const summary = jobShareSummary(job);
  const url = publicJobUrl(job.id);
  return summary ? `${title}\n${summary}\n${url}` : `${title}\n${url}`;
}

export function whatsAppShareText(job: JobShareSource): string {
  return jobShareMessage(job);
}

export function whatsAppShareUrl(job: JobShareSource): string {
  return `https://wa.me/?text=${encodeURIComponent(jobShareMessage(job))}`;
}

export function facebookShareUrl(jobId: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicJobUrl(jobId))}`;
}

/** O Instagram não aceita um link de compartilhamento. O botão copia a vaga e abre o app. */
export const INSTAGRAM_SHARE_URL = "https://www.instagram.com/";

/** Aceita só o retorno interno da vaga que originou o cadastro. */
export function safeJobReturnPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) return null;
  if (/%2f|%5c/i.test(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw, PUBLIC_SITE_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== PUBLIC_SITE_ORIGIN || url.username || url.password) return null;
  const match = url.pathname.match(/^\/vagas\/([a-z0-9]{8,40})$/i);
  if (!match || !JOB_ID.test(match[1])) return null;

  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== "candidatar")) return null;
  const candidatar = url.searchParams.get("candidatar");
  if (candidatar != null && candidatar !== "1") return null;

  return `/vagas/${match[1]}?candidatar=1`;
}

export function jobSocialMetadata(job: Pick<PublicJob, "title" | "companyLabel" | "description" | "anonymous" | "salaryLabel" | "contractLabel" | "workModeLabel" | "workplace"> & { id?: string }): {
  title: string;
  description: string;
} {
  const title = clipText(job.title.trim() || "Vaga", 70);
  const description = jobPreviewDescription(job);
  return { title, description };
}

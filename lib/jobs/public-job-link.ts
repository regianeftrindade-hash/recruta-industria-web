import type { PublicJob } from "@/lib/jobs/job-posting";

export const PUBLIC_SITE_ORIGIN = "https://www.recrutaindustria.com";

const JOB_ID = /^[a-z0-9]{8,40}$/i;

export function publicJobUrl(jobId: string): string {
  return `${PUBLIC_SITE_ORIGIN}/vagas/${jobId}`;
}

export function whatsAppShareText(title: string, jobId: string): string {
  const cargo = title.trim() || "esta vaga";
  return `Confira esta oportunidade no Recruta Indústria: ${cargo}. Veja os detalhes e saiba como se candidatar: ${publicJobUrl(jobId)}`;
}

export function whatsAppShareUrl(title: string, jobId: string): string {
  return `https://wa.me/?text=${encodeURIComponent(whatsAppShareText(title, jobId))}`;
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

function publicExcerpt(text: string): string {
  const plain = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "")
    .replace(/\+?\d[\d\s().-]{8,}\d/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= 180) return plain;
  return `${plain.slice(0, 177).trimEnd()}...`;
}

export function jobSocialMetadata(job: Pick<PublicJob, "title" | "companyLabel" | "description" | "anonymous">): {
  title: string;
  description: string;
} {
  const title = job.anonymous ? job.title : `${job.title} · ${job.companyLabel}`;
  const excerpt = publicExcerpt(job.description);
  const description = excerpt
    ? `${job.companyLabel}. ${excerpt}`
    : `${job.companyLabel}. Confira esta oportunidade no Recruta Indústria.`;
  return { title, description };
}

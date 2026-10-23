import type { PublicJob } from "@/lib/jobs/job-posting";
import { comparePublicationDateDesc } from "@/lib/jobs/public-job-display";

export type JobMatchProfile = {
  cargos: string[];
  habilidades: string[];
  cidade: string;
  estado: string;
};

export type JobMatch = {
  reasons: string[];
};

const STOP = new Set([
  "para", "com", "sem", "por", "que", "uma", "uns", "umas", "dos", "das", "nos", "nas",
  "pelo", "pela", "como", "mais", "menos", "sobre", "entre", "area", "vaga",
]);

function plain(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tokens(value: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of plain(value).split(/[^a-z0-9]+/)) {
    if (part.length < 4 || STOP.has(part) || seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }
  return out;
}

function uniqueTokens(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    for (const token of tokens(value)) {
      if (seen.has(token)) continue;
      seen.add(token);
      out.push(token);
    }
  }
  return out;
}

/** Correspondência verificável entre o perfil e uma vaga publicada. Sem percentual inventado. */
export function matchPublicJob(profile: JobMatchProfile, job: PublicJob): JobMatch | null {
  const reasons: string[] = [];
  const titleTokens = new Set(tokens(job.title));
  const bodyTokens = new Set(tokens(`${job.title} ${job.description}`));
  const cargoTokens = uniqueTokens(profile.cargos);
  if (cargoTokens.some((token) => titleTokens.has(token))) reasons.push("Cargo compatível");

  const skillTokens = uniqueTokens(profile.habilidades);
  if (skillTokens.some((token) => bodyTokens.has(token))) reasons.push("Habilidades relacionadas");

  const workplace = plain(job.workplace || "");
  const city = plain(profile.cidade.trim());
  const state = profile.estado.trim().toUpperCase();
  const cityMatches = city.length >= 3 && workplace.includes(city);
  const stateMatches = /^[A-Z]{2}$/.test(state) && new RegExp(`(^|[^A-Z])${state}([^A-Z]|$)`, "i").test(job.workplace || "");
  if (cityMatches || stateMatches) reasons.push("Na sua região");

  return reasons.length ? { reasons } : null;
}

export function rankCompatibleJobs<T extends PublicJob>(
  profile: JobMatchProfile,
  jobs: T[],
  limit = 8,
): Array<T & { reasons: string[] }> {
  return jobs
    .flatMap((job) => {
      const match = matchPublicJob(profile, job);
      return match ? [{ ...job, reasons: match.reasons }] : [];
    })
    .sort((a, b) => comparePublicationDateDesc(a.publicationDate, b.publicationDate))
    .slice(0, limit);
}

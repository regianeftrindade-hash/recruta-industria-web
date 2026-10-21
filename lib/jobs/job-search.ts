import { Prisma } from "@prisma/client";
import { CONTRACT_TYPES, WORK_MODES } from "@/lib/jobs/job-posting";

const CONTRACT_VALUES = new Set<string>(CONTRACT_TYPES.map((item) => item.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((item) => item.value));

export type SalaryFilter = "" | "negociavel" | "informado";

export type JobSearchFilters = {
  q: string;
  contractType: string | null;
  workMode: string | null;
  workplace: string;
  salary: SalaryFilter;
  publishedFrom: Date | null;
  publishedTo: Date | null;
};

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function parseDay(value: string): Date | null {
  const raw = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function read(source: URLSearchParams | Record<string, string | undefined>, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) || "";
  return source[key] || "";
}

export function parseJobSearch(source: URLSearchParams | Record<string, string | undefined>): JobSearchFilters {
  const contract = read(source, "contrato");
  const mode = read(source, "modalidade");
  const salaryRaw = read(source, "salario");
  let publishedFrom = parseDay(read(source, "de"));
  let publishedTo = parseDay(read(source, "ate"));
  if (publishedFrom && publishedTo && publishedFrom > publishedTo) {
    const swap = publishedFrom;
    publishedFrom = publishedTo;
    publishedTo = swap;
  }

  return {
    q: clip(read(source, "q"), 80),
    contractType: CONTRACT_VALUES.has(contract) ? contract : null,
    workMode: WORK_MODE_VALUES.has(mode) ? mode : null,
    workplace: clip(read(source, "local"), 120),
    salary: salaryRaw === "negociavel" || salaryRaw === "informado" ? salaryRaw : "",
    publishedFrom,
    publishedTo,
  };
}

/** A busca pelo nome da empresa ignora vagas confidenciais. */
export function publicJobWhere(filters: JobSearchFilters): Prisma.JobPostingWhereInput {
  const and: Prisma.JobPostingWhereInput[] = [{ status: "PUBLISHED" }];

  if (filters.contractType) and.push({ contractType: filters.contractType });
  if (filters.workMode) and.push({ workMode: filters.workMode });
  if (filters.workplace) {
    and.push({ workplace: { contains: filters.workplace, mode: "insensitive" } });
  }
  if (filters.salary === "negociavel") and.push({ salaryNegotiable: true });
  if (filters.salary === "informado") {
    and.push({ salaryNegotiable: false, salaryCents: { not: null } });
  }
  if (filters.publishedFrom || filters.publishedTo) {
    and.push({
      publicationDate: {
        ...(filters.publishedFrom ? { gte: filters.publishedFrom } : {}),
        ...(filters.publishedTo ? { lte: filters.publishedTo } : {}),
      },
    });
  }
  if (filters.q) {
    const text = { contains: filters.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { title: text },
        { description: text },
        { workplace: text },
        { confidential: false, companyName: text },
      ],
    });
  }

  return { AND: and };
}

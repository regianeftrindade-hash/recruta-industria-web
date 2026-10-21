import { Prisma } from "@prisma/client";
import { CONTRACT_TYPES, WORK_MODES } from "@/lib/jobs/job-posting";

const CONTRACT_VALUES = new Set<string>(CONTRACT_TYPES.map((item) => item.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((item) => item.value));
const PERIODS = new Set(["24h", "7", "15", "30"]);
const UF_CODES = new Set([
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
]);

export type SalaryFilter = "" | "negociavel" | "informado";
export type PeriodFilter = "" | "24h" | "7" | "15" | "30";

export type JobSearchFilters = {
  q: string;
  contractType: string | null;
  workMode: string | null;
  workplace: string;
  city: string;
  state: string;
  salary: SalaryFilter;
  salaryMinCents: number | null;
  salaryMaxCents: number | null;
  period: PeriodFilter;
  publishedFrom: Date | null;
  publishedTo: Date | null;
};

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function read(source: URLSearchParams | Record<string, string | undefined>, key: string): string {
  if (source instanceof URLSearchParams) return source.get(key) || "";
  return source[key] || "";
}

function parseDay(value: string): Date | null {
  const raw = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseReaisToCents(value: string): number | null {
  const raw = value.trim().replace(/\s/g, "");
  if (!raw) return null;
  let normalized = raw;
  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return null;
  return Math.round(amount * 100);
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function parseJobSearch(source: URLSearchParams | Record<string, string | undefined>): JobSearchFilters {
  const contract = read(source, "contrato");
  const mode = read(source, "modalidade");
  const salaryRaw = read(source, "salario");
  const periodRaw = read(source, "periodo");
  let publishedFrom = parseDay(read(source, "de"));
  let publishedTo = parseDay(read(source, "ate"));
  if (publishedFrom && publishedTo && publishedFrom > publishedTo) {
    const swap = publishedFrom;
    publishedFrom = publishedTo;
    publishedTo = swap;
  }
  let salaryMinCents = parseReaisToCents(read(source, "minimo"));
  let salaryMaxCents = parseReaisToCents(read(source, "maximo"));
  if (salaryMinCents != null && salaryMaxCents != null && salaryMinCents > salaryMaxCents) {
    const swap = salaryMinCents;
    salaryMinCents = salaryMaxCents;
    salaryMaxCents = swap;
  }

  return {
    q: clip(read(source, "q"), 80),
    contractType: CONTRACT_VALUES.has(contract) ? contract : null,
    workMode: WORK_MODE_VALUES.has(mode) ? mode : null,
    workplace: clip(read(source, "local"), 120),
    city: clip(read(source, "cidade"), 80),
    state: clip(read(source, "estado"), 40),
    salary: salaryRaw === "negociavel" || salaryRaw === "informado" ? salaryRaw : "",
    salaryMinCents,
    salaryMaxCents,
    period: PERIODS.has(periodRaw) ? periodRaw as PeriodFilter : "",
    publishedFrom,
    publishedTo,
  };
}

function stateClause(state: string): Prisma.JobPostingWhereInput {
  const code = state.toUpperCase();
  if (UF_CODES.has(code)) {
    return {
      OR: [
        { workplace: { contains: `/${code}`, mode: "insensitive" } },
        { workplace: { contains: `-${code}`, mode: "insensitive" } },
        { workplace: { contains: `, ${code}`, mode: "insensitive" } },
        { workplace: { contains: ` ${code}`, mode: "insensitive" } },
        { workplace: { equals: code, mode: "insensitive" } },
      ],
    };
  }
  return { workplace: { contains: state, mode: "insensitive" } };
}

/** A busca pelo nome da empresa ignora vagas confidenciais. */
export function publicJobWhere(filters: JobSearchFilters, now = new Date()): Prisma.JobPostingWhereInput {
  const and: Prisma.JobPostingWhereInput[] = [{ status: "PUBLISHED" }];

  if (filters.contractType) and.push({ contractType: filters.contractType });
  if (filters.workMode) and.push({ workMode: filters.workMode });
  if (filters.workplace) {
    and.push({ workplace: { contains: filters.workplace, mode: "insensitive" } });
  }
  if (filters.city) {
    and.push({ workplace: { contains: filters.city, mode: "insensitive" } });
  }
  if (filters.state) and.push(stateClause(filters.state));
  if (filters.salary === "negociavel") and.push({ salaryNegotiable: true });
  if (filters.salary === "informado") {
    and.push({ salaryNegotiable: false, salaryCents: { not: null } });
  }
  if (filters.salaryMinCents != null || filters.salaryMaxCents != null) {
    and.push({
      salaryNegotiable: false,
      salaryCents: {
        not: null,
        ...(filters.salaryMinCents != null ? { gte: filters.salaryMinCents } : {}),
        ...(filters.salaryMaxCents != null ? { lte: filters.salaryMaxCents } : {}),
      },
    });
  }
  if (filters.period === "24h") {
    and.push({ publishedAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } });
  } else if (filters.period === "7" || filters.period === "15" || filters.period === "30") {
    const days = Number(filters.period);
    const start = utcDay(now);
    start.setUTCDate(start.getUTCDate() - days);
    and.push({ publicationDate: { gte: start } });
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

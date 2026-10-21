export const CONTRACT_TYPES = [
  { value: "CLT", label: "CLT" },
  { value: "PJ", label: "PJ" },
  { value: "ESTAGIO", label: "Estágio" },
  { value: "TEMPORARIO", label: "Temporário" },
  { value: "APRENDIZ", label: "Aprendiz" },
  { value: "FREELANCER", label: "Freelancer" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const WORK_MODES = [
  { value: "HOME_OFFICE", label: "Home office" },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "HIBRIDO", label: "Híbrido" },
] as const;

export const JOB_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];
export type WorkMode = (typeof WORK_MODES)[number]["value"];
export type JobStatus = (typeof JOB_STATUSES)[number];

const CONTRACT_VALUES = new Set<string>(CONTRACT_TYPES.map((item) => item.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((item) => item.value));
const STATUS_VALUES = new Set<string>(JOB_STATUSES);

const LIMITS = {
  companyName: 160,
  title: 160,
  contractTypeOther: 80,
  description: 8000,
  observations: 4000,
  applicationInstructions: 2000,
} as const;

export class JobPostingError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "JobPostingError";
    this.status = status;
  }
}

export type JobRecord = {
  id: string;
  companyName: string;
  confidential: boolean;
  publicationDate: Date | null;
  title: string;
  salaryCents: number | null;
  salaryNegotiable: boolean;
  contractType: string | null;
  contractTypeOther: string | null;
  workMode: string | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
  status: string;
  origin: string;
  companyUserId: string | null;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  applicationCount?: number;
};

export type PublicJob = {
  id: string;
  companyLabel: string;
  publicationDate: string | null;
  title: string;
  salaryLabel: string | null;
  contractLabel: string | null;
  workModeLabel: string | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
};

export type AdminJob = PublicJob & {
  companyName: string;
  confidential: boolean;
  publicationDateInput: string;
  salaryInput: string;
  salaryNegotiable: boolean;
  contractType: string;
  contractTypeOther: string;
  workMode: string;
  status: JobStatus;
  statusLabel: string;
  origin: string;
  originLabel: string;
  companyUserId: string | null;
  applicationCount: number;
  publicPath: string | null;
  closedAt: string | null;
};

export type JobWriteData = {
  companyName: string;
  confidential: boolean;
  publicationDate: Date | null;
  title: string;
  salaryCents: number | null;
  salaryNegotiable: boolean;
  contractType: ContractType | null;
  contractTypeOther: string | null;
  workMode: WorkMode | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
  status: JobStatus;
};

const STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicada",
  UNPUBLISHED: "Despublicada",
  CLOSED: "Encerrada",
};

export function jobStatusLabel(status: string): string {
  if (isJobStatus(status)) return STATUS_LABELS[status];
  return status;
}

export function jobOriginLabel(origin: string): string {
  if (origin === "COMPANY") return "Publicada pela empresa";
  return "Cadastrada pelo administrador";
}

export function isJobStatus(value: string): value is JobStatus {
  return STATUS_VALUES.has(value);
}

export function cleanJobText(value: unknown, max: number, label: string): string {
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new JobPostingError(`${label} inválido.`);
  }

  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();

  if (cleaned.length > max) {
    throw new JobPostingError(`${label} pode ter no máximo ${max} caracteres.`);
  }

  return cleaned;
}

export function parsePublicationDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new JobPostingError("Informe a data da vaga no formato correto.");
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 2000 || year > 2100) {
    throw new JobPostingError("Informe um ano válido para a data da vaga.");
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    throw new JobPostingError("Informe uma data da vaga válida.");
  }

  return date;
}

export function formatPublicationDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${year}-${month}-${day}`;
}

export function parseSalaryToCents(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new JobPostingError("Informe o salário em reais.");
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/r\$/gi, "").replace(/\s/g, "");

  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new JobPostingError("Informe o salário em reais, por exemplo 3500 ou 3.500,00.");
  }

  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new JobPostingError("O salário precisa ser maior que zero.");
  }
  if (amount > 10_000_000) {
    throw new JobPostingError("O salário informado passou do limite aceito.");
  }

  return Math.round(amount * 100);
}

export function formatSalaryFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function salaryInputFromCents(cents: number | null): string {
  if (cents == null) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function contractLabel(type: string | null, other: string | null): string | null {
  if (!type) return null;
  if (type === "OUTRO") {
    const custom = other?.trim();
    return custom || "Outro";
  }
  return CONTRACT_TYPES.find((item) => item.value === type)?.label ?? null;
}

export function workModeLabel(mode: string | null): string | null {
  if (!mode) return null;
  return WORK_MODES.find((item) => item.value === mode)?.label ?? null;
}

export function publicCompanyLabel(job: { confidential: boolean; companyName: string }): string {
  if (job.confidential) return "Empresa confidencial";
  const name = job.companyName.trim();
  return name || "Empresa";
}

export function publicSalaryLabel(job: {
  salaryNegotiable: boolean;
  salaryCents: number | null;
}): string | null {
  if (job.salaryNegotiable) return "A combinar";
  if (job.salaryCents == null) return null;
  return formatSalaryFromCents(job.salaryCents);
}

export function toPublicJob(job: JobRecord): PublicJob {
  return {
    id: job.id,
    companyLabel: publicCompanyLabel(job),
    publicationDate: formatPublicationDate(job.publicationDate),
    title: job.title,
    salaryLabel: publicSalaryLabel(job),
    contractLabel: contractLabel(job.contractType, job.contractTypeOther),
    workModeLabel: workModeLabel(job.workMode),
    description: job.description,
    observations: job.observations?.trim() ? job.observations : null,
    applicationInstructions: job.applicationInstructions?.trim()
      ? job.applicationInstructions
      : null,
  };
}

export function toAdminJob(job: JobRecord): AdminJob {
  const status = isJobStatus(job.status) ? job.status : "DRAFT";
  const publicJob = toPublicJob(job);

  return {
    ...publicJob,
    companyLabel: job.confidential ? "Empresa confidencial" : publicJob.companyLabel,
    companyName: job.companyName,
    confidential: job.confidential,
    publicationDateInput: toDateInputValue(job.publicationDate),
    salaryInput: job.salaryNegotiable ? "" : salaryInputFromCents(job.salaryCents),
    salaryNegotiable: job.salaryNegotiable,
    contractType: job.contractType ?? "",
    contractTypeOther: job.contractTypeOther ?? "",
    workMode: job.workMode ?? "",
    status,
    statusLabel: jobStatusLabel(status),
    origin: job.origin,
    originLabel: jobOriginLabel(job.origin),
    companyUserId: job.companyUserId,
    applicationCount: job.applicationCount ?? 0,
    publicPath: status === "PUBLISHED" ? `/vagas/${job.id}` : null,
    closedAt: job.closedAt ? job.closedAt.toISOString() : null,
  };
}

function readObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new JobPostingError("Dados da vaga inválidos.");
  }
  return input as Record<string, unknown>;
}

function optionalBlank(value: string): string | null {
  return value ? value : null;
}

export function parseJobWrite(input: unknown): JobWriteData {
  const body = readObject(input);
  const confidential = body.confidential === true;
  const salaryNegotiable = body.salaryNegotiable === true;
  const companyName = cleanJobText(body.companyName ?? "", LIMITS.companyName, "O nome da empresa");
  const title = cleanJobText(body.title ?? "", LIMITS.title, "O cargo");
  const description = cleanJobText(body.description ?? "", LIMITS.description, "A descrição");
  const observations = optionalBlank(
    cleanJobText(body.observations ?? "", LIMITS.observations, "As observações"),
  );
  const applicationInstructions = optionalBlank(
    cleanJobText(
      body.applicationInstructions ?? "",
      LIMITS.applicationInstructions,
      "As instruções de candidatura",
    ),
  );
  const publicationDate = parsePublicationDate(body.publicationDate ?? null);

  const contractRaw = typeof body.contractType === "string" ? body.contractType.trim() : "";
  if (contractRaw && !CONTRACT_VALUES.has(contractRaw)) {
    throw new JobPostingError("Selecione um tipo de contratação válido.");
  }
  const contractType = (contractRaw || null) as ContractType | null;
  const contractTypeOther = optionalBlank(
    cleanJobText(body.contractTypeOther ?? "", LIMITS.contractTypeOther, "O tipo de contratação"),
  );

  const workRaw = typeof body.workMode === "string" ? body.workMode.trim() : "";
  if (workRaw && !WORK_MODE_VALUES.has(workRaw)) {
    throw new JobPostingError("Selecione uma modalidade de trabalho válida.");
  }
  const workMode = (workRaw || null) as WorkMode | null;

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "DRAFT";
  if (!isJobStatus(statusRaw)) {
    throw new JobPostingError("Situação da vaga inválida.");
  }

  let salaryCents: number | null = null;
  if (!salaryNegotiable) {
    salaryCents = parseSalaryToCents(typeof body.salary === "string" ? body.salary : "");
  }

  if (!title) {
    throw new JobPostingError("Informe o cargo da vaga.");
  }

  if (statusRaw === "PUBLISHED") {
    if (!confidential && !companyName) {
      throw new JobPostingError("Informe o nome da empresa ou marque a vaga como confidencial.");
    }
    if (!publicationDate) {
      throw new JobPostingError("Informe a data da vaga para publicar.");
    }
    if (!contractType) {
      throw new JobPostingError("Selecione o tipo de contratação.");
    }
    if (contractType === "OUTRO" && !contractTypeOther) {
      throw new JobPostingError("Informe qual é o tipo de contratação em Outro.");
    }
    if (!workMode) {
      throw new JobPostingError("Selecione a modalidade de trabalho.");
    }
    if (!description) {
      throw new JobPostingError("Descreva a vaga antes de publicar.");
    }
  }

  if (contractType !== "OUTRO") {
    return {
      companyName,
      confidential,
      publicationDate,
      title,
      salaryCents,
      salaryNegotiable,
      contractType,
      contractTypeOther: null,
      workMode,
      description,
      observations,
      applicationInstructions,
      status: statusRaw,
    };
  }

  return {
    companyName,
    confidential,
    publicationDate,
    title,
    salaryCents,
    salaryNegotiable,
    contractType,
    contractTypeOther,
    workMode,
    description,
    observations,
    applicationInstructions,
    status: statusRaw,
  };
}

export function isProfessionalAccount(user: {
  role: string;
  hasProfessional: boolean;
  hasCompany: boolean;
}): boolean {
  if (user.role === "COMPANY" || user.hasCompany) return false;
  return user.role === "PROFESSIONAL" || user.hasProfessional;
}

/** Empresa só consulta candidaturas da vaga vinculada à própria conta. */
export function companyCanReadJobApplications(
  job: { companyUserId: string | null },
  companyOwnerUserId: string,
): boolean {
  return Boolean(job.companyUserId) && job.companyUserId === companyOwnerUserId;
}

export function assertJobId(id: string): string {
  if (!/^[a-z0-9]{8,40}$/i.test(id)) {
    throw new JobPostingError("Vaga não encontrada.", 404);
  }
  return id;
}

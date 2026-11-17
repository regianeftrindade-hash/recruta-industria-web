import { normalizePhoneE164 } from "@/lib/notifications/sanitize";
import { publicJobCopy, statedJobFact } from "@/lib/jobs/public-job-display";
import { formatMoney, isIsoCurrency } from "@/lib/money/format-money";
import { uiIntlLocale } from "@/lib/i18n/format-ui";
import { t } from "@/lib/i18n/translate";

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

export const APPLICATION_STAGES = [
  { value: "NEW", label: "Novo candidato" },
  { value: "REVIEW", label: "Em análise" },
  { value: "INTERVIEW", label: "Entrevista" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Reprovado" },
] as const;

export const APPLICATION_MODES = [
  { value: "EMAIL", label: "Candidatura por e-mail" },
  { value: "WHATSAPP", label: "Candidatura por WhatsApp" },
  { value: "EXTERNAL", label: "Candidatura pelo site da empresa" },
  { value: "INTERNAL", label: "Candidatura pelo Recruta Indústria" },
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number]["value"];
export type WorkMode = (typeof WORK_MODES)[number]["value"];
export type JobStatus = (typeof JOB_STATUSES)[number];
export type ApplicationMode = (typeof APPLICATION_MODES)[number]["value"];
export type ApplicationStage = (typeof APPLICATION_STAGES)[number]["value"];

const CONTRACT_VALUES = new Set<string>(CONTRACT_TYPES.map((item) => item.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((item) => item.value));
const STATUS_VALUES = new Set<string>(JOB_STATUSES);
const APPLICATION_MODE_VALUES = new Set<string>(APPLICATION_MODES.map((item) => item.value));
const APPLICATION_STAGE_VALUES = new Set<string>(APPLICATION_STAGES.map((item) => item.value));

const LIMITS = {
  companyName: 160,
  title: 160,
  contractTypeOther: 80,
  description: 8000,
  observations: 4000,
  applicationInstructions: 2000,
  externalApplyUrl: 500,
  applicationEmail: 254,
  applicationWhatsapp: 20,
  workplace: 120,
} as const;

export class JobPostingError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = "JobPostingError";
    this.status = status;
    this.code = code;
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
  /** ISO 4217. Ausente significa BRL, o padrão da vaga. */
  currency?: string;
  contractType: string | null;
  contractTypeOther: string | null;
  workMode: string | null;
  workplace: string | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
  applicationMode: string;
  externalApplyUrl: string | null;
  applicationEmail: string | null;
  applicationWhatsapp: string | null;
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
  anonymous: boolean;
  companyLabel: string;
  publicationDate: string | null;
  title: string;
  salaryLabel: string | null;
  contractLabel: string | null;
  workModeLabel: string | null;
  workplace: string | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
  applicationMode: ApplicationMode;
  externalApplyUrl: string | null;
  /** ADMIN = publicada pelo Recruta | COMPANY = publicada pela empresa */
  origin: "ADMIN" | "COMPANY";
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
  workplace: string;
  applicationMode: ApplicationMode;
  externalApplyUrl: string;
  applicationEmail: string;
  applicationWhatsapp: string;
  status: JobStatus;
  statusLabel: string;
  origin: string;
  originLabel: string;
  companyUserId: string | null;
  applicationCount: number;
  publicPath: string | null;
  closedAt: string | null;
};

/** Candidatura do próprio profissional. Não inclui o nome real de vaga confidencial. */
export type OwnJobApplicationView = {
  id: string;
  jobId: string;
  stage: string;
  stageLabel: string;
  appliedAt: string;
  title: string;
  companyLabel: string;
  status: string;
  statusLabel: string;
  workplace: string | null;
  contractLabel: string | null;
  workModeLabel: string | null;
  salaryLabel: string | null;
  open: boolean;
};

export type JobWriteData = {
  companyName: string;
  confidential: boolean;
  publicationDate: Date | null;
  title: string;
  salaryCents: number | null;
  salaryNegotiable: boolean;
  currency: string;
  contractType: ContractType | null;
  contractTypeOther: string | null;
  workMode: WorkMode | null;
  workplace: string | null;
  description: string;
  observations: string | null;
  applicationInstructions: string | null;
  applicationMode: ApplicationMode;
  externalApplyUrl: string | null;
  applicationEmail: string | null;
  applicationWhatsapp: string | null;
  status: JobStatus;
};

const STATUS_KEYS: Record<JobStatus, "surface.jobs.statusDraft" | "surface.jobs.statusPublished" | "surface.jobs.statusUnpublished" | "surface.jobs.statusClosed"> = {
  DRAFT: "surface.jobs.statusDraft",
  PUBLISHED: "surface.jobs.statusPublished",
  UNPUBLISHED: "surface.jobs.statusUnpublished",
  CLOSED: "surface.jobs.statusClosed",
};

export function jobStatusLabel(status: string): string {
  if (isJobStatus(status)) return t(STATUS_KEYS[status]);
  return status;
}

export function jobOriginLabel(origin: string): string {
  if (origin === "COMPANY") return t("surface.jobs.originCompany");
  return t("surface.jobs.originAdmin");
}

export function isJobStatus(value: string): value is JobStatus {
  return STATUS_VALUES.has(value);
}

export function isApplicationMode(value: string): value is ApplicationMode {
  return APPLICATION_MODE_VALUES.has(value);
}

export function isApplicationStage(value: string): value is ApplicationStage {
  return APPLICATION_STAGE_VALUES.has(value);
}

export function parseApplicationStage(value: unknown): ApplicationStage {
  const stage = typeof value === "string" ? value.trim() : "";
  if (!isApplicationStage(stage)) {
    throw new JobPostingError("Selecione uma etapa válida do processo seletivo.");
  }
  return stage;
}

const STAGE_KEYS = {
  NEW: "surface.jobs.stageNew",
  REVIEW: "surface.jobs.stageReview",
  INTERVIEW: "surface.jobs.stageInterview",
  APPROVED: "surface.jobs.stageApproved",
  REJECTED: "surface.jobs.stageRejected",
} as const;

export function applicationStageLabel(stage: string): string {
  if (stage in STAGE_KEYS) return t(STAGE_KEYS[stage as keyof typeof STAGE_KEYS]);
  return t("surface.jobs.stageNew");
}

export function parseExternalApplyUrl(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new JobPostingError("O link de candidatura é inválido.");
  }
  const text = value.trim();
  if (!text) return null;
  if (text.length > LIMITS.externalApplyUrl) {
    throw new JobPostingError(`O link de candidatura pode ter no máximo ${LIMITS.externalApplyUrl} caracteres.`);
  }
  if (/[<>]/.test(text) || /\s/.test(text)) {
    throw new JobPostingError("Informe um link HTTP ou HTTPS válido.");
  }

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new JobPostingError("Informe um link HTTP ou HTTPS válido.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new JobPostingError("O link de candidatura precisa começar com http:// ou https://.");
  }
  if (!url.hostname || url.username || url.password) {
    throw new JobPostingError("Informe um link HTTP ou HTTPS válido.");
  }

  return url.toString();
}

export function parseApplicationEmail(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new JobPostingError("O e-mail para candidaturas é inválido.");
  }
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (email.length > LIMITS.applicationEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new JobPostingError("Informe um e-mail válido para receber as candidaturas.");
  }
  return email;
}

export function parseApplicationWhatsapp(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") {
    throw new JobPostingError("O WhatsApp para candidaturas é inválido.");
  }
  const text = value.trim();
  if (!text) return null;
  if (text.length > 40) {
    throw new JobPostingError("Informe um WhatsApp válido com DDD.");
  }
  const digits = text.replace(/\D/g, "");
  // Alguns anúncios trazem o DDD seguido de 10 dígitos.
  if (digits.length === 12 && !digits.startsWith("55")) return digits;
  const phone = normalizePhoneE164(text);
  if (!phone) {
    throw new JobPostingError("Informe um WhatsApp válido com DDD, por exemplo (11) 98888-7777.");
  }
  return phone;
}

/** Número legível para o profissional copiar. Não inclui outros contatos da vaga. */
export function formatWhatsappDisplay(stored: string): string {
  const digits = stored.replace(/\D/g, "");
  const national = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (national.length === 11) {
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 7)}-${national.slice(7)}`;
  }
  if (national.length === 10) {
    return `+55 (${national.slice(0, 2)}) ${national.slice(2, 6)}-${national.slice(6)}`;
  }
  if (national.length === 12 && !national.startsWith("55")) {
    return `(${national.slice(0, 2)}) ${national.slice(2, 8)}-${national.slice(8)}`;
  }
  return digits ? `+${digits}` : stored.trim();
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
  return new Intl.DateTimeFormat(uiIntlLocale(), {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return "";
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${year}-${month}-${day}`;
}

function isBrazilianMoneyInput(currency: string, locale: string): boolean {
  return currency.trim().toUpperCase() === "BRL" && locale.trim().toLowerCase().startsWith("pt");
}

/** Centavos do texto digitado. BRL e pt-BR seguem o cadastro atual, sem cotação. */
export function parseSalaryToCents(
  value: unknown,
  currency = "BRL",
  locale = "pt-BR",
): number | null {
  if (isBrazilianMoneyInput(currency, locale)) {
    return parseBrazilianSalaryToCents(value);
  }
  return parseLocalizedSalaryToCents(value, locale);
}

function parseBrazilianSalaryToCents(value: unknown): number | null {
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

function parseLocalizedSalaryToCents(value: unknown, locale: string): number | null {
  if (value == null) return null;
  if (typeof value !== "string") {
    throw new JobPostingError("Informe o salário.");
  }
  const trimmed = value.trim();
  if (!trimmed) return null;

  const sample = new Intl.NumberFormat(locale).formatToParts(1000.1);
  const group = sample.find((part) => part.type === "group")?.value ?? "";
  const decimal = sample.find((part) => part.type === "decimal")?.value ?? ".";
  let normalized = trimmed.replace(/[^\d.,\s]/g, "").replace(/\s/g, "");
  if (decimal && normalized.includes(decimal)) {
    const splitAt = normalized.lastIndexOf(decimal);
    const whole = group ? normalized.slice(0, splitAt).split(group).join("") : normalized.slice(0, splitAt);
    const fraction = normalized.slice(splitAt + decimal.length);
    normalized = `${whole}.${fraction}`;
  } else if (group) {
    normalized = normalized.split(group).join("");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new JobPostingError("Informe o salário, por exemplo 3500 ou 3.500,00.");
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

/** Moeda da vaga. Ausente vira BRL. Código inválido é recusado no cadastro e ignorado na leitura. */
export function normalizeJobCurrency(value: unknown, mode: "read" | "write" = "read"): string {
  if (value == null || (typeof value === "string" && !value.trim())) return "BRL";
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (isIsoCurrency(code)) return code;
  if (mode === "write") {
    throw new JobPostingError("Informe uma moeda válida, como BRL.");
  }
  return "BRL";
}

/** Atualização que não envia currency conserva a moeda já gravada na vaga. */
export function currencyPatch(input: unknown, currency: string): { currency?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { currency };
  if (!("currency" in input)) return {};
  return { currency };
}

export function formatSalaryFromCents(cents: number, currency = "BRL", locale?: string): string {
  return formatMoney(cents, normalizeJobCurrency(currency), locale || uiIntlLocale());
}

export function salaryInputFromCents(cents: number | null): string {
  if (cents == null) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const CONTRACT_KEYS = {
  CLT: "surface.jobs.clt",
  PJ: "surface.jobs.pj",
  ESTAGIO: "surface.jobs.intern",
  TEMPORARIO: "surface.jobs.temporary",
  APRENDIZ: "surface.jobs.apprentice",
  FREELANCER: "surface.jobs.freelancer",
  OUTRO: "surface.jobs.other",
} as const;

const WORK_MODE_KEYS = {
  HOME_OFFICE: "surface.jobs.homeOffice",
  PRESENCIAL: "surface.jobs.onSite",
  HIBRIDO: "surface.jobs.hybrid",
} as const;

export function contractLabel(type: string | null, other: string | null): string | null {
  if (!type) return null;
  if (type === "OUTRO") {
    const custom = other?.trim();
    if (!custom || /n[aã]o informad|n[aã]o preenchid/i.test(custom)) return null;
    return custom;
  }
  if (type in CONTRACT_KEYS) return t(CONTRACT_KEYS[type as keyof typeof CONTRACT_KEYS]);
  return null;
}

export function workModeLabel(mode: string | null): string | null {
  if (!mode || !(mode in WORK_MODE_KEYS)) return null;
  return t(WORK_MODE_KEYS[mode as keyof typeof WORK_MODE_KEYS]);
}

export function publicCompanyLabel(job: { confidential: boolean; companyName: string }): string {
  if (job.confidential) return t("surface.jobs.confidentialCompany");
  const name = job.companyName.trim();
  return name || t("surface.jobs.companyFallback");
}

export function publicSalaryLabel(job: {
  salaryNegotiable: boolean;
  salaryCents: number | null;
  currency?: string | null;
}): string | null {
  if (job.salaryNegotiable) return t("surface.jobs.salaryAgree");
  if (job.salaryCents == null) return null;
  return formatSalaryFromCents(job.salaryCents, job.currency || "BRL");
}

export function toPublicJob(job: JobRecord): PublicJob {
  return {
    id: job.id,
    anonymous: job.confidential,
    companyLabel: publicCompanyLabel(job),
    publicationDate: formatPublicationDate(job.publicationDate),
    title: job.title,
    salaryLabel: publicSalaryLabel(job),
    contractLabel: contractLabel(job.contractType, job.contractTypeOther),
    workModeLabel: workModeLabel(job.workMode),
    workplace: statedJobFact(job.workplace),
    description: publicJobCopy(job.description) ?? "",
    observations: publicJobCopy(job.observations),
    applicationInstructions: publicJobCopy(job.applicationInstructions),
    applicationMode: isApplicationMode(job.applicationMode) ? job.applicationMode : "INTERNAL",
    externalApplyUrl:
      job.applicationMode === "EXTERNAL" && job.externalApplyUrl
        ? job.externalApplyUrl
        : null,
    origin: job.origin === "COMPANY" ? "COMPANY" : "ADMIN",
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
    workplace: job.workplace ?? "",
    applicationMode: isApplicationMode(job.applicationMode) ? job.applicationMode : "INTERNAL",
    externalApplyUrl: job.externalApplyUrl ?? "",
    applicationEmail: job.applicationEmail ?? "",
    applicationWhatsapp: job.applicationWhatsapp
      ? formatWhatsappDisplay(job.applicationWhatsapp)
      : "",
    status,
    statusLabel: jobStatusLabel(status),
    origin: job.origin === "COMPANY" ? "COMPANY" : "ADMIN",
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
  const workplace = optionalBlank(
    cleanJobText(body.workplace ?? "", LIMITS.workplace, "O local de trabalho"),
  );

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "DRAFT";
  if (!isJobStatus(statusRaw)) {
    throw new JobPostingError("Situação da vaga inválida.");
  }

  const modeRaw = typeof body.applicationMode === "string" ? body.applicationMode.trim() : "";
  if (modeRaw && !isApplicationMode(modeRaw)) {
    throw new JobPostingError("Selecione uma modalidade de candidatura.");
  }
  const applicationMode: ApplicationMode = modeRaw && isApplicationMode(modeRaw) ? modeRaw : "INTERNAL";

  const externalApplyUrl = applicationMode === "EXTERNAL"
    ? parseExternalApplyUrl(body.externalApplyUrl)
    : null;
  const applicationEmail = applicationMode === "EMAIL"
    ? parseApplicationEmail(body.applicationEmail)
    : null;
  const applicationWhatsapp = applicationMode === "WHATSAPP"
    ? parseApplicationWhatsapp(body.applicationWhatsapp)
    : null;

  if (statusRaw === "PUBLISHED" && applicationMode === "EXTERNAL" && !externalApplyUrl) {
    throw new JobPostingError("Informe o link oficial para candidatura no site da empresa.");
  }
  if (statusRaw === "PUBLISHED" && applicationMode === "EMAIL" && !applicationEmail) {
    throw new JobPostingError("Informe o e-mail da empresa para receber as candidaturas.");
  }
  if (statusRaw === "PUBLISHED" && applicationMode === "WHATSAPP" && !applicationWhatsapp) {
    throw new JobPostingError("Informe o WhatsApp da empresa para receber as candidaturas.");
  }

  const currency = normalizeJobCurrency(body.currency, "write");
  let salaryCents: number | null = null;
  if (!salaryNegotiable) {
    salaryCents = parseSalaryToCents(
      typeof body.salary === "string" ? body.salary : "",
      currency,
      "pt-BR",
    );
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
      currency,
      contractType,
      contractTypeOther: null,
      workMode,
      workplace,
      description,
      observations,
      applicationInstructions,
      applicationMode,
      externalApplyUrl,
      applicationEmail,
      applicationWhatsapp,
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
    currency,
    contractType,
    contractTypeOther,
    workMode,
    workplace,
    description,
    observations,
    applicationInstructions,
    applicationMode,
    externalApplyUrl,
    applicationEmail,
    applicationWhatsapp,
    status: statusRaw,
  };
}

export function isProfessionalAccount(user: {
  role: string;
  hasProfessional: boolean;
  hasCompany: boolean;
}): boolean {
  if (user.hasProfessional || user.role === "PROFESSIONAL") return true;
  if (user.role === "COMPANY" || user.hasCompany) return false;
  return false;
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

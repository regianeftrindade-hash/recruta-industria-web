import { describe, expect, it } from "vitest";
import {
  JobPostingError,
  companyCanReadJobApplications,
  formatPublicationDate,
  isProfessionalAccount,
  parseJobWrite,
  parseSalaryToCents,
  toAdminJob,
  toPublicJob,
  type JobRecord,
} from "@/lib/jobs/job-posting";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Metalúrgica Aurora",
    confidential: false,
    publicationDate: "2026-10-21",
    title: "Operador de Máquinas",
    salary: "3.500,00",
    salaryNegotiable: false,
    contractType: "CLT",
    contractTypeOther: "",
    workMode: "PRESENCIAL",
    description: "Operar tornos e acompanhar a produção do turno.",
    observations: "Enviar currículo para recrutamento@empresa.com.br",
    applicationInstructions: "Candidate-se pelo Recruta Indústria.",
    status: "PUBLISHED",
    ...overrides,
  };
}

function recordFrom(data: ReturnType<typeof parseJobWrite>, id = "cjob1234567890"): JobRecord {
  return {
    id,
    companyName: data.companyName,
    confidential: data.confidential,
    publicationDate: data.publicationDate,
    title: data.title,
    salaryCents: data.salaryCents,
    salaryNegotiable: data.salaryNegotiable,
    contractType: data.contractType,
    contractTypeOther: data.contractTypeOther,
    workMode: data.workMode,
    description: data.description,
    observations: data.observations,
    applicationInstructions: data.applicationInstructions,
    status: data.status,
    origin: "ADMIN",
    companyUserId: null,
    publishedAt: new Date("2026-10-21T12:00:00.000Z"),
    closedAt: null,
    createdAt: new Date("2026-10-21T12:00:00.000Z"),
    updatedAt: new Date("2026-10-21T12:00:00.000Z"),
  };
}

describe("publicação de vagas", () => {
  it("formata salário, data e tipo de contratação", () => {
    expect(parseSalaryToCents("3500")).toBe(350000);
    expect(parseSalaryToCents("3.500,50")).toBe(350050);
    expect(parseSalaryToCents("R$ 2.200,00")).toBe(220000);

    const data = parseJobWrite(baseInput());
    expect(formatPublicationDate(data.publicationDate)).toBe("21/10/2026");
    expect(data.salaryCents).toBe(350000);
    expect(data.publicationDate?.toISOString()).toBe("2026-10-21T00:00:00.000Z");

    const pub = toPublicJob(recordFrom(data));
    expect(pub.companyLabel).toBe("Metalúrgica Aurora");
    expect(pub.salaryLabel).toMatch(/R\$\s*3\.500,00/);
    expect(pub.contractLabel).toBe("CLT");
    expect(pub.workModeLabel).toBe("Presencial");
    expect(pub.publicationDate).toBe("21/10/2026");
  });

  it("aceita CLT, PJ e as demais contratações, inclusive Outro", () => {
    for (const contractType of ["CLT", "PJ", "ESTAGIO", "TEMPORARIO", "APRENDIZ", "FREELANCER"]) {
      const data = parseJobWrite(baseInput({ contractType }));
      expect(data.contractType).toBe(contractType);
      expect(data.contractTypeOther).toBeNull();
    }

    const other = parseJobWrite(baseInput({
      contractType: "OUTRO",
      contractTypeOther: "Intermitente",
    }));
    expect(other.contractTypeOther).toBe("Intermitente");
    expect(toPublicJob(recordFrom(other)).contractLabel).toBe("Intermitente");
  });

  it("aceita home office, presencial e híbrido, uma modalidade por vez", () => {
    expect(parseJobWrite(baseInput({ workMode: "HOME_OFFICE" })).workMode).toBe("HOME_OFFICE");
    expect(parseJobWrite(baseInput({ workMode: "PRESENCIAL" })).workMode).toBe("PRESENCIAL");
    expect(parseJobWrite(baseInput({ workMode: "HIBRIDO" })).workMode).toBe("HIBRIDO");
    expect(() => parseJobWrite(baseInput({ workMode: "REMOTO" }))).toThrow(JobPostingError);
  });

  it("esconde o nome real quando a vaga é confidencial e preserva o nome interno", () => {
    const data = parseJobWrite(baseInput({
      confidential: true,
      companyName: "MetalurgicaSigilosaXYZ",
    }));
    const stored = recordFrom(data);
    const pub = toPublicJob(stored);
    const admin = toAdminJob(stored);

    expect(pub.companyLabel).toBe("Empresa confidencial");
    expect(JSON.stringify(pub)).not.toContain("MetalurgicaSigilosaXYZ");
    expect(admin.companyName).toBe("MetalurgicaSigilosaXYZ");
    expect(admin.confidential).toBe(true);
  });

  it("troca o valor por A combinar e não exige número", () => {
    const data = parseJobWrite(baseInput({
      salaryNegotiable: true,
      salary: "9999",
    }));
    expect(data.salaryCents).toBeNull();
    expect(data.salaryNegotiable).toBe(true);
    expect(toPublicJob(recordFrom(data)).salaryLabel).toBe("A combinar");

    const empty = parseJobWrite(baseInput({ salary: "", salaryNegotiable: true }));
    expect(empty.salaryCents).toBeNull();
  });

  it("não exige e-mail e preserva quebras de linha", () => {
    const data = parseJobWrite(baseInput({
      observations: "Levar documentos.\nRG e CPF.",
      applicationInstructions: "",
      salaryNegotiable: true,
      salary: "",
    }));
    expect(data.observations).toBe("Levar documentos.\nRG e CPF.");
    expect(data.applicationInstructions).toBeNull();
    expect(toPublicJob(recordFrom(data)).observations).toContain("\n");
  });

  it("permite rascunho sem salário, e-mail ou descrição e bloqueia publicação incompleta", () => {
    const draft = parseJobWrite({
      title: "Auxiliar de Produção",
      status: "DRAFT",
    });
    expect(draft.status).toBe("DRAFT");
    expect(draft.salaryCents).toBeNull();

    expect(() => parseJobWrite(baseInput({ publicationDate: "" }))).toThrow(/data da vaga/i);
    expect(() => parseJobWrite(baseInput({ contractType: "OUTRO", contractTypeOther: "" }))).toThrow(/Outro/i);
    expect(() => parseJobWrite(baseInput({ title: "" }))).toThrow(/cargo/i);
  });

  it("remove marcação perigosa e não aceita salário inválido", () => {
    const data = parseJobWrite(baseInput({
      description: "Atividade <script>alert(1)</script> no chão de fábrica",
    }));
    expect(data.description).not.toContain("<");
    expect(data.description).not.toContain(">");
    expect(() => parseSalaryToCents("mil reais")).toThrow(JobPostingError);
  });

  it("separa vaga do administrador da empresa e restringe a candidatura ao profissional", () => {
    expect(companyCanReadJobApplications({ companyUserId: null }, "empresa-1")).toBe(false);
    expect(companyCanReadJobApplications({ companyUserId: "empresa-1" }, "empresa-2")).toBe(false);
    expect(companyCanReadJobApplications({ companyUserId: "empresa-1" }, "empresa-1")).toBe(true);
    expect(isProfessionalAccount({
      role: "COMPANY",
      hasProfessional: false,
      hasCompany: true,
    })).toBe(false);
    expect(isProfessionalAccount({
      role: "PROFESSIONAL",
      hasProfessional: true,
      hasCompany: false,
    })).toBe(true);
  });
});

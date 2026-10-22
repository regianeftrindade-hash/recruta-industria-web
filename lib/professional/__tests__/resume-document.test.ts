import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";
import { isPdfBuffer, resumePathOwnedBy } from "@/lib/jobs/resume-pdf";
import { buildResumeDocument, resumePlainText, type ResumeSource } from "@/lib/professional/resume-document";
import { renderResumePdf } from "@/lib/professional/resume-pdf";
import { resumeFileProblem } from "@/lib/professional/resume-file";
import { publishOwnedResume, resumeStoragePath } from "@/lib/professional/resume-publish";

const fullProfile: ResumeSource = {
  name: "João da Silva",
  email: "joao@example.invalid",
  phone: "(47) 98888-7777",
  city: "São José dos Pinhais",
  state: "PR",
  desiredRole: "Operador de produção",
  presentation: "Profissional da indústria, com foco em produção e segurança.",
  experiencesJson: JSON.stringify([
    {
      nome: "Metalúrgica Açúcar",
      cargo: "Operador de máquina",
      segmento: "Metalurgia",
      dataInicio: "2019-03-01",
      dataFim: "2024-01-15",
      descricao: "Operei torno e acompanhei a manutenção preventiva.",
    },
    {
      nome: "Usina Beta",
      cargo: "Auxiliar",
      dataInicio: "2016-01-01",
      dataFim: "",
      descricao: "Apoiei a linha de montagem.",
    },
  ]),
  education: "Técnico",
  coursesJson: JSON.stringify([
    { nome: "NR-12", instituicao: "SENAI", cargaHoraria: "16h", dataConclusao: "2022-05-10", certificadoUrl: "https://secreto.example/cert.pdf" },
  ]),
  skillsJson: JSON.stringify(["Torno", "Leitura de desenho técnico"]),
  shift: "Integral",
  availability: "Imediata",
  area: "Metalurgia",
  experienceTime: "6-10 anos",
  cpf: "123.456.789-00",
  religion: "Não informar",
  sexualOrientation: "Não informar",
  address: "Rua das Flores, 100, apto 2",
  backgroundCheck: "Não",
};

async function pdfText(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const pdf = await getDocumentProxy(copy);
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n") : String(text || "");
}

describe("documento do currículo", () => {
  it("monta o currículo completo sem dados sensíveis nem campos vazios", () => {
    const document = buildResumeDocument(fullProfile);
    const text = resumePlainText(document);
    expect(text).toContain("João da Silva");
    expect(text).toContain("São José dos Pinhais, PR");
    expect(text).toContain("Operador de produção");
    expect(text).toContain("Metalúrgica Açúcar");
    expect(text).toContain("01/03/2019");
    expect(text).toContain("NR-12");
    expect(text).toContain("Torno");
    expect(text).toContain("Integral");
    expect(text).not.toContain("123.456.789-00");
    expect(text).not.toContain("Rua das Flores");
    expect(text).not.toContain("secreto.example");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("null");
    expect(document.missing).toEqual([]);
  });

  it("omite seções vazias e lista o que ainda pode ser preenchido", () => {
    const document = buildResumeDocument({
      name: "Ana Souza",
      email: "ana@example.invalid",
      experiencesJson: "[]",
      coursesJson: null,
      skillsJson: null,
    });
    const text = resumePlainText(document);
    expect(text).toContain("Ana Souza");
    expect(text).toContain("ana@example.invalid");
    expect(text).not.toContain("Experiência profissional");
    expect(text).not.toContain("Formação");
    expect(text).not.toContain("undefined");
    expect(document.missing).toContain("Experiências profissionais");
    expect(document.missing).toContain("Cursos");
    expect(document.missing).not.toContain("Nome profissional");
    expect(document.missing).not.toContain("E-mail");
  });

  it("ignora experiência sem empresa, cargo ou descrição", () => {
    const document = buildResumeDocument({
      name: "Ana Souza",
      experiencesJson: JSON.stringify([{ nome: "", cargo: "", descricao: "" }, { nome: "Usina", cargo: "Soldador" }]),
    });
    expect(resumePlainText(document)).toContain("Soldador — Usina");
    expect(resumePlainText(document).match(/Experiência profissional/g)).toHaveLength(1);
  });
});

describe("PDF do currículo", () => {
  it("gera PDF selecionável com acentos e várias experiências", async () => {
    const bytes = await renderResumePdf(buildResumeDocument(fullProfile));
    expect(isPdfBuffer(bytes)).toBe(true);
    const text = await pdfText(bytes);
    expect(text).toContain("João da Silva");
    expect(text).toContain("São José dos Pinhais");
    expect(text).toContain("produção");
    expect(text).toContain("Metalúrgica Açúcar");
    expect(text).toContain("Usina Beta");
    expect(text).not.toContain("123.456.789-00");
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it("quebra texto longo em mais de uma página sem perder o conteúdo", async () => {
    const long = "Manutenção preventiva da linha de produção. ".repeat(80);
    const experiences = Array.from({ length: 8 }, (_, index) => ({
      nome: `Empresa ${index + 1}`,
      cargo: `Cargo ${index + 1}`,
      descricao: long,
    }));
    const bytes = await renderResumePdf(buildResumeDocument({
      name: "João da Silva",
      email: "joao@example.invalid",
      experiencesJson: JSON.stringify(experiences),
    }));
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBeGreaterThan(1);
    const text = await pdfText(bytes);
    expect(text).toContain("Empresa 1");
    expect(text).toContain("Empresa 8");
    expect(text).toContain("Manutenção preventiva");
  });

  it("com perfil quase vazio, não inventa experiência nem diploma", async () => {
    const bytes = await renderResumePdf(buildResumeDocument({ email: "ana@example.invalid" }));
    const text = await pdfText(bytes);
    expect(text).toContain("ana@example.invalid");
    expect(text).not.toContain("undefined");
    expect(text).not.toContain("Empresa");
    expect(text).not.toContain("SENAI");
  });
});

describe("gravação do currículo", () => {
  it("só aponta o perfil depois do upload e mantém o caminho do dono", async () => {
    const pdf = await renderResumePdf(buildResumeDocument(fullProfile));
    const steps: string[] = [];
    const saved = await publishOwnedResume({
      email: "Joao@Example.invalid",
      pdf,
      now: 20,
      upload: async (path, bytes) => {
        steps.push(`upload:${path}`);
        expect(isPdfBuffer(bytes)).toBe(true);
      },
      assignPath: async (path) => {
        steps.push(`assign:${path}`);
      },
    });
    expect(steps).toEqual([
      "upload:curriculos/joao@example.invalid/20_curriculo.pdf",
      "assign:curriculos/joao@example.invalid/20_curriculo.pdf",
    ]);
    expect(saved.path).toBe(resumeStoragePath("Joao@Example.invalid", 20));
    expect(resumePathOwnedBy(saved.path, "joao@example.invalid")).toBe(true);
    expect(resumePathOwnedBy(saved.path, "outro@example.invalid")).toBe(false);
  });

  it("não atualiza o perfil se o upload falhar", async () => {
    const pdf = await renderResumePdf(buildResumeDocument({ name: "Ana" }));
    let assigned = false;
    await expect(publishOwnedResume({
      email: "ana@example.invalid",
      pdf,
      upload: async () => {
        throw new Error("bucket");
      },
      assignPath: async () => {
        assigned = true;
      },
    })).rejects.toThrow("bucket");
    expect(assigned).toBe(false);
  });

  it("não troca o ponteiro antigo se a atualização do perfil falhar", async () => {
    const pdf = await renderResumePdf(buildResumeDocument({ name: "Ana" }));
    let uploaded = false;
    await expect(publishOwnedResume({
      email: "ana@example.invalid",
      pdf,
      upload: async () => {
        uploaded = true;
      },
      assignPath: async () => {
        throw new Error("banco");
      },
    })).rejects.toThrow("banco");
    expect(uploaded).toBe(true);
  });

  it("recusa arquivo que não é PDF ou que passa de 10 MB antes de gravar", async () => {
    expect(resumeFileProblem(new TextEncoder().encode("%PDF-1.4"))).toBeNull();
    expect(resumeFileProblem(new TextEncoder().encode("PK...."))).toMatch(/PDF/);
    expect(resumeFileProblem(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), 10 * 1024 * 1024 + 1)).toMatch(/10 MB/);

    let uploaded = false;
    await expect(publishOwnedResume({
      email: "ana@example.invalid",
      pdf: new TextEncoder().encode("nao-e-pdf"),
      upload: async () => {
        uploaded = true;
      },
      assignPath: async () => undefined,
    })).rejects.toThrow(/PDF válido/);
    const huge = new Uint8Array(10 * 1024 * 1024 + 20);
    huge.set(new TextEncoder().encode("%PDF-"));
    await expect(publishOwnedResume({
      email: "ana@example.invalid",
      pdf: huge,
      upload: async () => {
        uploaded = true;
      },
      assignPath: async () => undefined,
    })).rejects.toThrow(/PDF válido/);
    expect(uploaded).toBe(false);
  });
});

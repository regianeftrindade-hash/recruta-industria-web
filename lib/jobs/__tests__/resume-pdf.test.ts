import { describe, expect, it } from "vitest";
import { buildApplicationMail } from "@/lib/jobs/job-application-mail";
import { isDocxBuffer, isPdfBuffer, resumeFormatFromName, resumePathOwnedBy, savedResumeLabel } from "@/lib/jobs/resume-pdf";

describe("currículo PDF da candidatura", () => {
  it("aceita só arquivo que começa com a assinatura PDF e cabe no limite", () => {
    expect(isPdfBuffer(Buffer.from("%PDF-1.7\n"))).toBe(true);
    expect(isPdfBuffer(Buffer.from("%PDF"))).toBe(false);
    expect(isPdfBuffer(Buffer.from("nao-e-pdf"))).toBe(false);
    expect(isPdfBuffer(Buffer.from("<html>%PDF-1.4</html>"))).toBe(false);
    const grande = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(20)]);
    expect(isPdfBuffer(grande, 10)).toBe(false);
  });

  it("só aceita o currículo da pasta do profissional autenticado", () => {
    const email = "ana@example.invalid";
    expect(resumePathOwnedBy("curriculos/ana@example.invalid/10_cv.pdf", email)).toBe(true);
    expect(resumePathOwnedBy("curriculos/outro@example.invalid/10_cv.pdf", email)).toBe(false);
    expect(resumePathOwnedBy("curriculos/ana@example.invalid/../outro/cv.pdf", email)).toBe(false);
    expect(resumePathOwnedBy("https://files.example/cv.pdf", email)).toBe(false);
    expect(resumeFormatFromName("curriculos/ana@example.invalid/10_cv.pdf")).toBe("pdf");
    expect(resumeFormatFromName("curriculos/ana@example.invalid/10_cv.docx")).toBe("docx");
    expect(resumeFormatFromName("curriculos/ana@example.invalid/10_cv.doc")).toBeNull();
    expect(savedResumeLabel("curriculos/ana@example.invalid/10_cv.docx", email)).toBe("Currículo em DOCX");
    expect(savedResumeLabel("curriculos/outro@example.invalid/10_cv.pdf", email)).toBeNull();
  });

  it("aceita DOCX com a pasta do Word e rejeita um ZIP qualquer", () => {
    const docx = Buffer.concat([
      Buffer.from("PK\u0003\u0004"),
      Buffer.from("word/document.xml"),
    ]);
    expect(isDocxBuffer(docx)).toBe(true);
    expect(isDocxBuffer(Buffer.from("PK\u0003\u0004somente-zip"))).toBe(false);
    expect(isDocxBuffer(Buffer.from("%PDF-1.7"))).toBe(false);
  });

  it("monta o e-mail sem nome de empresa, sem destinatário e sem link do currículo", () => {
    const mail = buildApplicationMail({
      jobTitle: "Auxiliar Administrativo",
      professionalName: "Ana Souza",
    });
    expect(mail.subject).toBe("Candidatura — Auxiliar Administrativo — Recruta Indústria");
    expect(mail.text).toContain("Profissional: Ana Souza");
    expect(mail.text).toContain("O currículo do candidato está anexado a este e-mail em formato PDF.");
    expect(mail.text).not.toContain("Metalurgica");
    expect(mail.text).not.toContain("@");
    expect(mail.text).not.toContain("http");
    expect(mail.html).not.toContain("Metalurgica");
  });

  it("sem PDF, descreve o perfil do site e não fala de anexo", () => {
    const mail = buildApplicationMail({
      jobTitle: "Soldador",
      professionalName: "Ana Souza",
      profile: {
        cargo: "Soldador",
        area: "Metalurgia",
        local: "Campinas, SP",
        escolaridade: "Técnico",
        turno: "Integral",
        experiencia: "3-5 anos",
        experiencias: "Metalúrgica Alfa — Soldador — 2020-01 a 2022-01",
        recolocacao: "Sim",
        pretensaoSalarial: "3-4 mil",
        mensagem: "Disponível para início imediato.",
        habilidades: "MIG, TIG",
        profileUrl: "https://www.recrutaindustria.com/company/professional/perfil1",
      },
    });
    expect(mail.text).toContain("não tinha currículo em PDF salvo");
    expect(mail.text).toContain("Cargo: Soldador");
    expect(mail.text).toContain("Perfil no site: https://www.recrutaindustria.com/company/professional/perfil1");
    expect(mail.text).not.toContain("anexado");
  });

  it("descreve anexo DOCX sem tratar o arquivo como PDF", () => {
    const mail = buildApplicationMail({
      jobTitle: "Soldador",
      professionalName: "Ana Souza",
      resumeFormat: "docx",
    });
    expect(mail.text).toContain("formato DOCX");
    expect(mail.text).not.toContain("formato PDF");
  });
});

import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";
import { compileRawEmail } from "@/lib/infra/email";

describe("compileRawEmail", () => {
  it("guarda o currículo no mesmo arquivo que será enviado", async () => {
    const raw = await compileRawEmail({
      to: "empresa@example.com",
      subject: "Curriculo da vaga",
      text: "Segue o curriculo em anexo.",
      html: "<p>Segue o curriculo em anexo.</p>",
      attachments: [{
        filename: "curriculo.pdf",
        content: Buffer.from("%PDF-1.4 curriculo"),
        contentType: "application/pdf",
      }],
    }, "Recruta Indústria <recrutamento@recrutaindustria.com>");

    const text = raw.toString("utf8");
    expect(text).toContain("Curriculo da vaga");
    expect(text).toContain("empresa@example.com");
    expect(text).toContain("recrutamento@recrutaindustria.com");
    expect(text).toContain("filename=curriculo.pdf");
    expect(text).toContain(Buffer.from("%PDF-1.4 curriculo").toString("base64"));
  });

  it("não deixa quebra de linha no assunto criar outro cabeçalho", async () => {
    const raw = await compileRawEmail({
      to: "empresa@example.com",
      subject: "Proposta\r\nBcc: invasor@example.com",
      text: "Texto da proposta.",
      html: "<p>Texto da proposta.</p>",
    }, "Recruta Indústria <recrutamento@recrutaindustria.com>");

    const text = raw.toString("utf8");
    expect(text).not.toMatch(/^Bcc:/m);
    expect(text).toContain("Texto da proposta.");
  });

  it("monta a mensagem no transporte de teste, sem SMTP", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true });
    const info = await transport.sendMail({
      from: "Recruta Indústria <recrutamento@recrutaindustria.com>",
      to: "profissional@example.com",
      subject: "Entrevista confirmada",
      text: "A entrevista foi confirmada.",
    });
    const message = typeof info.message === "string" ? info.message : JSON.stringify(info.message);
    expect(message).toContain("Entrevista confirmada");
    expect(message).toContain("profissional@example.com");
    expect(message).not.toContain("SMTP_PASS");
  });
});

import { describe, expect, it } from "vitest";
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
});

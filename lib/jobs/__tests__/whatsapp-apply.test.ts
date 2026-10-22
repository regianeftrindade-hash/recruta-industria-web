import { describe, expect, it } from "vitest";
import {
  buildWhatsAppResumeText,
  extractJobCode,
  whatsAppApplyUrl,
} from "@/lib/jobs/job-application-mail";
import { parseApplicationPhone } from "@/lib/jobs/job-posting";
import { isWhatsAppApplyUrl } from "@/lib/jobs/public-job-link";

describe("candidatura por WhatsApp", () => {
  it("converte o telefone brasileiro e preserva acentos na mensagem", () => {
    const phone = parseApplicationPhone("(47) 99713-0519");
    expect(phone).toBe("5547997130519");
    const text = buildWhatsAppResumeText({
      jobTitle: "Auxiliar de Produção",
      professionalName: "João da Conceição",
      jobCode: "RI-PUB-WEIKU-AUX-20261021",
      hasPdf: false,
    });
    const url = whatsAppApplyUrl(phone!, text);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("wa.me");
    expect(parsed.pathname).toBe("/5547997130519");
    expect(parsed.searchParams.get("text")).toContain("Auxiliar de Produção");
    expect(parsed.searchParams.get("text")).toContain("João da Conceição");
    expect(parsed.searchParams.get("text")).toContain("Código da vaga: RI-PUB-WEIKU-AUX-20261021");
    expect(parsed.searchParams.get("text")).toContain("Estou preparando meu currículo para anexar");
    expect(parsed.searchParams.get("text")).not.toMatch(/anexado automaticamente|currículo foi enviado|Candidatura enviada/i);
    expect(isWhatsAppApplyUrl(url)).toBe(true);
  });

  it("pede para anexar o PDF quando ele já existe e omite dados que não existem", () => {
    const text = buildWhatsAppResumeText({
      jobTitle: "Soldador",
      professionalName: "",
      jobCode: null,
      hasPdf: true,
    });
    expect(text).toContain("Vou anexar meu currículo em PDF nesta conversa antes de enviar.");
    expect(text).not.toContain("Nome:");
    expect(text).not.toContain("Código da vaga:");
    expect(text).not.toMatch(/@/);
  });

  it("lê só o código já gravado na vaga", () => {
    expect(extractJobCode("Referência Recruta: RI-PUB-CAT-SOLDA-20261009")).toBe("RI-PUB-CAT-SOLDA-20261009");
    expect(extractJobCode("Sem código por aqui.")).toBeNull();
  });

  it("recusa número e link que não sejam o WhatsApp da vaga", () => {
    expect(() => whatsAppApplyUrl("11988887777", "Olá")).toThrow(/WhatsApp/);
    expect(isWhatsAppApplyUrl("https://wa.me/?text=oi")).toBe(false);
    expect(isWhatsAppApplyUrl("https://evil.example/55")).toBe(false);
    expect(isWhatsAppApplyUrl("https://wa.me/5511988887777")).toBe(false);
  });
});

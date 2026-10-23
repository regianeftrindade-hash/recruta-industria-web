import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertServerDelivery,
  describeApplyPanel,
  discloseApplicationContact,
} from "@/lib/jobs/application-access";
import { JobPostingError } from "@/lib/jobs/job-posting";

const email = "rh@empresa.example";
const phone = "5547988887777";
const url = "https://empresa.example/vaga";

describe("candidatura Free e Premium", () => {
  it("mostra ao Free somente o dado do método configurado", () => {
    const porEmail = describeApplyPanel({
      mode: "EMAIL",
      plan: "FREE",
      contact: { kind: "email", value: email },
      hasResume: false,
    });
    expect(porEmail.automatic).toBe(false);
    expect(porEmail.contact).toEqual({ kind: "email", value: email });
    expect(porEmail.copyLabel).toBe("Copiar e-mail");
    expect(porEmail.detail).toMatch(/por conta própria/i);
    expect(JSON.stringify(porEmail)).not.toContain("wa.me");
    expect(JSON.stringify(porEmail)).not.toContain(url);

    const porWhatsapp = describeApplyPanel({
      mode: "WHATSAPP",
      plan: "FREE",
      contact: { kind: "whatsapp", value: phone },
      hasResume: true,
    });
    expect(porWhatsapp.contact?.kind).toBe("whatsapp");
    expect(porWhatsapp.contact?.value).toContain("98888-7777");
    expect(porWhatsapp.automatic).toBe(false);
    expect(JSON.stringify(porWhatsapp)).not.toContain(email);
    expect(JSON.stringify(porWhatsapp)).not.toContain("wa.me");

    const porSite = describeApplyPanel({
      mode: "EXTERNAL",
      plan: "FREE",
      contact: { kind: "url", value: url },
      hasResume: false,
    });
    expect(porSite.externalLink).toBe(url);
    expect(porSite.contact?.kind).toBe("url");
    expect(porSite.automatic).toBe(false);
    expect(porSite.detail).toMatch(/não confirma o envio/i);
    expect(JSON.stringify(porSite)).not.toContain(email);

    const interna = describeApplyPanel({
      mode: "INTERNAL",
      plan: "FREE",
      contact: { kind: "email", value: email },
      hasResume: false,
    });
    expect(interna.contact).toBeNull();
    expect(interna.automatic).toBe(false);
    expect(interna.detail).toMatch(/Recruta Indústria/);
  });

  it("libera envio automático só no e-mail Premium com currículo", () => {
    const comPdf = describeApplyPanel({
      mode: "EMAIL",
      plan: "PREMIUM",
      contact: { kind: "email", value: email },
      hasResume: true,
    });
    expect(comPdf.automatic).toBe(true);
    expect(comPdf.needsResume).toBe(false);
    expect(comPdf.contact).toBeNull();
    expect(JSON.stringify(comPdf)).not.toContain(email);

    const semCurriculo = describeApplyPanel({
      mode: "EMAIL",
      plan: "PREMIUM",
      contact: null,
      hasResume: false,
    });
    expect(semCurriculo.automatic).toBe(true);
    expect(semCurriculo.needsResume).toBe(true);
    expect(semCurriculo.detail).toBe(
      "Para utilizar a candidatura Premium, você precisa ter um currículo salvo no seu perfil.",
    );

    const whatsapp = describeApplyPanel({
      mode: "WHATSAPP",
      plan: "PREMIUM",
      contact: { kind: "whatsapp", value: phone },
      hasResume: true,
    });
    expect(whatsapp.automatic).toBe(false);
    expect(whatsapp.detail).toMatch(/Não há integração/i);

    const site = describeApplyPanel({
      mode: "EXTERNAL",
      plan: "PREMIUM",
      contact: { kind: "url", value: url },
      hasResume: true,
    });
    expect(site.automatic).toBe(false);
    expect(site.externalLink).toBe(url);

    expect(assertServerDelivery({ mode: "EMAIL", plan: "PREMIUM", hasValidResume: true })).toBe("send-email");
    expect(assertServerDelivery({ mode: "INTERNAL", plan: "FREE", hasValidResume: false })).toBe("register-internal");
    expect(() => assertServerDelivery({ mode: "EMAIL", plan: "FREE", hasValidResume: true })).toThrow(JobPostingError);
    expect(() => assertServerDelivery({ mode: "EMAIL", plan: "PREMIUM", hasValidResume: false })).toThrow(/currículo/i);
    expect(() => assertServerDelivery({ mode: "WHATSAPP", plan: "PREMIUM", hasValidResume: true })).toThrow(/automaticamente/i);
    expect(() => assertServerDelivery({ mode: "EXTERNAL", plan: "PREMIUM", hasValidResume: true })).toThrow(/site da empresa/i);
  });

  it("não entrega e-mail nem WhatsApp na resposta pública", () => {
    const publico = discloseApplicationContact({
      audience: "anonymous",
      plan: null,
      mode: "EMAIL",
      email,
      whatsapp: phone,
      url,
    });
    expect(publico.contact).toBeNull();
    expect(JSON.stringify(publico)).not.toContain(email);
    expect(JSON.stringify(publico)).not.toContain(phone);

    const empresa = discloseApplicationContact({
      audience: "company",
      plan: null,
      mode: "WHATSAPP",
      email,
      whatsapp: phone,
      url,
    });
    expect(empresa.contact).toBeNull();

    const free = discloseApplicationContact({
      audience: "professional",
      plan: "FREE",
      mode: "EMAIL",
      email,
      whatsapp: phone,
      url,
    });
    expect(free.contact).toEqual({ kind: "email", value: email });
    expect(JSON.stringify(free)).not.toContain(phone);
    expect(JSON.stringify(free)).not.toContain(url);

    const premium = discloseApplicationContact({
      audience: "professional",
      plan: "PREMIUM",
      mode: "EMAIL",
      email,
      whatsapp: phone,
      url,
    });
    expect(premium.delivery).toBe("automatic");
    expect(premium.contact).toBeNull();
    expect(JSON.stringify(premium)).not.toContain(email);
  });

  it("a migração do WhatsApp só acrescenta a coluna", () => {
    const sql = readFileSync(
      "prisma/migrations/20261023120000_job_application_whatsapp/migration.sql",
      "utf8",
    ).toLowerCase();
    expect(sql).toContain("add column if not exists");
    expect(sql).toContain("applicationwhatsapp");
    expect(sql).not.toContain("drop ");
    expect(sql).not.toContain("delete ");
    expect(sql).not.toContain("truncate");
  });
});

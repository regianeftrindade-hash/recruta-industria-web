import { describe, expect, it } from "vitest";
import {
  parseJobWrite,
  toPublicJob,
  parseApplicationWhatsapp,
  formatWhatsappDisplay,
  type JobRecord,
  type JobWriteData,
} from "@/lib/jobs/job-posting";
import { jobWhatsappHref, parseJobRegionFields } from "@/lib/jobs/job-region";
import { parseJobSearch, publicJobWhere } from "@/lib/jobs/job-search";
import { buildApplicationMail } from "@/lib/jobs/job-application-mail";
import { currencyPatch } from "@/lib/jobs/job-posting";
import { regionFieldPatch } from "@/lib/jobs/job-region";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "Metalúrgica Aurora",
    confidential: false,
    publicationDate: "2026-11-20",
    title: "Operador CNC",
    salary: "3.000,00",
    salaryNegotiable: false,
    contractType: "CLT",
    workMode: "PRESENCIAL",
    workplace: "Joinville/SC",
    description: "Operar máquinas CNC com segurança.",
    applicationMode: "INTERNAL",
    status: "PUBLISHED",
    ...overrides,
  };
}

function recordFrom(data: JobWriteData): JobRecord {
  const now = new Date("2026-11-20T12:00:00.000Z");
  return {
    id: "job1",
    ...data,
    origin: "COMPANY",
    companyUserId: "u1",
    publishedAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

describe("Etapa B — vagas internacionais", () => {
  it("persiste país, locale, moeda e fuso (BR e 3 países)", () => {
    const br = parseJobWrite(baseInput());
    expect(br).toMatchObject({
      countryCode: "BR",
      locale: "pt-BR",
      currency: "BRL",
      timeZone: "America/Sao_Paulo",
    });

    const us = parseJobWrite(baseInput({
      countryCode: "US",
      workplace: "Austin, TX",
      salary: "4500.00",
      applicationMode: "WHATSAPP",
      applicationWhatsapp: "+1 415 555 0123",
    }));
    expect(us).toMatchObject({
      countryCode: "US",
      locale: "en",
      currency: "USD",
      timeZone: "America/New_York",
      applicationWhatsapp: "14155550123",
    });

    const pt = parseJobWrite(baseInput({
      countryCode: "PT",
      workplace: "Lisboa",
      salary: "1800,00",
    }));
    expect(pt).toMatchObject({
      countryCode: "PT",
      locale: "pt-PT",
      currency: "EUR",
      timeZone: "Europe/Lisbon",
    });

    const jp = parseJobWrite(baseInput({
      countryCode: "JP",
      workplace: "Osaka",
      salary: "350000",
      currency: "JPY",
      timeZone: "Asia/Tokyo",
    }));
    expect(jp).toMatchObject({
      countryCode: "JP",
      locale: "ja",
      currency: "JPY",
      timeZone: "Asia/Tokyo",
    });

    const publicUs = toPublicJob(recordFrom(us));
    expect(publicUs.countryCode).toBe("US");
    expect(publicUs.currency).toBe("USD");
    expect(publicUs.locale).toBe("en");
    expect(publicUs.timeZone).toBe("America/New_York");
  });

  it("whatsappHref não prefixa 55 fora do Brasil e mantém BR", () => {
    expect(jobWhatsappHref("47988887777", "BR")).toBe("https://wa.me/5547988887777");
    expect(jobWhatsappHref("5547988887777", "BR")).toBe("https://wa.me/5547988887777");
    expect(jobWhatsappHref("14155550123", "US")).toBe("https://wa.me/14155550123");
    expect(jobWhatsappHref("351912345678", "PT")).toBe("https://wa.me/351912345678");
    expect(jobWhatsappHref("819012345678", "JP")).toBe("https://wa.me/819012345678");
    expect(jobWhatsappHref("47988887777", "US")).toBe("https://wa.me/47988887777");
    expect(parseApplicationWhatsapp("+1 415 555 0123", "US")).toBe("14155550123");
    expect(() => parseApplicationWhatsapp("4155550123", "US")).toThrow(/internacional/i);
    expect(formatWhatsappDisplay("14155550123", "US")).toBe("+14155550123");
    expect(formatWhatsappDisplay("47988887777", "BR")).toMatch(/^\+55/);
  });

  it("filtros públicos por país e moeda preservam BR", () => {
    const byCountry = publicJobWhere(parseJobSearch({ pais: "US" }));
    expect(JSON.stringify(byCountry)).toContain('"countryCode":"US"');

    const byCurrency = publicJobWhere(parseJobSearch({ moeda: "EUR" }));
    expect(JSON.stringify(byCurrency)).toContain('"currency":"EUR"');
    expect(JSON.stringify(byCurrency)).not.toContain('"salaryNegotiable"');

    const brSalary = publicJobWhere(parseJobSearch({ minimo: "3000" }));
    expect(JSON.stringify(brSalary)).toContain('"currency":"BRL"');
    expect(JSON.stringify(brSalary)).not.toContain('"countryCode"');

    expect(parseJobSearch({}).countryCode).toBe("");
    expect(parseJobSearch({}).salaryCurrency).toBe("");
  });

  it("PATCH sem campos de região conserva valores (patch helpers)", () => {
    expect(currencyPatch({ title: "x" }, "USD")).toEqual({});
    expect(regionFieldPatch({ title: "x" }, "countryCode", "US")).toEqual({});
    expect(regionFieldPatch({ countryCode: "PT" }, "countryCode", "PT")).toEqual({
      countryCode: "PT",
    });
    expect(parseJobRegionFields({ countryCode: "DE" })).toEqual({
      ok: true,
      countryCode: "DE",
      locale: "de",
      timeZone: "Europe/Berlin",
    });
  });

  it("e-mail de candidatura respeita o idioma da vaga", () => {
    const pt = buildApplicationMail({
      jobTitle: "Soldador",
      professionalName: "Ana",
      locale: "pt-BR",
    });
    expect(pt.subject).toContain("Candidatura");
    expect(pt.text).toContain("Olá,");

    const en = buildApplicationMail({
      jobTitle: "Welder",
      professionalName: "Ana",
      locale: "en",
    });
    expect(en.subject).toContain("Application");
    expect(en.text).toContain("Hello,");
    expect(en.text).toContain("Professional: Ana");
  });
});

import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money/format-money";
import { formatSalaryFromCents, publicSalaryLabel } from "@/lib/jobs/job-posting";
import { formatPriceBRL } from "@/lib/payment/billing";
import { COMPANY_PLAN_TIERS } from "@/lib/company/company-premium-plans";
import { PROFESSIONAL_PLAN_TIERS } from "@/lib/professional/professional-premium-plans";

describe("formatMoney", () => {
  it("mantém o real brasileiro como padrão", () => {
    expect(formatMoney(350000)).toMatch(/R\$\s*3\.500,00/);
    expect(formatSalaryFromCents(350000)).toBe(formatMoney(350000));
    expect(formatPriceBRL(24900)).toBe(formatMoney(24900));
    expect(formatPriceBRL(1990)).toMatch(/R\$\s*19,90/);
  });

  it("exibe outra moeda sem converter os centavos", () => {
    expect(formatMoney(350000, "USD")).toMatch(/3\.500,00/);
    expect(formatMoney(350000, "USD")).not.toMatch(/^R\$/);
    expect(publicSalaryLabel({
      salaryNegotiable: false,
      salaryCents: 350000,
      currency: "USD",
    })).toBe(formatMoney(350000, "USD"));
  });

  it("trata moeda ausente ou inválida como BRL", () => {
    expect(publicSalaryLabel({
      salaryNegotiable: false,
      salaryCents: 350000,
    })).toBe(formatMoney(350000, "BRL"));
    expect(formatMoney(100, "real")).toBe(formatMoney(100, "BRL"));
    expect(formatSalaryFromCents(300000, "ZZZ")).toBe(formatMoney(300000, "BRL"));
    expect(formatMoney(300000, "XYZ")).toBe(formatMoney(300000, "BRL"));
  });

  it("usa o idioma só na apresentação e a moeda da vaga no símbolo", () => {
    expect(formatSalaryFromCents(300000, "BRL", "pt-BR")).toMatch(/R\$\s*3\.000,00/);
    expect(formatSalaryFromCents(300000, "BRL", "en")).toMatch(/3,000\.00/);
    expect(formatSalaryFromCents(300000, "BRL", "en")).toMatch(/R\$|BRL/);
    expect(formatSalaryFromCents(300000, "USD", "pt-BR")).toMatch(/3\.000,00/);
    expect(formatSalaryFromCents(300000, "USD", "pt-BR")).toMatch(/US\$|USD/);
    expect(formatSalaryFromCents(300000, "EUR", "en")).toMatch(/3,000\.00/);
    expect(formatSalaryFromCents(300000, "EUR", "en")).toMatch(/€|EUR/);
  });

  it("não muda a escala dos centavos", () => {
    expect(formatSalaryFromCents(350000, "BRL", "pt-BR")).toMatch(/3\.500,00/);
    expect(formatSalaryFromCents(350000, "BRL", "pt-BR")).not.toMatch(/350\.000/);
    expect(formatSalaryFromCents(1990, "BRL", "pt-BR")).toMatch(/19,90/);
  });

  it("mantém salário a combinar, confidencial e não informado", () => {
    expect(publicSalaryLabel({
      salaryNegotiable: true,
      salaryCents: 300000,
      currency: "USD",
    })).toBe("A combinar");
    expect(publicSalaryLabel({
      salaryNegotiable: false,
      salaryCents: null,
      currency: "EUR",
    })).toBeNull();
  });

  it("mantém os preços dos planos em BRL", () => {
    expect(COMPANY_PLAN_TIERS.filter((plan) => plan.id !== "FREE").map((plan) => plan.precoCentavos)).toEqual([24900, 49900, 129900]);
    expect(PROFESSIONAL_PLAN_TIERS.find((plan) => plan.id === "PREMIUM")?.preco).toBe("R$ 19,90");
    expect(PROFESSIONAL_PLAN_TIERS.find((plan) => plan.id === "PREMIUM")?.precoCentavos).toBe(1990);
    for (const cents of [24900, 49900, 129900, 1990]) {
      expect(formatPriceBRL(cents)).toBe(formatMoney(cents, "BRL", "pt-BR"));
      expect(formatPriceBRL(cents)).toMatch(/R\$/);
    }
  });
});

import { afterEach, describe, expect, it } from "vitest";
import { getAsaasConfig } from "@/lib/payment/asaas-client";
import { getPaymentProvider } from "@/lib/payment/payment-config";
import { asCompanyPaymentMeta, asProfessionalPaymentMeta } from "@/lib/payment/payment-config";

const KEYS = ["ASAAS_API_KEY", "ASAAS_API_URL", "PAYMENT_PROVIDER", "PAGSEGURO_TOKEN", "PAGBANK_TOKEN"] as const;
const previous = new Map<string, string | undefined>();

function remember() {
  for (const key of KEYS) previous.set(key, process.env[key]);
}

function restore() {
  for (const key of KEYS) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("configuração Asaas compartilhada", () => {
  afterEach(() => {
    restore();
  });

  it("profissional e empresa leem a mesma ASAAS_API_KEY", () => {
    remember();
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.PAGSEGURO_TOKEN;
    delete process.env.PAGBANK_TOKEN;
    process.env.ASAAS_API_KEY = "chave-de-teste";
    process.env.ASAAS_API_URL = "https://api-sandbox.asaas.com";

    const config = getAsaasConfig();
    expect(config.apiKey).toBe("chave-de-teste");
    expect(config.apiUrl).toBe("https://api-sandbox.asaas.com");
    expect(config.webhookUrl.endsWith("/api/asaas/webhook")).toBe(true);
    expect(getPaymentProvider()).toBe("asaas");
  });

  it("não trata ausência da chave como outro provedor para o profissional", () => {
    remember();
    delete process.env.ASAAS_API_KEY;
    delete process.env.PAYMENT_PROVIDER;
    delete process.env.PAGSEGURO_TOKEN;
    delete process.env.PAGBANK_TOKEN;

    expect(getAsaasConfig().apiKey).toBe("");
  });

  it("não deixa uma cobrança empresarial valer como assinatura profissional", () => {
    const company = JSON.stringify({
      type: "company_subscription",
      planTier: "BASIC",
      companyUserId: "empresa-1",
      expectedAmount: 24900,
    });
    const professional = JSON.stringify({
      type: "professional_subscription",
      planTier: "PREMIUM",
      professionalUserId: "prof-1",
      expectedAmount: 1990,
    });
    expect(asProfessionalPaymentMeta(company)).toBeNull();
    expect(asCompanyPaymentMeta(professional)).toBeNull();
    expect(asProfessionalPaymentMeta(professional)?.expectedAmount).toBe(1990);
  });
});

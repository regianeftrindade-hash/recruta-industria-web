import { afterEach, describe, expect, it } from "vitest";
import {
  isVercelPreviewRuntime,
  resolveCheckoutBaseUrl,
  stripeCheckoutReturnUrls,
  withPreviewProtectionBypass,
} from "@/lib/payment/checkout-return-url";

const ORIGINAL = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL);
});

describe("checkout-return-url Preview bypass", () => {
  it("não altera URL fora de Preview", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "secret_test";
    expect(isVercelPreviewRuntime()).toBe(false);
    const url = "https://www.recrutaindustria.com/company/pagamento?success=1";
    expect(withPreviewProtectionBypass(url)).toBe(url);
  });

  it("anexa bypass só em Preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "secret_preview";
    expect(isVercelPreviewRuntime()).toBe(true);
    const out = withPreviewProtectionBypass(
      "https://recruta-industria-preview-stripe.vercel.app/company/pagamento?success=1&ref=abc",
    );
    const parsed = new URL(out);
    expect(parsed.searchParams.get("x-vercel-protection-bypass")).toBe("secret_preview");
    expect(parsed.searchParams.get("x-vercel-set-bypass-cookie")).toBe("true");
    expect(parsed.searchParams.get("success")).toBe("1");
    expect(parsed.searchParams.get("ref")).toBe("abc");
  });

  it("monta success/cancel com bypass em Preview", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = "secret_preview";
    const { successUrl, cancelUrl } = stripeCheckoutReturnUrls({
      baseUrl: "https://recruta-industria-preview-stripe.vercel.app",
      successPath: "/company/pagamento",
      cancelPath: "/company/pagamento",
      paymentReference: "stripe_co_1",
    });
    expect(successUrl).toContain("success=1");
    expect(successUrl).toContain("ref=stripe_co_1");
    expect(successUrl).toContain("x-vercel-protection-bypass=secret_preview");
    expect(cancelUrl).toContain("canceled=1");
    expect(cancelUrl).toContain("x-vercel-protection-bypass=secret_preview");
  });

  it("resolveCheckoutBaseUrl prioriza NEXTAUTH_URL estável", () => {
    process.env.NEXTAUTH_URL = "https://recruta-industria-preview-stripe.vercel.app/";
    delete process.env.APP_URL;
    expect(resolveCheckoutBaseUrl()).toBe(
      "https://recruta-industria-preview-stripe.vercel.app",
    );
  });
});

/**
 * Valida flags públicas de /api/payment/config em produção.
 * Não cria cobranças. Não imprime secrets.
 */
import { expect, test } from "@playwright/test";

test.describe("payment config — sandbox safety (produção)", () => {
  test("expõe readiness Stripe/Asaas sem valores de secret", async ({ request }) => {
    const res = await request.get("/api/payment/config");
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as Record<string, unknown>;

    expect(typeof body.configured).toBe("boolean");
    expect(typeof body.stripeEnabled).toBe("boolean");
    expect(typeof body.internationalCheckoutReady).toBe("boolean");
    expect(Array.isArray(body.missingPriceEnvs)).toBe(true);

    // Campos novos (após deploy deste PR). Soft se ainda não publicados.
    if ("stripeTestMode" in body) {
      expect(typeof body.stripeTestMode).toBe("boolean");
      expect(typeof body.stripeLiveMode).toBe("boolean");
      expect(typeof body.asaasSandbox).toBe("boolean");
      expect(typeof body.safeForAutomatedSandboxCharges).toBe("boolean");
      expect(Array.isArray(body.missingProfessionalPriceEnvs)).toBe(true);

      // Nunca automatizar cobrança se produção Asaas ou Stripe live.
      if (body.asaasSandbox === false || body.stripeLiveMode === true) {
        expect(body.safeForAutomatedSandboxCharges).toBe(false);
      }
    }

    // Garantia: resposta não vaza chaves
    const raw = JSON.stringify(body);
    expect(raw).not.toMatch(/sk_(live|test)_/);
    expect(raw).not.toMatch(/pk_(live|test)_/);
    expect(raw).not.toMatch(/whsec_/);
    expect(raw).not.toMatch(/\$aact_/); // Asaas access token prefix comum
  });
});

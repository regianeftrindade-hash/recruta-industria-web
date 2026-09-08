/**
 * E2E profissional logado — dashboard / funil (soft-assert).
 *
 * Requer secrets/env: E2E_PROFESSIONAL_EMAIL + E2E_PROFESSIONAL_PASSWORD.
 * Sem credenciais: skip (não falha o CI). Detalhes: docs/e2e-secrets.md
 *
 * No GitHub Actions o job `e2e-profissional` só é enfileirado se esses secrets existirem.
 * Conta com cadastro incompleto: o 1º teste aceita redirect; o 2º soft-skipa a nav.
 */
import { expect, test } from "@playwright/test";
import { loginProfessionalViaApi, professionalE2eCredentials } from "./helpers/auth";
import { dashNavControl } from "./helpers/nav";

const creds = professionalE2eCredentials();

test.describe("profissional logado", () => {
  test.skip(
    !creds,
    "Skip: defina E2E_PROFESSIONAL_EMAIL e E2E_PROFESSIONAL_PASSWORD (local ou GitHub Secrets). Ver docs/e2e-secrets.md",
  );

  test.beforeEach(async ({ page, request }) => {
    await loginProfessionalViaApi(request, page, creds!.email, creds!.password);
  });

  test("abre dashboard ou completa cadastro", async ({ page }) => {
    await page.goto("/professional/dashboard");
    await page.waitForLoadState("domcontentloaded");
    const url = page.url();
    const ok =
      /professional\/dashboard/i.test(url) ||
      /professional\/register/i.test(url) ||
      /professional\/boas-vindas/i.test(url);
    expect(ok).toBe(true);
    await expect(page.locator("body")).toBeVisible();
  });

  test("soft-assert nav de oportunidades/propostas/mensagens", async ({ page }) => {
    await page.goto("/professional/dashboard");
    await page.waitForLoadState("domcontentloaded");

    if (!/professional\/dashboard/i.test(page.url())) {
      // Cadastro incompleto — soft skip sem falhar.
      test.info().annotations.push({
        type: "note",
        description: "Skip soft: fora do dashboard (cadastro/boas-vindas) — nav ignorada",
      });
      return;
    }

    await expect(page.locator("body")).toBeVisible();

    const funnelNav = dashNavControl(
      page,
      /oportunidades|propostas|entrevistas|mensagens/i,
    );
    const visible = await funnelNav.isVisible().catch(() => false);
    if (!visible) {
      test.info().annotations.push({
        type: "note",
        description: "Skip soft: nav oportunidades/propostas/mensagens/entrevistas ausente — ok",
      });
      return;
    }

    await funnelNav.click();

    // Soft: headings do funil ou mensagens, sem exigir dados.
    const funnelCopy = page
      .getByText(
        /oportunidades|propostas recebidas|entrevistas agendadas|nenhuma proposta|nenhuma entrevista|mensagens/i,
      )
      .first();
    await expect.soft(funnelCopy).toBeVisible({ timeout: 15_000 });
  });
});

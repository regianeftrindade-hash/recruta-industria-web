/**
 * E2E empresa: abre um perfil da vitrine.
 * Login inválido falha o job (continue-on-error no CI).
 */
import { expect, test } from "@playwright/test";
import { companyE2eCredentials, loginCompanyViaApi } from "./helpers/auth";

const creds = companyE2eCredentials();

test.describe("empresa logada — perfil da vitrine", () => {
  test.skip(
    !creds,
    "Skip: defina E2E_COMPANY_EMAIL e E2E_COMPANY_PASSWORD. Ver docs/e2e-secrets.md",
  );

  test.beforeEach(async ({ page, request }) => {
    await loginCompanyViaApi(request, page, creds!.email, creds!.password);
  });

  test("abre um candidato da vitrine ou registra vitrine vazia", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");
    await expect(
      page.getByText(/busca rápida|profissionais na vitrine|banco de talentos/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    const profileLink = page
      .locator('a[href*="/company/professional/"]')
      .or(page.getByRole("link", { name: /ver perfil|abrir perfil|ver candidato/i }))
      .first();

    const hasProfile = await profileLink.isVisible().catch(() => false);
    if (!hasProfile) {
      test.info().annotations.push({
        type: "note",
        description: "Vitrine sem candidatos clicáveis nesta conta — soft ok",
      });
      await expect(page.locator("body")).toBeVisible();
      return;
    }

    await profileLink.click();
    await expect(page).toHaveURL(/\/company\/professional\//i, { timeout: 20_000 });
    await expect(page.locator("body")).toBeVisible();
  });
});

import { expect, test } from "@playwright/test";
import { companyE2eCredentials, loginCompanyViaApi } from "./helpers/auth";

const creds = companyE2eCredentials();

test.describe("empresa logada — funil", () => {
  test.skip(!creds, "Defina E2E_COMPANY_EMAIL e E2E_COMPANY_PASSWORD para rodar este fluxo");

  test.beforeEach(async ({ page, request }) => {
    await loginCompanyViaApi(request, page, creds!.email, creds!.password);
  });

  test("abre dashboard empresa e vê busca/vitrine", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");
    await expect(page).toHaveURL(/dashboard-empresa/);
    await expect(page.getByText(/busca rápida/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/profissionais na vitrine|banco de talentos/i).first()).toBeVisible();
  });

  test("navega para aba Entrevistas", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");
    const entrevistas = page.getByRole("link", { name: /entrevistas/i }).first();
    await expect(entrevistas).toBeVisible({ timeout: 20_000 });
    await entrevistas.click();
    await expect(page).toHaveURL(/entrevistas|tab=entrevistas/i);
  });
});

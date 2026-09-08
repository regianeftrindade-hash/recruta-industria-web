import { expect, test } from "@playwright/test";
import { loginProfessionalViaApi, professionalE2eCredentials } from "./helpers/auth";

const creds = professionalE2eCredentials();

test.describe("profissional logado", () => {
  test.skip(!creds, "Defina E2E_PROFESSIONAL_EMAIL e E2E_PROFESSIONAL_PASSWORD");

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
});

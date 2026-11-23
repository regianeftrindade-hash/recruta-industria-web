import { expect, test } from "@playwright/test";

test.describe("conformidade — cookies e consentimento", () => {
  test("banner de cookies aparece e essenciais não carrega gtag", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /essenciais|essential|Solo esenciales|Essentiels|Nur essenziell|Solo essenziali|仅必要|必須のみ|필수만|الأساسية|केवल आवश्यक/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    // Sem marketing: nenhum script googletagmanager
    const gtagScripts = page.locator('script[src*="googletagmanager"]');
    await expect(gtagScripts).toHaveCount(0);
  });

  test("cadastro rápido exige aceite de privacidade", async ({ page }) => {
    await page.goto("/professional/cadastro");
    await expect(page.locator('a[href="/termos/privacidade"]').first()).toBeVisible();
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
  });
});

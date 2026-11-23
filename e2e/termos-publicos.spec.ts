import { expect, test } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";

test.describe("termos públicos", () => {
  test("uso e privacidade são públicos e com pendência jurídica", async ({ page }) => {
    for (const slug of ["uso", "privacidade"] as const) {
      const res = await page.goto(`/termos/${slug}`);
      expect(res?.ok()).toBe(true);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("article")).toContainText(/validação jurídica|legal validation|Pendiente|In attesa|待/i);
    }
  });

  test("cadastro profissional e empresa apontam para os termos", async ({ page }) => {
    await page.goto("/professional/register");
    await expect(page.locator('a[href="/termos/uso"]').first()).toBeVisible();
    await expect(page.locator('a[href="/termos/privacidade"]').first()).toBeVisible();

    await page.goto("/company/register");
    await expect(page.locator('a[href="/termos/uso"]').first()).toBeVisible();
    await expect(page.locator('a[href="/termos/privacidade"]').first()).toBeVisible();
  });

  test("árabe em /termos/uso aplica lang/dir", async ({ page }) => {
    await page.context().addCookies([
      { name: "ri-locale", value: "ar", url: baseURL },
    ]);
    await page.goto("/termos/uso");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});

test.describe("auth walls por área", () => {
  test("sem sessão: dashboard → home; admin → login", async ({ request }) => {
    const pro = await request.get("/professional/dashboard", { maxRedirects: 0 });
    expect(pro.status()).toBe(307);
    expect(pro.headers().location || "").toMatch(/\/?$/);

    const company = await request.get("/company/dashboard-empresa", { maxRedirects: 0 });
    expect(company.status()).toBe(307);
    expect(company.headers().location || "").toMatch(/\/?$/);

    const admin = await request.get("/admin", { maxRedirects: 0 });
    expect(admin.status()).toBe(307);
    expect(admin.headers().location || "").toContain("/login");
  });
});

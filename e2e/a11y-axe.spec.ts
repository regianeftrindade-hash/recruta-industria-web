/**
 * Auditoria axe nas páginas críticas (públicas + autenticadas quando houver secrets).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  companyE2eCredentials,
  loginCompanyViaApi,
  loginProfessionalViaApi,
  professionalE2eCredentials,
} from "./helpers/auth";

async function dismissCookieBanner(page: Page) {
  const essentials = page.getByRole("button", { name: /essenciais/i });
  if (await essentials.isVisible().catch(() => false)) {
    await essentials.click();
  }
}

async function assertNoSeriousViolations(page: Page, label: string) {
  await dismissCookieBanner(page);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  if (serious.length) {
    const summary = serious
      .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
      .join("\n");
    throw new Error(`[axe:${label}]\n${summary}`);
  }
  expect(serious, label).toEqual([]);
}

test.describe("a11y axe — páginas críticas", () => {
  test("home", async ({ page }) => {
    await page.goto("/");
    await assertNoSeriousViolations(page, "home");
  });

  test("login admin surface", async ({ page }) => {
    await page.goto("/login");
    await assertNoSeriousViolations(page, "login");
  });

  test("cadastro profissional", async ({ page }) => {
    await page.goto("/professional/cadastro");
    await assertNoSeriousViolations(page, "cadastro-profissional");
  });

  test("cadastro empresa", async ({ page }) => {
    await page.goto("/company/cadastro");
    await assertNoSeriousViolations(page, "cadastro-empresa");
  });

  test("vagas", async ({ page }) => {
    await page.goto("/vagas");
    await assertNoSeriousViolations(page, "vagas");
  });

  test("painel profissional", async ({ page, request }) => {
    const creds = professionalE2eCredentials();
    test.skip(!creds, "E2E_PROFESSIONAL_* ausente");
    await loginProfessionalViaApi(request, page, creds!.email, creds!.password);
    await page.goto("/professional/dashboard");
    await expect(page.locator("body")).toBeVisible();
    await assertNoSeriousViolations(page, "painel-profissional");
  });

  test("painel empresa + entrevistas", async ({ page, request }) => {
    const creds = companyE2eCredentials();
    test.skip(!creds, "E2E_COMPANY_* ausente");
    await loginCompanyViaApi(request, page, creds!.email, creds!.password);
    await page.goto("/company/dashboard-empresa?tab=inicio");
    await expect(page.getByRole("tablist", { name: /dashboard/i })).toBeVisible({
      timeout: 20_000,
    });
    await assertNoSeriousViolations(page, "painel-empresa");
    await page.goto("/company/dashboard-empresa/entrevistas");
    await expect(page.getByRole("tablist", { name: /dashboard/i })).toBeVisible({
      timeout: 20_000,
    });
    await assertNoSeriousViolations(page, "entrevistas");
  });
});

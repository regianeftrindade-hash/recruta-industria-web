/**
 * E2E empresa: funil + atalho Meu Plano (requer E2E_COMPANY_*).
 * Login inválido falha o job (continue-on-error no CI → aviso amarelo, não trava o resto).
 */
import { expect, test } from "@playwright/test";
import { companyE2eCredentials, loginCompanyViaApi } from "./helpers/auth";
import { clickDashNav } from "./helpers/nav";

const creds = companyE2eCredentials();

const FUNIL_HEADING = /entrevistas e acompanhamento|^\s*entrevistas\s*$|propostas/i;
const FUNIL_BODY =
  /propostas ativas|entrevistas agendadas|nenhuma proposta|quando você agendar entrevistas|aguardando confirmação|confirmada|clique para abrir/i;

test.describe("empresa logada — funil e plano", () => {
  test.skip(
    !creds,
    "Skip: defina E2E_COMPANY_EMAIL e E2E_COMPANY_PASSWORD. Ver docs/e2e-secrets.md",
  );

  test.beforeEach(async ({ page, request }) => {
    await loginCompanyViaApi(request, page, creds!.email, creds!.password);
  });

  test("abre dashboard empresa e vê busca/vitrine", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");
    await expect(page).toHaveURL(/dashboard-empresa/);
    await expect(page.getByText(/busca rápida/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/profissionais na vitrine|banco de talentos/i).first()).toBeVisible();
  });

  test("navega para aba Entrevistas e vê funil proposta→entrevista", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");

    const propostasNav = page
      .getByRole("button", { name: /propostas/i })
      .or(page.getByRole("link", { name: /propostas/i }))
      .or(page.getByRole("tab", { name: /propostas/i }));
    if ((await propostasNav.count()) > 0) {
      await expect(propostasNav.first()).toBeVisible({ timeout: 20_000 });
      await propostasNav.first().click();
    } else {
      await clickDashNav(page, /entrevistas/i);
    }

    await expect(page).toHaveURL(/entrevistas|tab=entrevistas|propostas|tab=propostas/i);
    await expect(page.getByRole("heading", { name: FUNIL_HEADING }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(FUNIL_BODY).first()).toBeVisible();
  });

  test("abre Entrevistas via URL direta", async ({ page }) => {
    await page.goto("/company/dashboard-empresa?tab=entrevistas");
    await expect(page).toHaveURL(/tab=entrevistas|\/entrevistas/i);
    await expect(page.getByRole("heading", { name: FUNIL_HEADING }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(FUNIL_BODY).first()).toBeVisible();
  });

  test("atalho Gerenciar plano abre Meu Plano", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");
    await expect(page.getByText(/busca rápida/i).first()).toBeVisible({ timeout: 20_000 });
    const btn = page.getByRole("button", { name: /gerenciar plano/i });
    await expect(btn).toBeVisible({ timeout: 15_000 });
    await btn.click();
    await expect(page).toHaveURL(/tab=meu-plano|\/meu-plano/i);
    await expect(page.getByText(/meu plano|assinatura|plano/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});

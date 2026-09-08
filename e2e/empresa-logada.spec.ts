import { expect, test } from "@playwright/test";
import { companyE2eCredentials, loginCompanyViaApi } from "./helpers/auth";
import { clickDashNav } from "./helpers/nav";

const creds = companyE2eCredentials();

/** Funil/aba Entrevistas: headings e empty/cards — flexível com ou sem dados. */
const FUNIL_HEADING = /entrevistas e acompanhamento|^\s*entrevistas\s*$|propostas/i;
const FUNIL_BODY =
  /propostas ativas|entrevistas agendadas|nenhuma proposta|quando você agendar entrevistas|aguardando confirmação|confirmada|clique para abrir/i;

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

  test("navega para aba Entrevistas e vê funil proposta→entrevista", async ({ page }) => {
    await page.goto("/company/dashboard-empresa");

    // Preferir “Propostas” se existir; senão a aba Entrevistas (funil unificado).
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

    // Heading da aba/funil (evita casar só com o botão da nav via role=heading).
    await expect(page.getByRole("heading", { name: FUNIL_HEADING }).first()).toBeVisible({
      timeout: 20_000,
    });

    // Empty-state OU seções do funil OU cards — não flaky se houver dados.
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
});

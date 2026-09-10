import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("home carrega com marca", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/recruta/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("home: Sou Profissional e Sou Empresa vão ao login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sou profissional/i }).click();
    await expect(page).toHaveURL(/\/login\?tipo=profissional/);
    await expect(page.getByText(/acesso profissional/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /^entrar$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /fazer cadastro/i })).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: /sou empresa/i }).click();
    await expect(page).toHaveURL(/\/login\?tipo=empresa/);
    await expect(page.getByText(/acesso empresa/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /fazer cadastro/i })).toBeVisible();
  });

  test("login: Fazer cadastro abre o registro do tipo", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/professional\/register/);

    await page.goto("/login?tipo=empresa");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/company\/register/);
  });

  test("login profissional e empresa abrem", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await expect(page.getByText(/acesso profissional|profissional/i).first()).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await expect(page.getByText(/acesso empresa|empresa/i).first()).toBeVisible();
  });

  test("cadastro profissional mostra etapas e valida antes de avançar", async ({ page }) => {
    await page.goto("/professional/register");
    await expect(
      page.getByRole("heading", { name: /cadastro do profissional|você já tem cadastro/i }),
    ).toBeVisible();
    // Sessão já logada com cadastro completo → tela de aviso (ok no smoke).
    const jaTem = await page
      .getByRole("heading", { name: /você já tem cadastro/i })
      .isVisible()
      .catch(() => false);
    if (jaTem) {
      await expect(page.getByRole("link", { name: /ir ao painel/i })).toBeVisible();
      return;
    }
    await expect(page.getByLabel(/etapas do cadastro/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /voltar/i })).toBeDisabled();
    await page.getByRole("button", { name: /continuar/i }).click();
    await expect(
      page.getByText(/complete os obrigatórios|obrigatórios desta etapa/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /voltar/i })).toBeDisabled();
  });

  test("cadastro empresa: formulário ou aviso se já logado", async ({ page }) => {
    await page.goto("/company/register");
    await expect(
      page.getByRole("heading", { name: /cadastro empresa|você já tem cadastro|conta profissional detectada/i }),
    ).toBeVisible({ timeout: 20_000 });
  });
});

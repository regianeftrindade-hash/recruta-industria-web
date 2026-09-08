import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("home carrega com marca", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/recruta/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login profissional e empresa abrem", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await expect(page.getByText(/acesso profissional|profissional/i).first()).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await expect(page.getByText(/acesso empresa|empresa/i).first()).toBeVisible();
  });

  test("cadastro profissional mostra etapas e valida antes de avançar", async ({ page }) => {
    await page.goto("/professional/register");
    await expect(page.getByRole("heading", { name: /cadastro do profissional/i })).toBeVisible();
    await expect(page.getByLabel(/etapas do cadastro/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /continuar/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /voltar/i })).toBeDisabled();
    await page.getByRole("button", { name: /continuar/i }).click();
    // Sem preencher a etapa, Continuar não avança — mostra o aviso e Voltar segue desabilitado.
    await expect(page.getByText(/complete os obrigatórios|obrigatórios desta etapa/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("button", { name: /voltar/i })).toBeDisabled();
  });

  test("cadastro empresa tem seções recolhíveis", async ({ page }) => {
    await page.goto("/company/register");
    await expect(page.getByRole("heading", { name: /cadastro empresa/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /dados da empresa/i })).toBeVisible();
  });
});

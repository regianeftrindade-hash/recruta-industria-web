import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("home carrega com marca", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/recruta/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("home: Cadastre-se abre o cadastro completo do profissional e o da empresa", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/professional/register"]').click();
    await expect(page).toHaveURL(/\/professional\/register/);
    await expect(page.getByRole("heading", { name: /complete seu perfil/i })).toBeVisible();

    await page.goto("/");
    await page.locator('a[href="/company/cadastro"]').click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.getByText(/cadastro empresa/i).first()).toBeVisible();
  });

  test("login profissional sem tipo nao existe e o cadastro abre pelo login", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/login");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/professional\/register/);
    await expect(page.getByRole("heading", { name: /complete seu perfil/i })).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.getByText(/cadastro empresa/i).first()).toBeVisible();
  });

  test("login profissional e empresa abrem", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/acesso profissional|profissional/i).first()).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await expect(page.getByText(/acesso empresa|empresa/i).first()).toBeVisible();
  });

  test("cadastro profissional abre o formulário completo", async ({ page }) => {
    await page.goto("/professional/cadastro");
    await expect(page).toHaveURL(/\/professional\/register/);
    await expect(page.getByRole("heading", { name: /complete seu perfil/i })).toBeVisible();
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    await expect(page.getByText(/cadastro em 4 etapas/i)).toBeVisible();
  });

  test("cadastro empresa mostra o formulário e recusa senhas diferentes", async ({ page }) => {
    await page.goto("/company/cadastro");
    await expect(page.getByText(/cadastro empresa/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByLabel(/razão social/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();

    await page.getByLabel(/razão social/i).fill("Indústria Teste");
    await page.getByLabel(/^e-mail$/i).fill("e2e-smoke-empresa@example.invalid");
    await page.getByLabel(/^criar senha$/i).fill("SenhaForte!2026");
    await page.getByLabel(/^confirmar senha$/i).fill("OutraSenha!2026");
    await page.getByRole("button", { name: /criar conta/i }).click();
    await expect(page.getByText(/senhas não conferem/i)).toBeVisible();
    await expect(page).toHaveURL(/\/company\/cadastro/);
  });
});

import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("home carrega com marca", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/recruta/i);
    await expect(page.locator("body")).toBeVisible();
  });

  test("home: Cadastre-se abre o cadastro rápido do profissional e o da empresa", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/professional/cadastro"]').click();
    await expect(page).toHaveURL(/\/professional\/cadastro/);
    await expect(page.getByText(/cadastro rápido/i)).toBeVisible();
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    await expect(page.getByLabel(/^cpf$/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/telefone/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/company/cadastro"]').click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.getByRole("heading", { name: /cadastro empresa/i })).toBeVisible();
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
  });

  test("login profissional sem tipo nao existe e o cadastro abre pelo login", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/login");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/professional\/register/);
    await expect(page.getByRole("heading", { name: /complete seu perfil/i })).toBeVisible();
    await expect(page.getByText(/vídeo de apresentação/i)).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await page.getByRole("button", { name: /fazer cadastro/i }).click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
  });

  test("login profissional e empresa abrem", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/acesso profissional|profissional/i).first()).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await expect(page.getByText(/acesso empresa|empresa/i).first()).toBeVisible();
  });

  test("cadastro rápido do profissional pede nome, CPF, e-mail, telefone e senha", async ({ page }) => {
    await page.goto("/professional/cadastro");
    await expect(page).toHaveURL(/\/professional\/cadastro$/);
    await expect(page.getByText(/cadastro rápido/i)).toBeVisible();
    await expect(page.getByLabel(/nome completo/i)).toBeVisible();
    await expect(page.getByLabel(/^cpf$/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/telefone/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toBeVisible();
    await expect(page.getByText(/vídeo de apresentação/i)).toHaveCount(0);
  });

  test("cadastro empresa abre a lista completa do perfil", async ({ page }) => {
    await page.goto("/company/cadastro");
    await expect(page.getByRole("heading", { name: /cadastro empresa/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
    await expect(page.locator("#empresa-cpf")).toBeVisible();
    await expect(page.locator("#empresa-senha")).toBeVisible();
    await expect(page.getByText(/termos/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta/i })).toHaveCount(0);
  });
});

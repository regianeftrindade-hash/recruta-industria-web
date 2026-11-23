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
    await expect(page.getByText(/cadastro rápido|registo rápido|quick signup/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/nome completo|full name/i)).toBeVisible();
    await expect(page.getByLabel(/^cpf$/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/telefone|phone/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$|^password$|^palavra-passe$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta|create account|criar conta/i })).toBeVisible();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/company/cadastro"]').click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.getByRole("heading", { name: /cadastro empresa|registo empresa|company/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("#empresa-pais")).toBeVisible();
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
    await expect(page.getByRole("link", { name: /voltar.*página inicial|back to the home/i })).toBeVisible();
  });

  test("login?tipo=profissional e empresa abrem a tela certa e o cadastro pelo login", async ({ page }) => {
    await page.goto("/login?tipo=profissional");
    await expect(page).toHaveURL(/\/login\?tipo=profissional/);
    await expect(page.getByText(/acesso profissional|professional access/i).first()).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-senha")).toBeVisible();
    // Com ?tipo= não mostra abas — só o fluxo escolhido
    await expect(page.getByRole("button", { name: /^(empresa|company)$/i })).toHaveCount(0);

    await page.getByRole("button", { name: /fazer cadastro|create account|criar conta/i }).click();
    await expect(page).toHaveURL(/\/professional\/register/);
    await expect(page.getByRole("heading", { name: /complete seu perfil|complete your profile/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voltar.*página inicial|back to the home/i })).toBeVisible();

    await page.goto("/login?tipo=empresa");
    await expect(page).toHaveURL(/\/login\?tipo=empresa/);
    await expect(page.getByText(/acesso empresa|company access/i).first()).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.getByRole("button", { name: /^(profissional|professional)$/i })).toHaveCount(0);

    await page.getByRole("button", { name: /fazer cadastro|create account|criar conta/i }).click();
    await expect(page).toHaveURL(/\/company\/cadastro/);
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
  });

  test("login sem tipo mostra abas profissional e empresa", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/acesso profissional|professional access/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /profissional|professional/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /empresa|company/i })).toBeVisible();
  });

  test("cadastro rápido do profissional pede nome, CPF, e-mail, telefone e senha", async ({ page }) => {
    await page.goto("/professional/cadastro");
    await expect(page).toHaveURL(/\/professional\/cadastro$/);
    await expect(page.getByText(/cadastro rápido|registo rápido|quick signup/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByLabel(/nome completo|full name/i)).toBeVisible();
    await expect(page.getByLabel(/^cpf$/i)).toBeVisible();
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expect(page.getByLabel(/telefone|phone/i)).toBeVisible();
    await expect(page.getByLabel(/^senha$|^password$|^palavra-passe$/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta|create account/i })).toBeVisible();
    // O pitch lateral menciona vídeo; o formulário rápido não tem campo de vídeo.
    await expect(page.locator("#cadastro-nome")).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  test("cadastro empresa abre formulário com país, documentos BR e senha", async ({ page }) => {
    await page.goto("/company/cadastro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#empresa-pais")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/cadastro empresa|registo empresa|company registration/i).first()).toBeVisible();
    await expect(page.locator("#empresa-razao-social")).toBeVisible();
    await expect(page.locator("#empresa-cnpj")).toBeVisible();
    await expect(page.locator("#empresa-cpf")).toBeVisible();
    await expect(page.locator("#empresa-senha")).toBeVisible();
    await expect(page.getByRole("button", { name: /criar conta|create account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /voltar.*página inicial|back to the home/i })).toBeVisible();
  });
});

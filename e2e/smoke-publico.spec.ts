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

  test("login?tipo=profissional e empresa redirecionam para a home (login público)", async ({ page }) => {
    await page.goto("/login?tipo=profissional", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/(?:\?acesso=profissional)?$/);
    await expect(page.locator("#acesso-profissional")).toBeVisible();
    await expect(page.locator("#pro-home-email")).toBeVisible();
    await expect(page.locator('a[href="/professional/cadastro"]')).toBeVisible();

    await page.goto("/login?tipo=empresa", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/\?acesso=empresa/);
    await expect(page.locator("#acesso-empresa")).toBeVisible();
    await expect(page.locator('a[href="/company/cadastro"]')).toBeVisible();
  });

  test("login sem tipo público também cai na home; admin mantém /login", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("#acesso-profissional")).toBeVisible();

    await page.goto("/login?redirect=/admin", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin|\/login\?redirect=\/admin/);
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("esqueci senha: voltar ao login vai para a home", async ({ page }) => {
    await page.goto("/esqueci-senha?tipo=profissional", { waitUntil: "domcontentloaded" });
    const cookieDialog = page.getByRole("dialog");
    if (await cookieDialog.isVisible().catch(() => false)) {
      await cookieDialog.getByRole("button").first().click();
    }
    await page.locator('a[href="/?acesso=profissional"]').click();
    await expect(page).toHaveURL(/\/\?acesso=profissional$/);
    await expect(page.locator("#acesso-profissional")).toBeVisible();
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

  test("lista pública de vagas expõe filtros de país e moeda quando disponíveis", async ({ page }) => {
    await page.goto("/vagas", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /vagas|jobs|vacantes|offres/i }).first()).toBeVisible({
      timeout: 20_000,
    });
    const pais = page.locator('select[name="pais"]');
    const moeda = page.locator('select[name="moeda"]');
    if ((await pais.count()) === 0 || (await moeda.count()) === 0) {
      test.info().annotations.push({
        type: "note",
        description: "Filtros país/moeda ainda ausentes no alvo (pré-deploy da Etapa B)",
      });
      return;
    }
    await expect(pais).toBeVisible();
    await expect(moeda).toBeVisible();
    await pais.selectOption("US");
    await moeda.selectOption("USD");
    await page.getByRole("button", { name: /buscar|search|rechercher|suchen/i }).click();
    await expect(page).toHaveURL(/pais=US/);
    await expect(page).toHaveURL(/moeda=USD/);
  });

  test("idioma: cookie ri-locale aplica lang/dir em home, login e cadastro (inclui RTL árabe)", async ({
    page,
    context,
  }) => {
    const api = context.request;

    // Accept-Language sem cookie
    await context.clearCookies();
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.setExtraHTTPHeaders({});

    const samples: Array<{ locale: string; dir: "ltr" | "rtl"; path: string }> = [
      { locale: "en", dir: "ltr", path: "/" },
      { locale: "es", dir: "ltr", path: "/" },
      { locale: "ar", dir: "rtl", path: "/professional/cadastro" },
      { locale: "zh-CN", dir: "ltr", path: "/company/register" },
    ];

    for (const sample of samples) {
      const res = await api.post("/api/account/locale", {
        data: { locale: sample.locale },
      });
      expect(res.ok(), `locale ${sample.locale}`).toBeTruthy();
      const payload = await res.json();
      expect(payload.locale).toBe(sample.locale);

      await page.goto(sample.path, { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", sample.locale);
      await expect(page.locator("html")).toHaveAttribute("dir", sample.dir);
    }

    // Alias /api/locale (pode 404 em produção até o deploy desta etapa)
    await context.clearCookies();
    const alias = await api.post("/api/locale", { data: { locale: "ar" } });
    const aliasPayload = alias.ok() ? await alias.json().catch(() => null) : null;
    if (aliasPayload?.locale === "ar") {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Alias /api/locale ainda ausente no alvo; validado via /api/account/locale",
      });
      const fallback = await api.post("/api/account/locale", { data: { locale: "ar" } });
      expect(fallback.ok()).toBeTruthy();
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    }
  });
});

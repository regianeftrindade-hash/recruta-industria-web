import type { APIRequestContext, Page } from "@playwright/test";

/**
 * Login via NextAuth credentials (sem mexer na UI do login).
 * Credenciais: E2E_COMPANY_* / E2E_PROFESSIONAL_* — ver docs/e2e-secrets.md
 */
export async function loginViaApi(
  request: APIRequestContext,
  page: Page,
  email: string,
  password: string,
  callbackUrl: string,
): Promise<void> {
  const csrfRes = await request.get("/api/auth/csrf");
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = csrfJson.csrfToken;
  if (!csrfToken) {
    throw new Error("CSRF token ausente — NextAuth não respondeu /api/auth/csrf");
  }

  const loginRes = await request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email,
      password,
      redirect: "false",
      json: "true",
      callbackUrl,
    },
  });

  if (!loginRes.ok() && loginRes.status() !== 302) {
    throw new Error(`Login API falhou: HTTP ${loginRes.status()}`);
  }

  const state = await request.storageState();
  await page.context().addCookies(state.cookies);
}

export async function loginCompanyViaApi(
  request: APIRequestContext,
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await loginViaApi(request, page, email, password, "/company/dashboard-empresa");
}

export async function loginProfessionalViaApi(
  request: APIRequestContext,
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await loginViaApi(request, page, email, password, "/professional/dashboard");
}

export function companyE2eCredentials(): { email: string; password: string } | null {
  const email = (process.env.E2E_COMPANY_EMAIL || "").trim();
  const password = (process.env.E2E_COMPANY_PASSWORD || "").trim();
  if (!email || !password) return null;
  return { email, password };
}

export function professionalE2eCredentials(): { email: string; password: string } | null {
  const email = (process.env.E2E_PROFESSIONAL_EMAIL || "").trim();
  const password = (process.env.E2E_PROFESSIONAL_PASSWORD || "").trim();
  if (!email || !password) return null;
  return { email, password };
}

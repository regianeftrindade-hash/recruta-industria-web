import type { APIRequestContext, Page } from "@playwright/test";

export class E2eLoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "E2eLoginError";
  }
}

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
  if (!csrfRes.ok()) {
    throw new E2eLoginError(`CSRF HTTP ${csrfRes.status()} — site ou NextAuth indisponível`);
  }
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  const csrfToken = csrfJson.csrfToken;
  if (!csrfToken) {
    throw new E2eLoginError("CSRF token ausente — NextAuth não respondeu /api/auth/csrf");
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

  const status = loginRes.status();
  let body: { url?: string; error?: string } = {};
  try {
    body = (await loginRes.json()) as { url?: string; error?: string };
  } catch {
    /* corpo não-JSON (redirect/html) */
  }

  if (body.error || (!loginRes.ok() && status !== 302)) {
    throw new E2eLoginError(
      `Login falhou (HTTP ${status}${body.error ? `, ${body.error}` : ""}). ` +
        `Confira e-mail/senha dos secrets E2E no GitHub — conta deve existir em produção.`,
    );
  }

  const state = await request.storageState();
  const hasSession = state.cookies.some(
    (c) =>
      c.name.includes("session-token") ||
      c.name === "next-auth.session-token" ||
      c.name === "__Secure-next-auth.session-token",
  );
  if (!hasSession) {
    throw new E2eLoginError(
      "Login sem cookie de sessão — e-mail/senha dos secrets E2E provavelmente inválidos.",
    );
  }

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

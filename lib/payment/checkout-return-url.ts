/**
 * URLs de retorno do Stripe Checkout.
 * Em Preview na Vercel (*.vercel.app), o Deployment Protection (SSO) bloqueia o
 * redirect do cartão. Anexamos o bypass de automação só em Preview — Production
 * usa domínio customizado e não precisa disso.
 * Não altera a proteção SSO do restante do Preview nem de Production.
 */
export function isVercelPreviewRuntime(): boolean {
  return (process.env.VERCEL_ENV || "").trim() === "preview";
}

export function previewProtectionBypassSecret(): string | null {
  const value = (process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "").trim();
  return value || null;
}

/** Acrescenta x-vercel-protection-bypass quando estamos em Preview com secret. */
export function withPreviewProtectionBypass(url: string): string {
  if (!isVercelPreviewRuntime()) return url;
  const secret = previewProtectionBypassSecret();
  if (!secret) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("x-vercel-protection-bypass")) {
      parsed.searchParams.set("x-vercel-protection-bypass", secret);
    }
    // Cookie helper oficial da Vercel para manter a sessão após o primeiro hit
    if (!parsed.searchParams.has("x-vercel-set-bypass-cookie")) {
      parsed.searchParams.set("x-vercel-set-bypass-cookie", "true");
    }
    return parsed.toString();
  } catch {
    const join = url.includes("?") ? "&" : "?";
    return `${url}${join}x-vercel-protection-bypass=${encodeURIComponent(secret)}&x-vercel-set-bypass-cookie=true`;
  }
}

/**
 * Base pública do checkout. Em Preview use NEXTAUTH_URL no alias estável
 * (ex.: recruta-industria-preview-stripe.vercel.app) — nunca o host efêmero
 * do deploy, senão o cookie de sessão/SSO não acompanha o retorno do Stripe.
 */
export function resolveCheckoutBaseUrl(): string {
  const explicit = (
    process.env.NEXTAUTH_URL
    || process.env.APP_URL
    || ""
  )
    .trim()
    .replace(/\/$/, "");
  if (explicit) return explicit;
  return "https://www.recrutaindustria.com";
}

export function stripeCheckoutReturnUrls(input: {
  baseUrl: string;
  successPath: string;
  cancelPath: string;
  paymentReference?: string;
}): { successUrl: string; cancelUrl: string } {
  const base = input.baseUrl.replace(/\/$/, "");
  const success = new URL(input.successPath, `${base}/`);
  if (input.paymentReference) {
    success.searchParams.set("success", "1");
    success.searchParams.set("ref", input.paymentReference);
  }
  const cancel = new URL(input.cancelPath, `${base}/`);
  cancel.searchParams.set("canceled", "1");
  return {
    successUrl: withPreviewProtectionBypass(success.toString()),
    cancelUrl: withPreviewProtectionBypass(cancel.toString()),
  };
}

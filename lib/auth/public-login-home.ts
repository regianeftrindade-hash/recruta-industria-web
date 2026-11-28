/**
 * Login público acontece em `/login` (vitrine + formulário).
 * Admin permanece em `/login?redirect=/admin…`.
 */

export function isAdminLoginRedirect(redirect: string | null | undefined): boolean {
  const value = String(redirect || "").trim();
  return value === "/admin" || value.startsWith("/admin/");
}

export function safePostLoginPath(raw: string | null | undefined): string | null {
  const value = String(raw || "").trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }
  return value;
}

export type PublicLoginHomeOpts = {
  tipo?: string | null;
  redirect?: string | null;
};

/**
 * Href para “voltar ao login” / logout / guard sem sessão.
 * Admin permanece em `/login?redirect=/admin…`.
 * Público: `/login` ou `/login?tipo=profissional|empresa` (+ redirect opcional).
 */
export function publicLoginHomeHref(opts: PublicLoginHomeOpts = {}): string {
  const redirect = safePostLoginPath(opts.redirect);
  if (redirect && isAdminLoginRedirect(redirect)) {
    return `/login?redirect=${encodeURIComponent(redirect)}`;
  }

  const params = new URLSearchParams();

  const tipo = String(opts.tipo || "").toLowerCase();
  if (tipo === "empresa" || tipo === "company") {
    params.set("tipo", "empresa");
  } else if (tipo === "profissional" || tipo === "professional") {
    params.set("tipo", "profissional");
  }

  if (redirect) params.set("redirect", redirect);

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
}

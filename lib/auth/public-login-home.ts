/**
 * Login público acontece na home (`/`).
 * A página `/login` com vitrine lateral fica só para admin (`?redirect=/admin…`).
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
 */
export function publicLoginHomeHref(opts: PublicLoginHomeOpts = {}): string {
  const redirect = safePostLoginPath(opts.redirect);
  if (redirect && isAdminLoginRedirect(redirect)) {
    return `/login?redirect=${encodeURIComponent(redirect)}`;
  }

  const params = new URLSearchParams();
  if (redirect) params.set("redirect", redirect);

  const tipo = String(opts.tipo || "").toLowerCase();
  if (tipo === "empresa" || tipo === "company") {
    params.set("acesso", "empresa");
  } else if (tipo === "profissional" || tipo === "professional") {
    params.set("acesso", "profissional");
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

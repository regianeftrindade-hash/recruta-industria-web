/** Link dos e-mails de profissional e de empresa: a home, onde a pessoa entra na conta. */
export function emailHomeUrl(baseUrl?: string | null): string {
  const base = String(baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/`;
}

/**
 * Sem sessão, o painel citado nos e-mails ia para o login e de lá para o cadastro.
 * Esses caminhos abrem a home.
 */
export function destinoEmailSemSessao(pathname: string): "/" | null {
  if (
    pathname === "/professional/dashboard"
    || pathname.startsWith("/professional/dashboard/")
    || pathname === "/company/dashboard-empresa"
    || pathname.startsWith("/company/dashboard-empresa/")
  ) {
    return "/";
  }
  return null;
}

/**
 * Controle de papel para rotas de página (proxy/edge).
 * APIs continuam com verificação própria (Prisma / require*).
 * O JWT assinado (userType/isAdmin) é a fonte no edge; não usar claims do browser.
 */

export type ProtectedArea = "professional" | "company";

export type AppAccountRole = "PROFESSIONAL" | "COMPANY" | "ADMIN";

export function protectedAreaForPath(pathname: string): ProtectedArea | null {
  if (pathname.startsWith("/professional")) return "professional";
  if (pathname.startsWith("/company")) return "company";
  return null;
}

export function homePathForRole(role: AppAccountRole): string {
  if (role === "COMPANY") return "/company/dashboard-empresa";
  if (role === "ADMIN") return "/admin";
  return "/professional/dashboard";
}

export function loginRedirectForArea(area: ProtectedArea): string {
  // Login público na página /login com tipo (home comercial não tem formulários).
  return area === "company" ? "/login?tipo=empresa" : "/login?tipo=profissional";
}

/**
 * Decide se o token assinado pode acessar a área.
 * ADMIN acessa profissional e empresa (suporte operacional).
 */
export function canRoleAccessArea(
  area: ProtectedArea,
  opts: { userType?: unknown; isAdmin?: unknown },
): boolean {
  if (opts.isAdmin === true) return true;
  const t = String(opts.userType || "").toUpperCase();
  if (area === "professional") return t === "PROFESSIONAL" || t === "ADMIN";
  if (area === "company") return t === "COMPANY" || t === "ADMIN";
  return false;
}

export type ProtectedRouteDecision =
  | { action: "allow" }
  | {
      action: "unauthenticated";
      redirectPath: string;
      preserveRedirectQuery: boolean;
    }
  | { action: "wrong_role"; redirectPath: string };

export function decideProtectedRouteAccess(input: {
  pathname: string;
  hasEmail: boolean;
  userType?: unknown;
  isAdmin?: unknown;
  /** Path quando e-mail de notificação sem sessão (opcional). */
  emailHomePath?: string | null;
}): ProtectedRouteDecision {
  const area = protectedAreaForPath(input.pathname);
  if (!area) return { action: "allow" };

  if (!input.hasEmail) {
    return {
      action: "unauthenticated",
      redirectPath: input.emailHomePath || loginRedirectForArea(area),
      preserveRedirectQuery: !input.emailHomePath,
    };
  }

  if (!canRoleAccessArea(area, input)) {
    const t = String(input.userType || "").toUpperCase();
    const role: AppAccountRole =
      t === "COMPANY" ? "COMPANY" : t === "ADMIN" ? "ADMIN" : "PROFESSIONAL";
    return { action: "wrong_role", redirectPath: homePathForRole(role) };
  }

  return { action: "allow" };
}

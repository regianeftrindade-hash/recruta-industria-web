/**
 * Controle de papel para rotas de página (proxy/edge).
 * APIs continuam com verificação própria (Prisma / require*).
 * O JWT assinado (userType/isAdmin) é a fonte no edge; não usar claims do browser.
 */

export type ProtectedArea = "professional" | "company";

export type AppAccountRole = "PROFESSIONAL" | "COMPANY" | "ADMIN";

/**
 * Área protegida a partir do pathname (sem query).
 */
export function protectedAreaForPath(pathname: string): ProtectedArea | null {
  if (
    pathname === "/professional" ||
    pathname.startsWith("/professional/")
  ) {
    return "professional";
  }
  if (pathname === "/company" || pathname.startsWith("/company/")) {
    return "company";
  }
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
  role: string | null | undefined,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (!role) return false;
  if (area === "professional") return role === "PROFESSIONAL";
  if (area === "company") return role === "COMPANY";
  return false;
}

export type RouteAccessDecision =
  | { action: "allow" }
  | {
      action: "unauthenticated";
      redirectPath: string;
      preserveRedirectQuery?: boolean;
    }
  | { action: "wrong_role"; redirectPath: string };

/**
 * Fonte única usada pelo proxy para decidir acesso a rotas de página.
 */
export function decideProtectedRouteAccess(input: {
  pathname: string;
  hasEmail: boolean;
  userType: unknown;
  isAdmin: boolean;
  emailHomePath?: string | null;
}): RouteAccessDecision {
  const area = protectedAreaForPath(input.pathname);
  if (!area) return { action: "allow" };

  if (!input.hasEmail) {
    return {
      action: "unauthenticated",
      redirectPath: input.emailHomePath || loginRedirectForArea(area),
      preserveRedirectQuery: !input.emailHomePath,
    };
  }

  const role =
    typeof input.userType === "string" ? input.userType.toUpperCase() : null;

  if (!canRoleAccessArea(area, role, input.isAdmin === true)) {
    // Papel errado: manda para a home da conta, não para login.
    if (role === "COMPANY") {
      return { action: "wrong_role", redirectPath: homePathForRole("COMPANY") };
    }
    if (role === "ADMIN" || input.isAdmin) {
      return { action: "wrong_role", redirectPath: homePathForRole("ADMIN") };
    }
    return {
      action: "wrong_role",
      redirectPath: homePathForRole("PROFESSIONAL"),
    };
  }

  return { action: "allow" };
}

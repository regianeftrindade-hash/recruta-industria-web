/**
 * Controle de papel para rotas de página (proxy/edge).
 * APIs continuam com verificação própria (Prisma / require*).
 * O JWT assinado (userType/isAdmin) é a fonte no edge; não usar claims do browser.
 */

export type AppAccountRole = "PROFESSIONAL" | "COMPANY" | "ADMIN";

export type ProtectedArea = "professional" | "company";

export function normalizeAccountRole(raw: unknown): AppAccountRole | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toUpperCase();
  if (value === "PROFESSIONAL" || value === "COMPANY" || value === "ADMIN") {
    return value;
  }
  return null;
}

/** Área exigida pela URL protegida, ou null se a rota não for de área de conta. */
export function protectedAreaForPath(pathname: string): ProtectedArea | null {
  if (
    pathname === "/professional/dashboard"
    || pathname.startsWith("/professional/dashboard/")
    || pathname === "/professional/pagamento"
    || pathname.startsWith("/professional/pagamento/")
  ) {
    return "professional";
  }

  if (
    pathname === "/company/dashboard-empresa"
    || pathname.startsWith("/company/dashboard-empresa/")
    || pathname === "/company/pagamento"
    || pathname.startsWith("/company/pagamento/")
    || pathname.startsWith("/company/professional/")
    || pathname.startsWith("/company/profissional/")
  ) {
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
  role: AppAccountRole | null,
  area: ProtectedArea,
  opts?: { isAdmin?: boolean },
): boolean {
  if (opts?.isAdmin === true || role === "ADMIN") return true;
  if (!role) return false;
  if (area === "professional") return role === "PROFESSIONAL";
  return role === "COMPANY";
}

export type RoleGuardDecision =
  | { action: "allow" }
  | { action: "unauthenticated"; redirectPath: string; preserveRedirectQuery: boolean }
  | { action: "wrong_role"; redirectPath: string };

/**
 * @param emailHomePath — resultado de destinoEmailSemSessao (ex.: "/" para dashboards).
 */
export function decideProtectedRouteAccess(input: {
  pathname: string;
  hasEmail: boolean;
  userType: unknown;
  isAdmin?: boolean;
  emailHomePath?: string | null;
}): RoleGuardDecision {
  const area = protectedAreaForPath(input.pathname);
  if (!area) return { action: "allow" };

  if (!input.hasEmail) {
    if (input.emailHomePath) {
      return {
        action: "unauthenticated",
        redirectPath: input.emailHomePath,
        preserveRedirectQuery: false,
      };
    }
    return {
      action: "unauthenticated",
      redirectPath: loginRedirectForArea(area),
      preserveRedirectQuery: true,
    };
  }

  const role = normalizeAccountRole(input.userType);
  if (canRoleAccessArea(role, area, { isAdmin: input.isAdmin === true })) {
    return { action: "allow" };
  }

  // Papel conhecido mas inadequado → área correta (evita loop com login).
  if (role) {
    return { action: "wrong_role", redirectPath: homePathForRole(role) };
  }

  // Sessão sem userType confiável: manda ao login tipado com redirect.
  return {
    action: "unauthenticated",
    redirectPath: loginRedirectForArea(area),
    preserveRedirectQuery: true,
  };
}

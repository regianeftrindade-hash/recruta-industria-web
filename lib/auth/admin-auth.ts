import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { timingSafeEqual } from "crypto";
import { matchesCompanyTestBypass } from "@/lib/company/company-test-bypass";

const DEV_FALLBACK_KEY = "dev-key-12345";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(
  email: string,
  role?: string | null,
): boolean {
  if (role === "ADMIN") {
    return true;
  }

  const normalized = email.toLowerCase().trim();

  if (getAdminEmails().includes(normalized)) {
    return true;
  }

  // Conta de teste não recebe admin em produção.
  if (process.env.NODE_ENV === "development") {
    return matchesCompanyTestBypass({
      email: normalized,
    });
  }

  return false;
}

export function hasAdminAccess(params: {
  isAdmin?: boolean;
  email?: string | null;
  role?: string | null;
}): boolean {
  if (params.isAdmin === true) {
    return true;
  }

  if (!params.email) {
    return false;
  }

  return isAdminUser(params.email, params.role);
}

export function validateAdminApiKey(
  apiKey: string | null | undefined,
): boolean {
  if (!apiKey) {
    return false;
  }

  const expected = process.env.ADMIN_API_KEY?.trim();

  if (!expected) {
    return (
      process.env.NODE_ENV === "development" &&
      apiKey === DEV_FALLBACK_KEY
    );
  }

  try {
    const a = Buffer.from(apiKey);
    const b = Buffer.from(expected);

    return (
      a.length === b.length &&
      timingSafeEqual(a, b)
    );
  } catch {
    return false;
  }
}

async function hasAdminSession(
  request: NextRequest,
): Promise<boolean> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  return hasAdminAccess({
    isAdmin: token?.isAdmin === true,
    email:
      typeof token?.email === "string"
        ? token.email
        : null,
    role:
      typeof token?.userType === "string"
        ? token.userType
        : null,
  });
}

export async function requireAdmin(
  request: NextRequest,
  options?: {
    apiKey?: string | null;
  },
): Promise<NextResponse | null> {
  if (
    options?.apiKey &&
    validateAdminApiKey(options.apiKey)
  ) {
    return null;
  }

  const headerKey = request.headers.get("x-admin-api-key");

  if (validateAdminApiKey(headerKey)) {
    return null;
  }

  if (await hasAdminSession(request)) {
    return null;
  }

  return NextResponse.json(
    { error: "Não autorizado" },
    { status: 401 },
  );
}
import type { NextRequest, NextResponse } from "next/server";
import { encode, getToken } from "next-auth/jwt";
import type { SupportedLocale } from "@/lib/i18n/locales";

const SESSION_MAX_AGE = 8 * 60 * 60;

function sessionCookieName(): string {
  const secure = (process.env.NEXTAUTH_URL || "").startsWith("https://");
  return `${secure ? "__Secure-" : ""}next-auth.session-token`;
}

/**
 * A conta autenticada vence o cookie na leitura.
 * Sem regravar o JWT, a tela continuaria no idioma antigo por vários minutos.
 * Token fatiado (`.0`) não é reescrito, para não derrubar a sessão.
 */
export async function writeSessionLocale(
  request: NextRequest,
  response: NextResponse,
  locale: SupportedLocale,
): Promise<void> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return;

  const name = sessionCookieName();
  if (request.cookies.get(`${name}.0`)) return;

  try {
    const token = await getToken({ req: request, secret });
    if (!token) return;
    token.locale = locale;
    const secure = name.startsWith("__Secure-");
    const encoded = await encode({ token, secret, maxAge: SESSION_MAX_AGE });
    response.cookies.set(name, encoded, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure,
      maxAge: SESSION_MAX_AGE,
    });
  } catch (error) {
    console.error("[i18n] Não atualizei o token de sessão:", error);
  }
}

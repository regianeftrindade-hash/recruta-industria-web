import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/auth/admin-auth";
import { getToken } from "next-auth/jwt";
import {
  ADMIN_2FA_COOKIE,
  admin2faCookieOptions,
  createAdmin2faToken,
  isAdmin2faRequired,
  recordAdmin2faSuccess,
  verifyAdmin2faToken,
} from "@/lib/security/admin-2fa";
import { verify2FACode, logAudit, store2FACode } from "@/lib/security";
import { generateSecureOtpCode } from "@/lib/security.server";
import { sendEmail } from "@/lib/email";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";
import { ensureSecurityAuditTable } from "@/lib/security/audit-store";

async function requireAdminSession(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const email = typeof token?.email === "string" ? token.email : null;
  if (
    !hasAdminAccess({
      isAdmin: token?.isAdmin === true,
      email,
      role: typeof token?.userType === "string" ? token.userType : null,
    })
  ) {
    return null;
  }
  return email!.toLowerCase().trim();
}

/** Envia código 2FA para o admin logado. */
export async function POST(request: NextRequest) {
  try {
    await ensureSecurityAuditTable();
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (!(await enforceApiRateLimit(`admin-2fa:${ip}`, 8, 5 * 60 * 1000))) {
      return NextResponse.json({ error: "Muitas tentativas" }, { status: 429 });
    }

    const email = await requireAdminSession(request);
    if (!email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const code = generateSecureOtpCode();
    store2FACode(`admin:${email}`, code);
    logAudit("admin_2fa_sent", email, ip, userAgent, "success", "Código 2FA admin enviado");

    await sendEmail({
      to: email,
      subject: "Código de acesso admin — Recruta Indústria",
      text: `Seu código de verificação do painel admin é: ${code}\nVálido por 5 minutos.`,
      html: `<p>Seu código de verificação do painel admin é: <strong style="font-size:20px">${code}</strong></p><p>Válido por 5 minutos.</p>`,
    });

    return NextResponse.json({
      success: true,
      message: "Código enviado para o e-mail do admin.",
      code: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("admin 2fa POST:", error);
    return NextResponse.json({ error: "Erro ao enviar código" }, { status: 500 });
  }
}

/** Valida código e grava cookie httpOnly de 2FA admin. */
export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const email = await requireAdminSession(request);
    if (!email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body.code || "").trim();
    if (!code) {
      return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });
    }

    const ok = verify2FACode(`admin:${email}`, code, 5);
    if (!ok) {
      logAudit("admin_2fa_failed", email, ip, userAgent, "failure", "Código inválido");
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    const token = createAdmin2faToken(email);
    const res = NextResponse.json({ success: true, message: "2FA validado" });
    res.cookies.set(ADMIN_2FA_COOKIE, token, admin2faCookieOptions());
    logAudit("admin_2fa_success", email, ip, userAgent, "success", "2FA admin OK");
    void recordAdmin2faSuccess(email, ip);
    return res;
  } catch (error) {
    console.error("admin 2fa PUT:", error);
    return NextResponse.json({ error: "Erro ao validar código" }, { status: 500 });
  }
}

/** Status: se 2FA é exigido e se o cookie atual é válido. */
export async function GET(request: NextRequest) {
  const email = await requireAdminSession(request);
  if (!email) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cookie = request.cookies.get(ADMIN_2FA_COOKIE)?.value;
  return NextResponse.json({
    required: isAdmin2faRequired(),
    verified: verifyAdmin2faToken(cookie, email),
    email,
  });
}

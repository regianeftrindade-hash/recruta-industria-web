import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  isValidEmail,
  checkRegisterRateLimit,
  incrementRegisterAttempts,
  resetRegisterAttempts,
  logAudit,
  isIPBlocked,
  blockIP,
  getBlockedIPTimeRemaining,
} from "@/lib/security";
import { hashPassword } from "@/lib/security.server";
import { validatePasswordStrength } from "@/lib/password-strength";
import { logAudit as logSecurityAudit } from "@/lib/security-audit";

/**
 * Cadastro simples do profissional: nome + e-mail + senha.
 * Não cria Profile completo — o painel pede para finalizar o cadastro depois.
 */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (isIPBlocked(ip)) {
      const timeRemaining = getBlockedIPTimeRemaining(ip);
      return NextResponse.json(
        {
          error: `Acesso bloqueado temporariamente. Aguarde ${timeRemaining} segundos.`,
          statusCode: 429,
          retryAfter: timeRemaining,
        },
        { status: 429 },
      );
    }

    if (!checkRegisterRateLimit(ip, 10, 15 * 60 * 1000)) {
      blockIP(ip);
      return NextResponse.json(
        {
          error:
            "Muitas tentativas de cadastro. Aguarde 15 minutos e tente novamente.",
          statusCode: 429,
          retryAfter: 900,
        },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }

    const body = await request.json();
    const nome = String(body.name || body.nome || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!nome || nome.length < 2) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        { error: "Informe seu nome completo." },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    if (!password || !confirmPassword) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        { error: "Senha e confirmação são obrigatórias." },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: "Senhas não conferem." }, { status: 400 });
    }

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isStrong) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        {
          error: "Senha não atende aos requisitos de segurança.",
          feedback: passwordStrength.feedback,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      incrementRegisterAttempts(ip);
      const contaOAuth = !existing.passwordHash;
      return NextResponse.json(
        {
          error: contaOAuth
            ? "Este e-mail já foi usado no login com Google. Entre com Google e complete o perfil no painel."
            : "Este e-mail já está cadastrado. Faça login ou recupere a senha.",
          code: contaOAuth ? "OAUTH_ACCOUNT_EXISTS" : "EMAIL_ALREADY_REGISTERED",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name: nome,
        role: "PROFESSIONAL",
        passwordHash,
      },
    });

    resetRegisterAttempts(ip);
    logAudit("register_simple_success", email, ip, userAgent, "success", "simple_signup");
    await logSecurityAudit("registration_success", email, "account_created_simple", {
      userType: "PROFESSIONAL",
      ip,
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[register-simple]", error);
    return NextResponse.json(
      { error: "Não foi possível criar a conta. Tente novamente." },
      { status: 500 },
    );
  }
}

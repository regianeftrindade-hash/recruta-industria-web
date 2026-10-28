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
import { formatCPF, isValidCPF, isValidPhoneBR } from "@/lib/security";
import { logAudit as logSecurityAudit } from "@/lib/security-audit";
import {
  corporateEmailError,
  resolveCompanyRegistrationEmails,
} from "@/lib/company/corporate-email";
import { isCorporateEmailVerified } from "@/lib/company/corporate-email-confirmation";
import { saveCompanyExtraData } from "@/lib/company-storage";

/**
 * Cadastro simples: profissional (nome) ou empresa (razão social) + e-mail + senha.
 * Perfil/cadastro completo fica para o painel.
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
    const userTypeRaw = String(body.userType || "professional").toLowerCase();
    const isCompany = userTypeRaw === "company" || userTypeRaw === "empresa";
    const nome = String(body.name || body.nome || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const cpfLimpo = String(body.cpf || "").replace(/\D/g, "");
    const telefone = String(body.telefone || body.phone || "").trim();

    if (!nome || nome.length < 2) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        {
          error: isCompany
            ? "Informe a razão social ou nome da empresa."
            : "Informe seu nome completo.",
        },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
    }

    if (!isCompany) {
      if (!isValidCPF(cpfLimpo)) {
        incrementRegisterAttempts(ip);
        return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
      }
      if (!isValidPhoneBR(telefone)) {
        incrementRegisterAttempts(ip);
        return NextResponse.json(
          { error: "Telefone inválido. Informe DDD + número." },
          { status: 400 },
        );
      }
      const cpfFormatado = formatCPF(cpfLimpo);
      const cpfEmUso = await prisma.profile.findFirst({
        where: { OR: [{ cpf: cpfFormatado }, { cpf: cpfLimpo }] },
        select: { id: true },
      });
      if (cpfEmUso) {
        incrementRegisterAttempts(ip);
        return NextResponse.json(
          { error: "Este CPF já está cadastrado. Entre com a conta ou recupere a senha." },
          { status: 409 },
        );
      }
    }

    const emailsEmpresa = isCompany
      ? resolveCompanyRegistrationEmails({
          loginEmail: email,
          emailCorporativo:
            typeof body.emailCorporativo === "string" ? body.emailCorporativo : "",
        })
      : null;

    if (emailsEmpresa?.emailCorporativo) {
      const emailCorporativoErro = corporateEmailError(emailsEmpresa.emailCorporativo);
      if (emailCorporativoErro) {
        incrementRegisterAttempts(ip);
        return NextResponse.json({ error: emailCorporativoErro }, { status: 400 });
      }
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
            ? "Este e-mail já foi usado no login com Google. Entre com Google e complete o cadastro no painel."
            : isCompany
              ? "Este e-mail pessoal já está cadastrado. Use outro e-mail de login ou entre com essa conta."
              : "Este e-mail já está cadastrado. Faça login ou recupere a senha.",
          code: contaOAuth ? "OAUTH_ACCOUNT_EXISTS" : "EMAIL_ALREADY_REGISTERED",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const role = isCompany ? "COMPANY" : "PROFESSIONAL";
    const cpfFormatado = formatCPF(cpfLimpo);

    const user = isCompany
      ? await prisma.user.create({
          data: {
            email,
            name: nome,
            role,
            passwordHash,
          },
        })
      : await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              email,
              name: nome,
              role,
              passwordHash,
            },
          });
          await tx.profile.create({
            data: {
              userId: created.id,
              title: "Profissional",
              location: "Não informado",
              email,
              phone: telefone,
              cpf: cpfFormatado,
              isVisible: false,
              profileCompletion: 0,
              formDataJSON: JSON.stringify({
                cadastroRapido: true,
                nome,
                email,
                cpf: cpfFormatado,
                telefone,
              }),
            },
          });
          await tx.professional.create({
            data: { userId: created.id, title: "Profissional" },
          });
          return created;
        });

    if (isCompany) {
      await prisma.company.create({
        data: {
          userId: user.id,
          name: nome,
        },
      });

      if (emailsEmpresa?.emailCorporativo) {
        const emailCorporativoVerificado = await isCorporateEmailVerified(
          emailsEmpresa.emailCorporativo,
        );
        await saveCompanyExtraData(user.id, {
          emailCorporativo: emailsEmpresa.emailCorporativo,
          emailCorporativoVerificado,
        });
      }
    }

    resetRegisterAttempts(ip);
    logAudit("register_simple_success", email, ip, userAgent, "success", `simple_signup_${role}`);
    await logSecurityAudit("registration_success", email, "account_created_simple", {
      userType: role,
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

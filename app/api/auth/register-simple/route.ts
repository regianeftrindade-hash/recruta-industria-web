import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
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
import { formatCPF } from "@/lib/security";
import { registrationDocumentError, registrationPhoneError } from "@/lib/identity/registration-documents";
import { resolveNewRegistrationCountry } from "@/lib/identity/registration-region";
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
 * Brasil: CPF obrigatório para profissional. Exterior: sem CPF/CNPJ.
 */
export async function POST(request: NextRequest) {
  try {
    bindLocale(await resolveInterfaceLocale());
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
            t("registration.ui.muitas-tentativas-de-cadastro-aguarde-15-minutos-e-tente-novamen"),
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
    const region = resolveNewRegistrationCountry(body.countryCode);
    if (!region.ok) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: region.error }, { status: 400 });
    }

    if (!nome || nome.length < 2) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        {
          error: isCompany
            ? t("registration.ui.informe-a-razao-social-ou-nome-da-empresa")
            : t("registration.simple.nameRequired"),
        },
        { status: 400 },
      );
    }

    if (!email || !isValidEmail(email)) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: t("registration.ui.e-mail-invalido") }, { status: 400 });
    }

    const countryCode = region.region.countryCode;
    const isBrazil = countryCode === "BR";

    if (!isCompany) {
      if (isBrazil) {
        const cpfErro = registrationDocumentError(
          cpfLimpo,
          "CPF",
          "BR",
          t("registration.simple.cpfInvalid"),
        );
        if (cpfErro) {
          incrementRegisterAttempts(ip);
          return NextResponse.json({ error: cpfErro }, { status: 400 });
        }
        const cpfFormatadoCheck = formatCPF(cpfLimpo);
        const cpfEmUso = await prisma.profile.findFirst({
          where: { OR: [{ cpf: cpfFormatadoCheck }, { cpf: cpfLimpo }] },
          select: { id: true },
        });
        if (cpfEmUso) {
          incrementRegisterAttempts(ip);
          return NextResponse.json(
            { error: t("registration.ui.este-cpf-ja-esta-cadastrado-entre-com-a-conta-ou-recupere-a-senh") },
            { status: 409 },
          );
        }
      } else if (cpfLimpo) {
        incrementRegisterAttempts(ip);
        return NextResponse.json(
          { error: t("registration.simple.cpfBrazilOnly") },
          { status: 400 },
        );
      }
      if (telefone) {
        const telefoneErro = registrationPhoneError(
          telefone,
          countryCode,
          t("registration.simple.phoneInvalid"),
        );
        if (telefoneErro) {
          incrementRegisterAttempts(ip);
          return NextResponse.json({ error: telefoneErro }, { status: 400 });
        }
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
        { error: t("registration.ui.senha-e-confirmacao-sao-obrigatorias") },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      incrementRegisterAttempts(ip);
      return NextResponse.json({ error: t("registration.simple.passwordMismatch") }, { status: 400 });
    }

    const passwordStrength = validatePasswordStrength(password);
    if (!passwordStrength.isStrong) {
      incrementRegisterAttempts(ip);
      return NextResponse.json(
        {
          error: t("registration.simple.passwordWeak"),
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
            ? t("registration.ui.este-e-mail-ja-foi-usado-no-login-com-google-entre-com-google-e-")
            : isCompany
              ? t("registration.ui.este-e-mail-pessoal-ja-esta-cadastrado-use-outro-e-mail-de-login")
              : t("registration.ui.este-e-mail-ja-esta-cadastrado-faca-login-ou-recupere-a-senha"),
          code: contaOAuth ? "OAUTH_ACCOUNT_EXISTS" : "EMAIL_ALREADY_REGISTERED",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const role = isCompany ? "COMPANY" : "PROFESSIONAL";
    const cpfFormatado = cpfLimpo && isBrazil ? formatCPF(cpfLimpo) : "";

    const user = isCompany
      ? await prisma.user.create({
          data: {
            email,
            name: nome,
            role,
            passwordHash,
            ...region.region,
          },
        })
      : await prisma.$transaction(async (tx) => {
          const created = await tx.user.create({
            data: {
              email,
              name: nome,
              role,
              passwordHash,
              ...region.region,
            },
          });
          await tx.profile.create({
            data: {
              userId: created.id,
              ...region.region,
              title: "Profissional",
              location: "Não informado",
              email,
              phone: telefone,
              ...(cpfFormatado ? { cpf: cpfFormatado } : {}),
              isVisible: false,
              profileCompletion: 0,
              formDataJSON: JSON.stringify({
                cadastroRapido: true,
                nome,
                email,
                ...(cpfFormatado ? { cpf: cpfFormatado } : {}),
                telefone,
              }),
            },
          });
          await tx.professional.create({
            data: { userId: created.id, title: "Profissional", ...region.region },
          });
          return created;
        });

    if (isCompany) {
      await prisma.company.create({
        data: {
          userId: user.id,
          name: nome,
          ...region.region,
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
      countryCode,
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
      { error: t("registration.ui.nao-foi-possivel-criar-a-conta-tente-novamente") },
      { status: 500 },
    );
  }
}

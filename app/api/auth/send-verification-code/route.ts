import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { isEmailConfigured, sendEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/security';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale';
import { t } from '@/lib/i18n/translate';
import type { SupportedLocale } from '@/lib/i18n/locales';

const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

async function saveVerification(email: string, code: string): Promise<boolean> {
  try {
    await prisma.emailVerification.deleteMany({ where: { email } });

    await prisma.emailVerification.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    return true;
  } catch (error) {
    console.error('Erro ao salvar verificação:', error);
    return false;
  }
}

function buildVerificationEmail(code: string, locale: SupportedLocale) {
  const subject = t('mail.verification.subject', locale);
  const text = t('mail.verification.text', locale).split('{code}').join(code);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color: #8D6B1F; margin-bottom: 8px;">Recruta Indústria</h2>
      <p style="font-size: 15px; line-height: 1.5;">${t('mail.verification.intro', locale)}</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0; color: #000;">${code}</p>
      <p style="font-size: 13px; color: #555; line-height: 1.5;">${t('mail.verification.expiry', locale)}</p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">${t('mail.verification.ignore', locale)}</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendVerificationEmail(
  email: string,
  code: string,
  locale: SupportedLocale,
): Promise<boolean> {
  const { subject, text, html } = buildVerificationEmail(code, locale);

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[DEV] Código de verificação para ${email}: ${code}`);
      return true;
    }
    return false;
  }

  return sendEmail({ to: email, subject, html, text });
}

export async function POST(req: NextRequest) {
  try {
    const locale = await resolveInterfaceLocale();
    const ip = getClientIp(req);
    if (!(await enforceApiRateLimit(`send-verify:${ip}`, 8, 10 * 60 * 1000))) {
      return NextResponse.json(
        { error: t('mail.verification.rateLimit', locale) },
        { status: 429 },
      );
    }

    const { email: rawEmail } = await req.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { error: t('mail.verification.emailRequired', locale) },
        { status: 400 },
      );
    }

    const email = rawEmail.toLowerCase().trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: t('mail.verification.emailInvalid', locale) },
        { status: 400 },
      );
    }

    const activeCode = await prisma.emailVerification.findFirst({
      where: { email },
      orderBy: { expiresAt: 'desc' },
    });

    if (activeCode && activeCode.expiresAt > new Date()) {
      const createdRecently =
        activeCode.expiresAt.getTime() - CODE_TTL_MS + RESEND_COOLDOWN_MS > Date.now();

      if (createdRecently) {
        return NextResponse.json(
          { error: t('mail.verification.waitResend', locale) },
          { status: 429 },
        );
      }
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    const saved = await saveVerification(email, code);
    if (!saved) {
      return NextResponse.json(
        { error: t('mail.verification.generateError', locale) },
        { status: 500 },
      );
    }

    const sent = await sendVerificationEmail(email, code, locale);

    if (!sent) {
      await prisma.emailVerification.deleteMany({ where: { email } });

      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: t('mail.verification.smtpUnavailable', locale) },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: t('mail.verification.smtpMissing', locale) },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: isEmailConfigured()
        ? t('mail.verification.sent', locale)
        : t('mail.verification.devMode', locale),
      email,
    });
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    const locale = await resolveInterfaceLocale().catch(() => 'pt-BR' as const);
    return NextResponse.json(
      { error: t('mail.verification.sendError', locale) },
      { status: 500 },
    );
  }
}

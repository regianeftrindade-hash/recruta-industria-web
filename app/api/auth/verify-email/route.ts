import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale';
import { t } from '@/lib/i18n/translate';

export async function POST(req: NextRequest) {
  try {
    const locale = await resolveInterfaceLocale();
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: t('mail.verification.emailAndCodeRequired', locale) },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedCode = String(code).trim();

    const verification = await prisma.emailVerification.findFirst({
      where: { email: normalizedEmail },
      orderBy: { expiresAt: 'desc' },
    });

    if (!verification || verification.code !== normalizedCode) {
      return NextResponse.json(
        { error: t('mail.verification.invalidOrExpired', locale) },
        { status: 401 },
      );
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.deleteMany({ where: { email: normalizedEmail } });
      return NextResponse.json(
        { error: t('mail.verification.expired', locale) },
        { status: 401 },
      );
    }

    await prisma.emailVerification.deleteMany({ where: { email: normalizedEmail } });

    const token = crypto.randomBytes(32).toString('hex');

    return NextResponse.json({
      token,
      email: normalizedEmail,
      verified: true,
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    const locale = await resolveInterfaceLocale().catch(() => 'pt-BR' as const);
    return NextResponse.json(
      { error: t('mail.verification.verifyError', locale) },
      { status: 500 },
    );
  }
}

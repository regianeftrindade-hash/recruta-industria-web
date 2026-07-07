import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
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
        { error: 'Código inválido ou expirado' },
        { status: 401 },
      );
    }

    if (verification.expiresAt < new Date()) {
      await prisma.emailVerification.deleteMany({ where: { email: normalizedEmail } });
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo.' },
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
    return NextResponse.json(
      { error: 'Erro ao verificar email' },
      { status: 500 },
    );
  }
}

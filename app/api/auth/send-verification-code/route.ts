import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { isEmailConfigured, sendEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/security';

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

function buildVerificationEmail(code: string) {
  const subject = 'Seu código de verificação — Recruta Indústria';
  const text = `Seu código de verificação é: ${code}\n\nEle expira em 10 minutos.\n\nSe você não solicitou este código, ignore este e-mail.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      <h2 style="color: #8D6B1F; margin-bottom: 8px;">Recruta Indústria</h2>
      <p style="font-size: 15px; line-height: 1.5;">Use o código abaixo para verificar seu e-mail:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; margin: 24px 0; color: #000;">${code}</p>
      <p style="font-size: 13px; color: #555; line-height: 1.5;">Este código expira em <strong>10 minutos</strong>.</p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">Se você não solicitou este código, pode ignorar esta mensagem.</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const { subject, text, html } = buildVerificationEmail(code);

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
    const { email: rawEmail } = await req.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
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
          { error: 'Aguarde um minuto antes de solicitar um novo código' },
          { status: 429 },
        );
      }
    }

    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');

    const saved = await saveVerification(email, code);
    if (!saved) {
      return NextResponse.json({ error: 'Erro ao gerar código de verificação' }, { status: 500 });
    }

    const sent = await sendVerificationEmail(email, code);

    if (!sent) {
      await prisma.emailVerification.deleteMany({ where: { email } });

      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Serviço de e-mail indisponível. Tente novamente mais tarde.' },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: 'Configure SMTP no .env para enviar o código por e-mail.' },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: isEmailConfigured()
        ? 'Código de verificação enviado para seu e-mail.'
        : 'Código gerado (modo desenvolvimento).',
      email,
    });
  } catch (error) {
    console.error('Erro ao enviar código de verificação:', error);
    return NextResponse.json({ error: 'Erro ao enviar código' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { isEmailConfigured, sendEmail } from '@/lib/email';
import {
  corporateEmailError,
  getAppBaseUrl,
  normalizeCorporateEmail,
} from '@/lib/company/corporate-email';
import { createCorporateEmailConfirmation } from '@/lib/company/corporate-email-confirmation';

function buildConfirmationEmail(confirmUrl: string) {
  const subject = 'Confirme seu e-mail corporativo — Recruta Indústria';
  const text = [
    'Olá,',
    '',
    'Recebemos o cadastro da sua empresa no Recruta Indústria.',
    'Para continuar, confirme seu e-mail corporativo acessando o link abaixo:',
    '',
    confirmUrl,
    '',
    'Este link expira em 24 horas.',
    '',
    'Se você não solicitou este cadastro, ignore este e-mail.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111;">
      <h2 style="color: #8D6B1F; margin-bottom: 8px;">Recruta Indústria</h2>
      <p style="font-size: 15px; line-height: 1.5;">
        Recebemos o cadastro da sua empresa. Para continuar, confirme seu <strong>e-mail corporativo</strong>:
      </p>
      <p style="margin: 28px 0;">
        <a href="${confirmUrl}"
           style="display: inline-block; background: linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%);
                  color: #000; text-decoration: none; font-weight: bold; padding: 14px 22px; border-radius: 8px;">
          Confirmar e-mail corporativo
        </a>
      </p>
      <p style="font-size: 13px; color: #555; line-height: 1.5;">
        Ou copie e cole este link no navegador:<br />
        <a href="${confirmUrl}" style="color: #8D6B1F; word-break: break-all;">${confirmUrl}</a>
      </p>
      <p style="font-size: 12px; color: #888; margin-top: 24px;">
        Este link expira em 24 horas. Se você não solicitou este cadastro, ignore esta mensagem.
      </p>
    </div>
  `;

  return { subject, text, html };
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'E-mail corporativo é obrigatório.' }, { status: 400 });
    }

    const email = normalizeCorporateEmail(rawEmail);
    const validationError = corporateEmailError(email);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { token, cooldownActive } = await createCorporateEmailConfirmation(email);

    if (cooldownActive) {
      return NextResponse.json(
        { error: 'Aguarde um minuto antes de solicitar um novo e-mail de confirmação.' },
        { status: 429 },
      );
    }

    const confirmUrl = `${getAppBaseUrl()}/api/company/confirm-corporate-email?token=${token}`;
    const { subject, text, html } = buildConfirmationEmail(confirmUrl);

    if (!isEmailConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.info(`[DEV] Link de confirmação corporativo para ${email}: ${confirmUrl}`);
        return NextResponse.json({
          success: true,
          message: `Enviamos um e-mail de confirmação para ${email}. Acesse o link no e-mail para continuar o cadastro.`,
          email,
          devConfirmUrl: confirmUrl,
        });
      }

      return NextResponse.json(
        { error: 'Serviço de e-mail indisponível. Configure SMTP para enviar a confirmação.' },
        { status: 503 },
      );
    }

    const sent = await sendEmail({ to: email, subject, html, text });
    if (!sent) {
      return NextResponse.json(
        { error: 'Não foi possível enviar o e-mail de confirmação. Tente novamente.' },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Enviamos um e-mail de confirmação para ${email}. Acesse o link no e-mail para continuar o cadastro.`,
      email,
    });
  } catch (error) {
    console.error('Erro ao enviar confirmação de e-mail corporativo:', error);
    return NextResponse.json({ error: 'Erro ao enviar e-mail de confirmação.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, updateUserPassword } from '@/lib/users'
import { logAudit, validatePasswordStrength } from '@/lib/security'
import {
  generatePasswordResetToken,
  verifyPasswordResetToken,
  consumePasswordResetToken,
  hashPassword,
} from '@/lib/security.server'
import { sendEmail } from '@/lib/email'
import { enforceApiRateLimit, getClientIp, maskEmail } from '@/lib/security/api-guard'

function appBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXTAUTH_URL?.trim() || process.env.APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!(await enforceApiRateLimit(`reset-ip:${ip}`, 5, 15 * 60 * 1000))) {
      logAudit('password_reset_request', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 },
      )
    }

    const { email } = await request.json()
    const normalized = typeof email === 'string' ? email.toLowerCase().trim() : ''

    if (!normalized) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    if (!(await enforceApiRateLimit(`reset-email:${normalized}`, 3, 15 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Muitas tentativas para este e-mail. Tente novamente em 15 minutos.' },
        { status: 429 },
      )
    }

    const user = await findUserByEmail(normalized)

    if (user) {
      const token = generatePasswordResetToken(normalized)
      const resetUrl = `${appBaseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`
      logAudit('password_reset_requested', normalized, ip, userAgent, 'success', 'Token generated')

      await sendEmail({
        to: normalized,
        subject: 'Redefinição de senha — Recruta Indústria',
        text: `Recebemos um pedido para redefinir sua senha.\n\nAbra o link (válido por 1 hora):\n${resetUrl}\n\nSe você não pediu isso, ignore este e-mail.`,
        html: `
          <p>Recebemos um pedido para redefinir sua senha no <strong>Recruta Indústria</strong>.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#c89b3c;color:#000;font-weight:700;text-decoration:none;border-radius:8px;">Redefinir senha</a></p>
          <p style="font-size:13px;color:#555;">Link válido por 1 hora. Se você não pediu isso, ignore este e-mail.</p>
        `,
      })

      return NextResponse.json({
        success: true,
        message: 'Se o email existe, você receberá um link de reset',
        token: process.env.NODE_ENV === 'development' ? token : undefined,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Se o email existe, você receberá um link de reset',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })
    }

    const email = verifyPasswordResetToken(token)

    if (!email) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      email: maskEmail(email),
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao verificar token' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!(await enforceApiRateLimit(`reset-patch:${ip}`, 10, 15 * 60 * 1000))) {
      return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })
    }

    const { token, newPassword, confirmPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 },
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Senhas não conferem' }, { status: 400 })
    }

    const strength = validatePasswordStrength(newPassword)
    if (!strength.isStrong) {
      return NextResponse.json(
        { error: 'Senha fraca. Use no mínimo 8 caracteres, letra maiúscula, número e símbolo.' },
        { status: 400 },
      )
    }

    const email = verifyPasswordResetToken(token)

    if (!email) {
      logAudit('password_reset_failed', 'unknown', ip, userAgent, 'failure', 'Invalid token')
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const hashedPassword = await hashPassword(newPassword)
    await updateUserPassword(user.id, hashedPassword)
    consumePasswordResetToken(token)

    logAudit('password_reset_success', email, ip, userAgent, 'success', 'Password reset completed')

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao resetar senha' }, { status: 500 })
  }
}

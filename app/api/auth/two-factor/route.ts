import { NextRequest, NextResponse } from 'next/server'
import { store2FACode, verify2FACode, logAudit } from '@/lib/security'
import { generateSecureOtpCode } from '@/lib/security.server'
import { resolveAuthEmail } from '@/lib/auth/api-auth'
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard'
import { sendEmail } from '@/lib/email'

/** 2FA: exige sessão autenticada. Em produção envia código por e-mail (não devolve o código). */
export async function POST(request: NextRequest) {
  try {
    if (process.env.ENABLE_2FA !== 'true' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '2FA não habilitado neste ambiente' },
        { status: 403 },
      )
    }

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!(await enforceApiRateLimit(`2fa:${ip}`, 5, 5 * 60 * 1000))) {
      logAudit('2fa_request', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 5 minutos.' },
        { status: 429 },
      )
    }

    const auth = await resolveAuthEmail(request)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const code = generateSecureOtpCode()
    store2FACode(auth.email, code)
    logAudit('2fa_code_generated', auth.email, ip, userAgent, 'success', 'Two-factor code generated')

    await sendEmail({
      to: auth.email,
      subject: 'Código de verificação — Recruta Indústria',
      text: `Seu código de verificação é: ${code}\nVálido por 5 minutos.`,
      html: `<p>Seu código de verificação é: <strong>${code}</strong></p><p>Válido por 5 minutos.</p>`,
    })

    return NextResponse.json({
      success: true,
      message: 'Código 2FA enviado. Válido por 5 minutos.',
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao gerar código 2FA' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const auth = await resolveAuthEmail(request)
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })
    }

    const isValid = verify2FACode(auth.email, String(code), 5)

    if (!isValid) {
      logAudit('2fa_verification_failed', auth.email, ip, userAgent, 'failure', 'Invalid 2FA code')
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 })
    }

    logAudit('2fa_verification_success', auth.email, ip, userAgent, 'success', '2FA OK')

    return NextResponse.json({
      success: true,
      message: 'Autenticação 2FA validada com sucesso',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao verificar código 2FA' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { store2FACode, verify2FACode, logAudit } from '@/lib/security'
import { generateSecureOtpCode } from '@/lib/security.server'
import { resolveAuthEmail } from '@/lib/auth/api-auth'
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard'
import { sendEmail } from '@/lib/email'
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale'
import { t } from '@/lib/i18n/translate'

/** 2FA: exige sessão autenticada. Em produção envia código por e-mail (não devolve o código). */
export async function POST(request: NextRequest) {
  const locale = await resolveInterfaceLocale()
  try {
    if (process.env.ENABLE_2FA !== 'true' && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: t('mail.twoFactor.disabled', locale) },
        { status: 403 },
      )
    }

    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!(await enforceApiRateLimit(`2fa:${ip}`, 5, 5 * 60 * 1000))) {
      logAudit('2fa_request', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { error: t('mail.twoFactor.rateLimit', locale) },
        { status: 429 },
      )
    }

    const auth = await resolveAuthEmail(request)
    if (!auth) {
      return NextResponse.json({ error: t('mail.twoFactor.unauthorized', locale) }, { status: 401 })
    }

    const code = generateSecureOtpCode()
    store2FACode(auth.email, code)
    logAudit('2fa_code_generated', auth.email, ip, userAgent, 'success', 'Two-factor code generated')

    await sendEmail({
      to: auth.email,
      subject: t('mail.twoFactor.subject', locale),
      text: t('mail.twoFactor.text', locale).split('{code}').join(code),
      html: `<p>${t('mail.twoFactor.html', locale).split('{code}').join(code)}</p>`,
    })

    return NextResponse.json({
      success: true,
      message: t('mail.twoFactor.sent', locale),
      code: process.env.NODE_ENV === 'development' ? code : undefined,
    })
  } catch {
    return NextResponse.json(
      { error: t('mail.twoFactor.generateError', locale) },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  const locale = await resolveInterfaceLocale()
  try {
    const ip = getClientIp(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const auth = await resolveAuthEmail(request)
    if (!auth) {
      return NextResponse.json({ error: t('mail.twoFactor.unauthorized', locale) }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: t('mail.twoFactor.codeRequired', locale) }, { status: 400 })
    }

    const isValid = verify2FACode(auth.email, String(code), 5)

    if (!isValid) {
      logAudit('2fa_verification_failed', auth.email, ip, userAgent, 'failure', 'Invalid 2FA code')
      return NextResponse.json({ error: t('mail.twoFactor.invalid', locale) }, { status: 400 })
    }

    logAudit('2fa_verification_success', auth.email, ip, userAgent, 'success', '2FA OK')

    return NextResponse.json({
      success: true,
      message: t('mail.twoFactor.verified', locale),
    })
  } catch {
    return NextResponse.json(
      { error: t('mail.twoFactor.verifyError', locale) },
      { status: 500 },
    )
  }
}

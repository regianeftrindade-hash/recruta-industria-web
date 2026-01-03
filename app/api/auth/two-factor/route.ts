import { NextRequest, NextResponse } from 'next/server'
import { 
  generate2FACode, 
  store2FACode, 
  verify2FACode,
  checkRateLimit,
  logAudit
} from '@/lib/security'

// Gerar código 2FA
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Rate limiting: 5 requisições por IP a cada 5 minutos
    if (!checkRateLimit(`2fa-${ip}`, 5, 5 * 60 * 1000)) {
      logAudit('2fa_request', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 5 minutos.' },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Gerar código
    const code = generate2FACode()
    store2FACode(email, code)

    logAudit('2fa_code_generated', email, ip, userAgent, 'success', 'Two-factor code generated')

    // Em produção, enviar código por email/SMS
    return NextResponse.json({
      success: true,
      message: 'Código 2FA gerado. Válido por 5 minutos.',
      code: process.env.NODE_ENV === 'development' ? code : undefined, // Apenas em dev
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao gerar código 2FA' },
      { status: 500 }
    )
  }
}

// Verificar código 2FA
export async function PUT(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    const isValid = verify2FACode(email, code, 5)

    if (!isValid) {
      logAudit('2fa_verification_failed', email, ip, userAgent, 'failure', 'Invalid 2FA code')
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 400 }
      )
    }

    logAudit('2fa_verification_success', email, ip, userAgent, 'success', 'Two-factor authentication verified')

    return NextResponse.json({
      success: true,
      message: 'Autenticação 2FA validada com sucesso',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar código 2FA' },
      { status: 500 }
    )
  }
}

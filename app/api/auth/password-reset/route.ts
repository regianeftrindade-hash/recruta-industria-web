import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, updateUserPassword } from '@/lib/users'
import { 
  generatePasswordResetToken, 
  verifyPasswordResetToken,
  consumePasswordResetToken,
  hashPassword,
  checkRateLimit,
  logAudit
} from '@/lib/security'

// Solicitar reset de senha
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Rate limiting: 3 requisições por IP a cada 15 minutos
    if (!checkRateLimit(`reset-${ip}`, 3, 15 * 60 * 1000)) {
      logAudit('password_reset_request', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
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

    const user = findUserByEmail(email)
    
    if (user) {
      const token = generatePasswordResetToken(email)
      logAudit('password_reset_requested', email, ip, userAgent, 'success', 'Password reset token generated')
      
      // Em produção, enviar email com link: /reset-password?token={token}
      return NextResponse.json({
        success: true,
        message: 'Se o email existe, você receberá um link de reset',
        token: process.env.NODE_ENV === 'development' ? token : undefined, // Apenas em dev
      })
    }

    // Não revelar se email existe (segurança)
    return NextResponse.json({
      success: true,
      message: 'Se o email existe, você receberá um link de reset',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}

// Verificar validade do token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token obrigatório' },
        { status: 400 }
      )
    }

    const email = verifyPasswordResetToken(token)
    
    if (!email) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email,
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar token' },
      { status: 500 }
    )
  }
}

// Resetar senha
export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    const { token, newPassword, confirmPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Senhas não conferem' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    const email = verifyPasswordResetToken(token)

    if (!email) {
      logAudit('password_reset_failed', 'unknown', ip, userAgent, 'failure', 'Invalid token')
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    const user = findUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar senha com hash
    const hashedPassword = hashPassword(newPassword)
    updateUserPassword(user.id, hashedPassword)

    // Consumir token (invalidar)
    consumePasswordResetToken(token)

    logAudit('password_reset_success', email, ip, userAgent, 'success', 'Password reset completed')

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso',
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao resetar senha' },
      { status: 500 }
    )
  }
}

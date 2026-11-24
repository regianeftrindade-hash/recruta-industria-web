import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, updateLastLogin } from '@/lib/users'
import { logAudit, isIPBlocked, blockIP, checkRateLimit, incrementRateLimitCounter, getBlockedIPTimeRemaining, resetRateLimit } from '@/lib/security'
import { verifyPassword } from '@/lib/security.server'
import { logAudit as logSecurityAudit, lockAccount, isAccountLocked, unlockAccount } from '@/lib/security-audit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Verificar se IP está bloqueado
    if (isIPBlocked(ip)) {
      const timeRemaining = getBlockedIPTimeRemaining(ip)
      logAudit('login_attempt', 'unknown', ip, userAgent, 'failure', 'IP is blocked')
      return NextResponse.json(
        { 
          error: `Acesso bloqueado temporariamente. Por favor, aguarde ${timeRemaining} segundos antes de tentar novamente.`,
          statusCode: 403,
          retryAfter: timeRemaining
        },
        { status: 429 }
      )
    }

    // Rate limiting: 15 tentativas por IP a cada 15 minutos (aumentado para testes)
    if (!checkRateLimit(ip, 15, 15 * 60 * 1000)) {
      blockIP(ip)
      logAudit('login_attempt', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded')
      return NextResponse.json(
        { 
          error: 'Acesso bloqueado temporariamente. Você fez muitas tentativas de login. Por favor, aguarde 15 minutos antes de tentar novamente.',
          statusCode: 429,
          retryAfter: 900 // 15 minutos em segundos
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '900'
          }
        }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      incrementRateLimitCounter(ip) // Incrementar apenas ao falhar
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // NOVO: Verificar se conta está bloqueada
    const isLocked = await isAccountLocked(email)
    if (isLocked) {
      logSecurityAudit('login_blocked', email, 'account_locked', { ip })
      return NextResponse.json(
        { 
          error: 'Sua conta foi temporariamente bloqueada por excesso de tentativas de login. Tente novamente mais tarde ou contate o suporte.' 
        },
        { status: 429 }
      )
    }

    // Encontrar usuário
    const user = await findUserByEmail(email)
    if (!user) {
      // Log de tentativa com email não encontrado
      incrementRateLimitCounter(ip) // Incrementar apenas ao falhar
      logSecurityAudit('login_failed', email, 'email_not_found', { ip })
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // Verificar senha
    const passwordMatch = await verifyPassword(password, user.passwordHash)
    if (!passwordMatch) {
      // NOVO: Incrementar rate limit e registrar tentativa falhada
      incrementRateLimitCounter(ip)
      await lockAccount(email, 'Failed login attempt')
      logSecurityAudit('login_failed', email, 'invalid_password', { ip })

      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    // NOVO: Se login foi bem-sucedido, desbloquear conta se estava bloqueada
    const wasLocked = await isAccountLocked(email)
    if (wasLocked) {
      // Conta estava bloqueada, desbloqueia após login bem-sucedido
      await unlockAccount(email, 'successful_login')
    }

    // Atualizar último login com o id do usuário
    await updateLastLogin(user.id)

    // Log de sucesso
    logAudit('login_success', email, ip, userAgent, 'success', 'User logged in')
    logSecurityAudit('login_success', email, 'successful_login', { ip })
    
    // Resetar contador de tentativas para o IP após login bem-sucedido
    try {
      resetRateLimit(ip)
    } catch (err) {
      console.warn('Não foi possível resetar rate limit para IP:', ip, err)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        userType: user.role
      }
    })
  } catch (error: any) {
    console.error('Erro no login:', error)
    const errorMessage = error?.message || 'Erro ao fazer login. Verifique sua conexão e tente novamente.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

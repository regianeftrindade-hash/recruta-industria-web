import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  isValidEmail, 
  isValidCPF, 
  isValidCNPJ,
  checkRateLimit,
  incrementRateLimitCounter,
  hashPassword,
  logAudit,
  isIPBlocked,
  blockIP,
} from '@/lib/security'
import { validatePasswordStrength } from '@/lib/password-strength'
import { logAudit as logSecurityAudit, lockAccount, isAccountLocked } from '@/lib/security-audit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Verificar se IP está bloqueado
    if (isIPBlocked(ip)) {
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'IP is blocked')
      return NextResponse.json(
        { error: 'Acesso bloqueado' },
        { status: 403 }
      )
    }
    
    // Rate limiting: 5 requisições por IP a cada 15 minutos
    if (!checkRateLimit(ip, 5, 15 * 60 * 1000)) {
      blockIP(ip)
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded - IP blocked')
      return NextResponse.json(
        { 
          error: 'Acesso bloqueado temporariamente. Você fez muitas tentativas de cadastro. Por favor, aguarde 15 minutos antes de tentar novamente.',
          statusCode: 429,
          retryAfter: 900
        },
        { 
          status: 429,
          headers: { 'Retry-After': '900' }
        }
      )
    }

    const body = await request.json()
    const { email, password, confirmPassword, userType, cpf, cnpj } = body

    // Validações
    if (!email || !password || !userType) {
      incrementRateLimitCounter(ip)
      return NextResponse.json(
        { error: 'Email, senha e tipo de usuário são obrigatórios' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      incrementRateLimitCounter(ip)
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isStrong) {
      incrementRateLimitCounter(ip)
      return NextResponse.json(
        { 
          error: 'Senha não atende aos requisitos de segurança',
          feedback: passwordStrength.feedback,
          score: passwordStrength.score
        },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      incrementRateLimitCounter(ip)
      return NextResponse.json(
        { error: 'Senhas não conferem' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      incrementRateLimitCounter(ip)
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Validações específicas por tipo de usuário
    if (userType === 'professional' && cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '')
      if (!isValidCPF(cpfLimpo)) {
        incrementRateLimitCounter(ip)
        return NextResponse.json(
          { error: 'CPF inválido' },
          { status: 400 }
        )
      }
    }

    if (userType === 'company' && cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '')
      if (!isValidCNPJ(cnpjLimpo)) {
        incrementRateLimitCounter(ip)
        return NextResponse.json(
          { error: 'CNPJ inválido' },
          { status: 400 }
        )
      }
    }

    // Criar usuário no banco de dados
    const hashedPassword = hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        role: userType.toUpperCase() as 'COMPANY' | 'PROFESSIONAL',
      }
    })

    // Log de auditoria
    logAudit('register_success', email, ip, userAgent, 'success', `User registered as ${userType}`)
    await logSecurityAudit('registration_success', email, 'account_created', { userType, ip })
    
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao registrar usuário' },
      { status: 500 }
    )
  }
}

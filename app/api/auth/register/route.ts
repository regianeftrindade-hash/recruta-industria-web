import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/users'
import { 
  isValidEmail, 
  isValidCPF, 
  isValidCNPJ,
  checkRateLimit,
  hashPassword,
  logAudit,
  isIPBlocked,
  blockIP,
  generateCSRFToken,
  verifyCSRFToken
} from '@/lib/security'

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
      // Bloquear IP após exceder rate limit 3 vezes
      blockIP(ip)
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded - IP blocked')
      return NextResponse.json(
        { error: 'Muitas tentativas. Acesso bloqueado temporariamente.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, confirmPassword, userType, cpf, cnpj, nome, telefone, csrfToken } = body

    // Validações
    if (!email || !password || !userType) {
      return NextResponse.json(
        { error: 'Email, senha e tipo de usuário são obrigatórios' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Senhas não conferem' },
        { status: 400 }
      )
    }

    // Validações específicas por tipo de usuário
    if (userType === 'professional' && cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '')
      if (!isValidCPF(cpfLimpo)) {
        return NextResponse.json(
          { error: 'CPF inválido' },
          { status: 400 }
        )
      }
    }

    if (userType === 'company' && cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '')
      if (!isValidCNPJ(cnpjLimpo)) {
        return NextResponse.json(
          { error: 'CNPJ inválido' },
          { status: 400 }
        )
      }
    }

    // Verificar se email já existe
    if (findUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Criar usuário com hash de senha
    const hashedPassword = hashPassword(password)
    const user = createUser(email, hashedPassword, userType as 'professional' | 'company')
    
    // Log de auditoria
    logAudit('register_success', email, ip, userAgent, 'success', `User registered as ${userType}`)
    
    // Retornar usuário criado (sem senha)
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          userType: user.userType,
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

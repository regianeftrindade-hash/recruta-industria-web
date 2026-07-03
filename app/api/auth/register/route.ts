import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  isValidEmail, 
  isValidCPF, 
  isValidCNPJ,
  checkRegisterRateLimit,
  incrementRegisterAttempts,
  resetRegisterAttempts,
  resetFailedAttempts,
  logAudit,
  isIPBlocked,
  blockIP,
  getBlockedIPTimeRemaining,
} from '@/lib/security'
import { hashPassword } from '@/lib/security.server'
import { validatePasswordStrength } from '@/lib/password-strength'
import { logAudit as logSecurityAudit, lockAccount, isAccountLocked } from '@/lib/security-audit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Verificar se IP está bloqueado
    if (isIPBlocked(ip)) {
      const timeRemaining = getBlockedIPTimeRemaining(ip)
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'IP is blocked')
      return NextResponse.json(
        { 
          error: `Acesso bloqueado temporariamente. Por favor, aguarde ${timeRemaining} segundos antes de tentar novamente.`,
          statusCode: 429,
          retryAfter: timeRemaining
        },
        { status: 429 }
      )
    }
    
    // Rate limiting: 10 requisições por IP a cada 15 minutos
    if (!checkRegisterRateLimit(ip, 10, 15 * 60 * 1000)) {
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
    const { 
      email, password, confirmPassword, userType, cpf, cnpj, name,
      dataNascimento, idade, sexoBiologico, identidadeGenero, orientacaoSexual, estadoCivil, religiao, antecedentes,
      possuiFilhos, quantidadeFilhos, faixaEtariaFilhos,
      telefone, telefone2, whatsapp,
      estado, cidade, disponibilidadeMudanca,
      escolaridade, cursosCertificacoes,
      situacaoProfissional, areaInteresse, cargoDesejado, trabalhouIndustria, tempoExperiencia, experiencias, turnoDisponivel,
      disponibilidadeInicio, recolocacao, pretensaoSalarial,
      curricoURL, atestadoURL, fotoPerfil, mensagemEmpresas,
    } = body

    // Validações básicas
    if (!email || !userType) {
      incrementRegisterAttempts(ip)
      return NextResponse.json(
        { error: 'Email e tipo de usuário são obrigatórios' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      incrementRegisterAttempts(ip)
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Normalizar email (lowercase)
    const normalizedEmail = email.toLowerCase().trim()

    if (password || confirmPassword) {
      if (!password) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 })
      }
      if (!confirmPassword) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Confirmação de senha é obrigatória' }, { status: 400 })
      }

      const passwordStrength = validatePasswordStrength(password)
      if (!passwordStrength.isStrong) {
        incrementRegisterAttempts(ip)
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
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Senhas não conferem' }, { status: 400 })
      }
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      incrementRegisterAttempts(ip)
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Validações específicas por tipo de usuário
    if (userType === 'professional' && cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '')
      if (!isValidCPF(cpfLimpo)) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
      }
    }

    if (userType === 'company' && cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '')
      if (!isValidCNPJ(cnpjLimpo)) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
      }
    }

    const hashedPassword = password ? await hashPassword(password) : null

    // Criar usuário no banco de dados
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name || normalizedEmail.split('@')[0],
        role: userType.toUpperCase() as 'COMPANY' | 'PROFESSIONAL',
        passwordHash: hashedPassword,
      },
    })

    // Se é profissional, criar Profile
    if (userType === 'professional') {
      try {
        const profileData = {
          userId: user.id,
          title: cargoDesejado || name || '',
          email: normalizedEmail,
          phone: telefone || null,
          whatsapp: whatsapp || null,
          location: cidade && estado ? `${cidade}, ${estado}` : estado || '',
          
          cpf: cpf || null,
          dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
          idade: idade ? parseInt(idade) : null,
          sexoBiologico: sexoBiologico || null,
          identidadeGenero: identidadeGenero || null,
          orientacaoSexual: orientacaoSexual || null,
          estadoCivil: estadoCivil || null,
          religiao: religiao || null,
          antecedentes: antecedentes === true || antecedentes === 'true',
          
          possuiFilhos: possuiFilhos === true || possuiFilhos === 'true',
          quantidadeFilhos: quantidadeFilhos ? parseInt(quantidadeFilhos) : null,
          faixaEtariaFilhos: faixaEtariaFilhos ? JSON.stringify(faixaEtariaFilhos) : null,
          
          estado: estado || null,
          cidade: cidade || null,
          disponibilidadeMudanca: disponibilidadeMudanca || null,
          
          escolaridade: escolaridade || null,
          cursosCertificacoes: cursosCertificacoes ? JSON.stringify(cursosCertificacoes) : null,
          
          situacaoProfissional: situacaoProfissional || null,
          areaInteresse: areaInteresse || null,
          cargoDesejado: cargoDesejado || null,
          trabalhouIndustria: trabalhouIndustria || null,
          tempoExperiencia: tempoExperiencia || null,
          experienciasJSON: experiencias ? JSON.stringify(experiencias) : null,
          turnoDisponivel: turnoDisponivel || null,
          
          disponibilidadeInicio: disponibilidadeInicio || null,
          recolocacao: recolocacao || null,
          pretensaoSalarial: pretensaoSalarial || null,
          
          curricoURL: curricoURL || null,
          atestadoURL: atestadoURL || null,
          avatar: fotoPerfil || null,
          
          mensagemEmpresas: mensagemEmpresas || null,
          bio: mensagemEmpresas || null,
          fullDescription: mensagemEmpresas || null,
        }

        await prisma.profile.create({
          data: profileData,
        })
      } catch (profileError: any) {
        console.error('Erro ao criar Profile para profissional:', profileError)
        logAudit('profile_creation_failed', normalizedEmail, ip, userAgent, 'failure', `Profile creation failed: ${profileError?.message}`)
      }
    }

    logAudit('register_success', normalizedEmail, ip, userAgent, 'success', `User registered as ${userType}`)
    await logSecurityAudit('registration_success', normalizedEmail, 'account_created', { userType, ip })
    
    try {
      resetRegisterAttempts(ip)
      resetFailedAttempts(normalizedEmail)
    } catch (err) {
      console.warn('Não foi possível resetar tentativas falhadas:', err)
    }
    
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
    const errorMessage = error?.message || 'Erro ao registrar usuário. Tente novamente ou contate o suporte se o problema persistir.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
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
      email, 
      password, 
      confirmPassword, 
      userType, 
      cpf, 
      cnpj, 
      name,
      // Dados pessoais
      dataNascimento,
      idade,
      sexoBiologico,
      identidadeGenero,
      orientacaoSexual,
      estadoCivil,
      religiao,
      antecedentes,
      // Filhos
      possuiFilhos,
      quantidadeFilhos,
      faixaEtariaFilhos,
      // Contato
      telefone,
      telefone2,
      whatsapp,
      // Localização
      estado,
      cidade,
      disponibilidadeMudanca,
      // Formação
      escolaridade,
      cursosCertificacoes,
      // Profissional
      situacaoProfissional,
      areaInteresse,
      cargoDesejado,
      trabalhouIndustria,
      tempoExperiencia,
      experiencias,
      turnoDisponivel,
      // Recolocação e Salário
      disponibilidadeInicio,
      recolocacao,
      pretensaoSalarial,
      // Documentos (URLs após upload)
      curricoURL,
      atestadoURL,
      // Foto de perfil (URL ou dataURL)
      fotoPerfil,
      // Mensagem
      mensagemEmpresas,
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

    const passwordStrength = validatePasswordStrength(password)
    if (password) {
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
}

    if (password !== confirmPassword) {
      incrementRegisterAttempts(ip)
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
        return NextResponse.json(
          { error: 'CPF inválido' },
          { status: 400 }
        )
      }
    }

    if (userType === 'company' && cnpj) {
      const cnpjLimpo = cnpj.replace(/\D/g, '')
      if (!isValidCNPJ(cnpjLimpo)) {
        incrementRegisterAttempts(ip)
        return NextResponse.json(
          { error: 'CNPJ inválido' },
          { status: 400 }
        )
      }
    }

    // Criar usuário no banco de dados
  // Criar usuário no banco de dados
const hashedPassword = password
  ? await hashPassword(password)
  : null

const user = await prisma.user.create({
  data: {
    email,
    name: name || email.split('@')[0],
    role: userType.toUpperCase() as 'COMPANY' | 'PROFESSIONAL',
    passwordHash: hashedPassword,
  },
})
    // Se é profissional, criar Profile com todos os dados do formulário
    if (userType === 'professional') {
      try {
        // Preparar dados do profile
        // Para arrays, converter para JSON string
        const profileData = {
          userId: user.id,
          title: cargoDesejado || name || '',
          email: email,
          phone: telefone || null,
          whatsapp: whatsapp || null,
          location: cidade && estado ? `${cidade}, ${estado}` : estado || '',
          
          // Dados pessoais
          cpf: cpf || null,
          dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
          idade: idade ? parseInt(idade) : null,
          sexoBiologico: sexoBiologico || null,
          identidadeGenero: identidadeGenero || null,
          orientacaoSexual: orientacaoSexual || null,
          estadoCivil: estadoCivil || null,
          religiao: religiao || null,
          antecedentes: antecedentes === true || antecedentes === 'true',
          
          // Filhos
          possuiFilhos: possuiFilhos === true || possuiFilhos === 'true',
          quantidadeFilhos: quantidadeFilhos ? parseInt(quantidadeFilhos) : null,
          faixaEtariaFilhos: faixaEtariaFilhos ? JSON.stringify(faixaEtariaFilhos) : null,
          
          // Contato adicional
         
          
          // Localização
          estado: estado || null,
          cidade: cidade || null,
          disponibilidadeMudanca: disponibilidadeMudanca || null,
          
          // Formação
          escolaridade: escolaridade || null,
          cursosCertificacoes: cursosCertificacoes ? JSON.stringify(cursosCertificacoes) : null,
          
          // Profissional
          situacaoProfissional: situacaoProfissional || null,
          areaInteresse: areaInteresse || null,
          cargoDesejado: cargoDesejado || null,
          trabalhouIndustria: trabalhouIndustria || null,
          tempoExperiencia: tempoExperiencia || null,
          experienciasJSON: experiencias ? JSON.stringify(experiencias) : null,
          turnoDisponivel: turnoDisponivel || null,
          
          // Recolocação e Salário
          disponibilidadeInicio: disponibilidadeInicio || null,
          recolocacao: recolocacao || null,
          pretensaoSalarial: pretensaoSalarial || null,
          
          // Documentos
          curricoURL: curricoURL || null,
          atestadoURL: atestadoURL || null,

          // Foto de perfil
          avatar: fotoPerfil || null,
          
          // Mensagem
          mensagemEmpresas: mensagemEmpresas || null,
          
          // Bio e descrição
          bio: mensagemEmpresas || null,
          fullDescription: mensagemEmpresas || null,
        }

        await prisma.profile.create({
          data: profileData,
        })
      } catch (profileError: any) {
        console.error('Erro ao criar Profile para profissional:', profileError)
        // Log do erro mas continua - o User foi criado e é o importante
        logAudit('profile_creation_failed', email, ip, userAgent, 'failure', `Profile creation failed: ${profileError?.message}`)
      }
    }

    // Log de auditoria
    logAudit('register_success', email, ip, userAgent, 'success', `User registered as ${userType}`)
    await logSecurityAudit('registration_success', email, 'account_created', { userType, ip })
    // Resetar contador de tentativas para o IP após registro bem-sucedido
    try {
      resetRegisterAttempts(ip)
    } catch (err) {
      console.warn('Não foi possível resetar register attempts para IP:', ip, err)
    }
    // Resetar tentativas falhadas para o email do usuário recém-criado
    try {
      resetFailedAttempts(email)
    } catch (err) {
      console.warn('Não foi possível resetar tentativas falhadas para o email:', email, err)
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
    return NextResponse.json(
      { error: error?.message || 'Erro ao registrar usuário' },
      { status: 500 }
    )
  }
}

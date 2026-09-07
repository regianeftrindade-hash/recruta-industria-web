import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhoneBR,
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
import { logAudit as logSecurityAudit } from '@/lib/security-audit'
import { buildProfileUpsertPayload } from '@/lib/professional-profile-map'
import { saveProfileFormSnapshot } from '@/lib/profile-snapshot'
import { saveCompanyExtraData, findCompanyByResponsavelCpf } from '@/lib/company-storage'
import { corporateEmailError, normalizeCorporateEmail } from '@/lib/company/corporate-email'
import { isCorporateEmailVerified } from '@/lib/company/corporate-email-confirmation'

async function completarPerfilProfissionalExistente(
  userId: string,
  body: Record<string, unknown>,
  normalizedEmail: string,
) {
  const { prismaData: profileFields, formDataJSON } = buildProfileUpsertPayload(
    body,
    normalizedEmail,
  )

  await prisma.profile.upsert({
    where: { userId },
    update: { ...profileFields, updatedAt: new Date() },
    create: { userId, ...profileFields },
  })

  await saveProfileFormSnapshot(userId, formDataJSON)

  await prisma.professional.upsert({
    where: { userId },
    update: { title: profileFields.cargoDesejado || profileFields.title || '' },
    create: {
      userId,
      title: profileFields.cargoDesejado || profileFields.title || 'Profissional',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (isIPBlocked(ip)) {
      const timeRemaining = getBlockedIPTimeRemaining(ip)
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'IP is blocked')
      return NextResponse.json(
        {
          error: `Acesso bloqueado temporariamente. Por favor, aguarde ${timeRemaining} segundos antes de tentar novamente.`,
          statusCode: 429,
          retryAfter: timeRemaining,
        },
        { status: 429 },
      )
    }

    if (!checkRegisterRateLimit(ip, 10, 15 * 60 * 1000)) {
      blockIP(ip)
      logAudit('register_attempt', 'unknown', ip, userAgent, 'failure', 'Rate limit exceeded - IP blocked')
      return NextResponse.json(
        {
          error:
            'Acesso bloqueado temporariamente. Você fez muitas tentativas de cadastro. Por favor, aguarde 15 minutos antes de tentar novamente.',
          statusCode: 429,
          retryAfter: 900,
        },
        {
          status: 429,
          headers: { 'Retry-After': '900' },
        },
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
      responsavelNome,
      responsavelCpf,
      telefone,
      endereco,
      cartaoCnpjUrl,
      logoUrl,
      fotoResponsavelUrl,
    } = body

    const nomeProfissional = String(name || (body as Record<string, unknown>).nome || '').trim()

    if (!email || !userType) {
      incrementRegisterAttempts(ip)
      return NextResponse.json(
        { error: 'Email e tipo de usuário são obrigatórios' },
        { status: 400 },
      )
    }

    if (!isValidEmail(email)) {
      incrementRegisterAttempts(ip)
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

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
            score: passwordStrength.score,
          },
          { status: 400 },
        )
      }

      if (password !== confirmPassword) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Senhas não conferem' }, { status: 400 })
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      const session = await getServerSession(authOptions)
      const sessionEmail = session?.user?.email?.toLowerCase().trim()
      const isSameUser = sessionEmail === normalizedEmail
      const isProfessional = String(userType).toLowerCase() === 'professional'
      const contaOAuth = !existingUser.passwordHash

      if (isProfessional && isSameUser) {
        if (cpf) {
          const cpfLimpo = String(cpf).replace(/\D/g, '')
          if (!isValidCPF(cpfLimpo)) {
            incrementRegisterAttempts(ip)
            return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
          }
        }

        if (nomeProfissional) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { name: nomeProfissional },
          })
        }

        await completarPerfilProfissionalExistente(existingUser.id, body, normalizedEmail)

        resetRegisterAttempts(ip)
        return NextResponse.json(
          {
            success: true,
            completedExisting: true,
            user: {
              id: existingUser.id,
              email: existingUser.email,
              role: existingUser.role,
            },
          },
          { status: 200 },
        )
      }

      if (isProfessional && contaOAuth) {
        incrementRegisterAttempts(ip)
        return NextResponse.json(
          {
            error:
              'Este e-mail já foi usado no login com Google. Entre com Google novamente e finalize o cadastro.',
            code: 'OAUTH_ACCOUNT_EXISTS',
          },
          { status: 409 },
        )
      }

      incrementRegisterAttempts(ip)
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })
    }

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

    if (userType === 'company') {
      const cpfResp = String(responsavelCpf || '').replace(/\D/g, '')
      if (!responsavelNome?.trim()) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Nome do responsável é obrigatório' }, { status: 400 })
      }
      if (!cpfResp || !isValidCPF(cpfResp)) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'CPF do responsável inválido' }, { status: 400 })
      }
      const cpfEmUso = await findCompanyByResponsavelCpf(cpfResp)
      if (cpfEmUso) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'CPF do responsável já cadastrado' }, { status: 409 })
      }
      const telefoneEmpresa = String(telefone || '').trim()
      const enderecoEmpresa = String(endereco || '').trim()
      if (!telefoneEmpresa) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Telefone da empresa é obrigatório' }, { status: 400 })
      }
      if (!isValidPhoneBR(telefoneEmpresa)) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Telefone inválido. Informe DDD + número.' }, { status: 400 })
      }
      if (!enderecoEmpresa || enderecoEmpresa.length < 5) {
        incrementRegisterAttempts(ip)
        return NextResponse.json({ error: 'Endereço da empresa é obrigatório' }, { status: 400 })
      }
      const emailCorporativo = normalizeCorporateEmail(String(email || ''))
      if (emailCorporativo) {
        const emailValidationError = corporateEmailError(emailCorporativo)
        if (emailValidationError) {
          incrementRegisterAttempts(ip)
          return NextResponse.json({ error: emailValidationError }, { status: 400 })
        }
      }
    }

    const hashedPassword = password ? await hashPassword(password) : null

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name:
          userType === 'company'
            ? String(responsavelNome).trim()
            : nomeProfissional || normalizedEmail.split('@')[0],
        role: userType.toUpperCase() as 'COMPANY' | 'PROFESSIONAL',
        passwordHash: hashedPassword,
      },
    })

    if (userType === 'company') {
      const cnpjLimpo = cnpj ? String(cnpj).replace(/\D/g, '') : ''
      const cpfResp = String(responsavelCpf || '').replace(/\D/g, '')
      await prisma.company.create({
        data: {
          userId: user.id,
          name: name || normalizedEmail.split('@')[0],
        },
      })
      const emailCorporativo = normalizeCorporateEmail(String(email || ''))
      const emailCorporativoVerificado = emailCorporativo
        ? await isCorporateEmailVerified(emailCorporativo)
        : false
      const cartaoUrl = String(cartaoCnpjUrl || '').trim()

      const extraData: Parameters<typeof saveCompanyExtraData>[1] = {
        cnpj: cnpjLimpo || undefined,
        responsavelNome: String(responsavelNome || '').trim(),
        responsavelCpf: cpfResp || undefined,
        telefone: String(telefone || '').trim(),
        endereco: String(endereco || '').trim(),
      }

      if (emailCorporativo) {
        extraData.emailCorporativo = emailCorporativo
        extraData.emailCorporativoVerificado = emailCorporativoVerificado
      }

      if (cartaoUrl) {
        extraData.cartaoCnpjUrl = cartaoUrl
        extraData.verificationStatus = 'PENDING'
        extraData.verifiedAt = null
        extraData.rejectionReason = null
      }

      const logo = String(logoUrl || '').trim()
      if (logo) extraData.logoUrl = logo

      const fotoResp = String(fotoResponsavelUrl || '').trim()
      if (fotoResp) extraData.fotoResponsavelUrl = fotoResp

      await saveCompanyExtraData(user.id, extraData)
    }

    if (userType === 'professional') {
      try {
        const { prismaData: profileFields, formDataJSON } = buildProfileUpsertPayload(
          body,
          normalizedEmail,
        )

        await prisma.profile.create({
          data: {
            userId: user.id,
            ...profileFields,
          },
        })

        await saveProfileFormSnapshot(user.id, formDataJSON)
      } catch (profileError: unknown) {
        const message = profileError instanceof Error ? profileError.message : String(profileError)
        console.error('Erro ao criar Profile para profissional:', profileError)
        logAudit(
          'profile_creation_failed',
          normalizedEmail,
          ip,
          userAgent,
          'failure',
          `Profile creation failed: ${message}`,
        )
      }
    }

    logAudit('register_success', normalizedEmail, ip, userAgent, 'success', `User registered as ${userType}`)
    await logSecurityAudit('registration_success', normalizedEmail, 'account_created', {
      userType,
      ip,
    })

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
      { status: 201 },
    )
  } catch (error: unknown) {
    console.error('Erro no registro:', error)
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Erro ao registrar usuário. Tente novamente ou contate o suporte se o problema persistir.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

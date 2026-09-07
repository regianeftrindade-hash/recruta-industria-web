import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { isValidCNPJ, isValidCPF, formatCPF, isValidPhoneBR } from '@/lib/security'
import {
  corporateEmailError,
  normalizeCorporateEmail,
} from '@/lib/company/corporate-email'
import { isCorporateEmailVerified } from '@/lib/company/corporate-email-confirmation'
import {
  findCompanyByCnpj,
  findCompanyByResponsavelCpf,
  saveCompanyExtraData,
} from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const data = await request.json()
    const nome = String(data.nome || data.name || '').trim()
    const responsavelNome = String(data.responsavelNome || '').trim()
    const cnpjLimpo = String(data.cnpj || '').replace(/\D/g, '')
    const cpfLimpo = String(data.responsavelCpf || data.cpf || '').replace(/\D/g, '')
    const telefone = String(data.telefone || '').trim()
    const endereco = String(data.endereco || '').trim()
    const cartaoCnpjUrl = String(data.cartaoCnpjUrl || '').trim()
    const logoUrl = String(data.logoUrl || '').trim()
    const fotoResponsavelUrl = String(data.fotoResponsavelUrl || '').trim()
    const emailCorporativoRaw = String(data.emailCorporativo || '').trim()
    const emailCorporativo = emailCorporativoRaw
      ? normalizeCorporateEmail(emailCorporativoRaw)
      : ''

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const { resolveCompanyActor } = await import('@/lib/company/company-team')
    const actor = await resolveCompanyActor(user.id)
    if (actor && !actor.isOwner) {
      return NextResponse.json(
        {
          error:
            'Você faz parte da equipe desta empresa. Somente o administrador principal pode alterar o cadastro.',
        },
        { status: 403 },
      )
    }

    const isTestBypass =
      matchesCompanyTestBypass({
        email: user.email,
        companyName: user.company?.name || nome,
        userName: user.name || responsavelNome,
      }) || (await ensureCompanyTestBypassReady(user.id))

    if (!isTestBypass) {
      if (!nome) {
        return NextResponse.json({ error: 'Informe a razão social da empresa.' }, { status: 400 })
      }

      if (!responsavelNome) {
        return NextResponse.json({ error: 'Informe o nome da pessoa responsável.' }, { status: 400 })
      }

      if (!cnpjLimpo || cnpjLimpo.length !== 14) {
        return NextResponse.json({ error: 'Informe um CNPJ válido (14 dígitos).' }, { status: 400 })
      }

      if (!isValidCNPJ(cnpjLimpo)) {
        return NextResponse.json({ error: 'CNPJ inválido.' }, { status: 400 })
      }

      if (!cpfLimpo || cpfLimpo.length !== 11) {
        return NextResponse.json({ error: 'Informe um CPF válido (11 dígitos).' }, { status: 400 })
      }

      if (!isValidCPF(cpfLimpo)) {
        return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
      }

      if (!telefone) {
        return NextResponse.json({ error: 'Informe o telefone da empresa.' }, { status: 400 })
      }

      if (!isValidPhoneBR(telefone)) {
        return NextResponse.json({ error: 'Informe um telefone válido com DDD.' }, { status: 400 })
      }

      if (!endereco || endereco.length < 5) {
        return NextResponse.json({ error: 'Informe o endereço da empresa.' }, { status: 400 })
      }
    }

    if (emailCorporativo) {
      const emailValidationError = corporateEmailError(emailCorporativo)
      if (emailValidationError) {
        return NextResponse.json({ error: emailValidationError }, { status: 400 })
      }
    }

    if (cnpjLimpo) {
      const cnpjEmUso = await findCompanyByCnpj(cnpjLimpo, user.id)
      if (cnpjEmUso) {
        return NextResponse.json({ error: 'CNPJ já cadastrado em outra conta.' }, { status: 409 })
      }
    }

    if (cpfLimpo) {
      const cpfEmUso = await findCompanyByResponsavelCpf(cpfLimpo, user.id)
      if (cpfEmUso) {
        return NextResponse.json({ error: 'CPF do responsável já cadastrado em outra conta.' }, { status: 409 })
      }
    }

    const nomeFinal = nome || user.company?.name || user.name || user.email.split('@')[0] || 'Empresa Teste'
    const responsavelFinal = responsavelNome || user.name || nomeFinal

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: responsavelFinal,
        role: 'COMPANY',
        updatedAt: new Date(),
      },
    })

    const company = await prisma.company.upsert({
      where: { userId: user.id },
      update: { name: nomeFinal },
      create: {
        userId: user.id,
        name: nomeFinal,
      },
    })

    const emailCorporativoVerificado = emailCorporativo
      ? await isCorporateEmailVerified(emailCorporativo)
      : false

    const extraUpdate: Parameters<typeof saveCompanyExtraData>[1] = {}

    if (cnpjLimpo) extraUpdate.cnpj = cnpjLimpo
    if (responsavelFinal) extraUpdate.responsavelNome = responsavelFinal
    if (cpfLimpo) extraUpdate.responsavelCpf = cpfLimpo
    if (telefone) extraUpdate.telefone = telefone
    if (endereco) extraUpdate.endereco = endereco

    if (emailCorporativo) {
      extraUpdate.emailCorporativo = emailCorporativo
      extraUpdate.emailCorporativoVerificado = emailCorporativoVerificado
    }

    if (cartaoCnpjUrl) {
      extraUpdate.cartaoCnpjUrl = cartaoCnpjUrl
      extraUpdate.verificationStatus = 'PENDING'
      extraUpdate.verifiedAt = null
      extraUpdate.rejectionReason = null
    }

    if (logoUrl) {
      extraUpdate.logoUrl = logoUrl
    }

    if (fotoResponsavelUrl) {
      extraUpdate.fotoResponsavelUrl = fotoResponsavelUrl
    }

    if (Object.keys(extraUpdate).length > 0) {
      await saveCompanyExtraData(user.id, extraUpdate)
    }

    return NextResponse.json({
      success: true,
      message: 'Cadastro atualizado com sucesso',
      testBypass: isTestBypass,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
      company: {
        id: company.id,
        name: company.name,
        cnpj: cnpjLimpo || null,
        responsavelNome: responsavelFinal,
        responsavelCpf: cpfLimpo ? formatCPF(cpfLimpo) : null,
        telefone: telefone || null,
        endereco: endereco || null,
        emailCorporativo: emailCorporativo || null,
        emailCorporativoVerificado,
        cartaoCnpjUrl: cartaoCnpjUrl || null,
        logoUrl: logoUrl || null,
        fotoResponsavelUrl: fotoResponsavelUrl || null,
      },
    })
  } catch (error) {
    console.error('Erro ao atualizar cadastro:', error)
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: 'Erro ao atualizar cadastro', detail: message }, { status: 500 })
  }
}

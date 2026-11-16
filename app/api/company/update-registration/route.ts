import '@/lib/i18n/active-locale.server'
import { bindLocale } from '@/lib/i18n/active-locale'
import { resolveInterfaceLocale } from '@/lib/i18n/resolve-interface-locale'
import { t } from '@/lib/i18n/translate';
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { formatCPF } from '@/lib/security'
import { registrationDocumentError, registrationPhoneError } from '@/lib/identity/registration-documents'
import { existingRegistrationCountryChangeError } from '@/lib/identity/registration-region'
import {
  corporateEmailError,
  getAppBaseUrl,
  normalizeCorporateEmail,
} from '@/lib/company/corporate-email'
import { createCorporateEmailConfirmation, isCorporateEmailVerified } from '@/lib/company/corporate-email-confirmation'
import { isEmailConfigured, sendEmail } from '@/lib/email'
import {
  findCompanyByCnpj,
  findCompanyByResponsavelCpf,
  saveCompanyExtraData,
} from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'

export async function POST(request: NextRequest) {
  try {
    bindLocale(await resolveInterfaceLocale())
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: t("registration.ui.nao-autenticado") }, { status: 401 })
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
    const emailInformado = Object.prototype.hasOwnProperty.call(data, 'emailCorporativo')
    const emailCorporativoRaw = emailInformado ? String(data.emailCorporativo || '').trim() : ''
    const emailCorporativo = emailCorporativoRaw
      ? normalizeCorporateEmail(emailCorporativoRaw)
      : ''

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ error: t("registration.ui.usuario-nao-encontrado") }, { status: 404 })
    }

    const { resolveCompanyActor } = await import('@/lib/company/company-team')
    const actor = await resolveCompanyActor(user.id)
    if (actor && !actor.isOwner) {
      return NextResponse.json(
        {
          error:
            t("registration.ui.voce-faz-parte-da-equipe-desta-empresa-somente-o-administrador-p"),
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

    const countryCode = user.company?.countryCode || user.countryCode || 'BR'
    const paisErro = existingRegistrationCountryChangeError(countryCode, data.countryCode)
    if (paisErro) {
      return NextResponse.json({ error: paisErro }, { status: 400 })
    }

    if (!isTestBypass) {
      if (!nome) {
        return NextResponse.json({ error: t("registration.ui.informe-a-razao-social-da-empresa") }, { status: 400 })
      }

      if (!responsavelNome) {
        return NextResponse.json({ error: t("registration.ui.informe-o-nome-da-pessoa-responsavel") }, { status: 400 })
      }

      if (!cnpjLimpo || cnpjLimpo.length !== 14) {
        return NextResponse.json({ error: t("registration.ui.informe-um-cnpj-valido-14-digitos") }, { status: 400 })
      }

      const cnpjErro = registrationDocumentError(cnpjLimpo, 'CNPJ', countryCode, t("registration.ui.cnpj-invalido-2"))
      if (cnpjErro) {
        return NextResponse.json({ error: cnpjErro }, { status: 400 })
      }

      if (!cpfLimpo || cpfLimpo.length !== 11) {
        return NextResponse.json({ error: t("registration.ui.informe-um-cpf-valido-11-digitos") }, { status: 400 })
      }

      const cpfErro = registrationDocumentError(cpfLimpo, 'CPF', countryCode, t("registration.simple.cpfInvalid"))
      if (cpfErro) {
        return NextResponse.json({ error: cpfErro }, { status: 400 })
      }

      const telefoneErro = telefone
        ? registrationPhoneError(telefone, countryCode, t("registration.ui.informe-um-telefone-valido-com-ddd"))
        : null
      if (telefoneErro) {
        return NextResponse.json({ error: telefoneErro }, { status: 400 })
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
        return NextResponse.json({ error: t("registration.ui.cnpj-ja-cadastrado-em-outra-conta") }, { status: 409 })
      }
    }

    if (cpfLimpo) {
      const cpfEmUso = await findCompanyByResponsavelCpf(cpfLimpo, user.id)
      if (cpfEmUso) {
        return NextResponse.json({ error: t("registration.ui.cpf-do-responsavel-ja-cadastrado-em-outra-conta") }, { status: 409 })
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

    if (emailInformado) {
      extraUpdate.emailCorporativo = emailCorporativo
      extraUpdate.emailCorporativoVerificado = Boolean(emailCorporativo) && emailCorporativoVerificado
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

    if (emailCorporativo && !emailCorporativoVerificado) {
      try {
        const { token, cooldownActive, alreadyVerified } = await createCorporateEmailConfirmation(emailCorporativo)
        if (!alreadyVerified && !cooldownActive) {
          const confirmUrl = `${getAppBaseUrl()}/api/company/confirm-corporate-email?token=${token}`
          const subject = t("registration.ui.confirme-seu-e-mail-corporativo-recruta-industria")
          const text = t("registration.ui.confirme-email-texto").replace("{url}", confirmUrl)
          const html = `<p>${t("registration.ui.confirme-seu-e-mail-corporativo-para-seguirmos-com-a-analise-da-")}</p><p><a href="${confirmUrl}">${t("registration.ui.confirmar-e-mail")}</a></p>`
          if (isEmailConfigured()) {
            await sendEmail({ to: emailCorporativo, subject, html, text })
          } else if (process.env.NODE_ENV === 'development') {
            console.info(`[DEV] Confirmação corporativa para ${emailCorporativo}: ${confirmUrl}`)
          }
        }
      } catch (err) {
        console.error('Falha ao enviar confirmação do e-mail corporativo:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: t("registration.ui.cadastro-atualizado-com-sucesso"),
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
    const message = error instanceof Error ? error.message : t("registration.ui.erro-desconhecido")
    return NextResponse.json({ error: t("registration.ui.erro-ao-atualizar-cadastro"), detail: message }, { status: 500 })
  }
}

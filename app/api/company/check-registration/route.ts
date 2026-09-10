import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyExtraData, getCompanyVerificationInfo, loadCompanyRowByUserId } from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'
import { formatCPF } from '@/lib/security'
import { resolveCompanyActor } from '@/lib/company/company-team'

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: userSelect,
    })

    if (!user) {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
    }

    let company = await loadCompanyRowByUserId(user.id)

    const bypassByIdentity = matchesCompanyTestBypass({
      email: user.email,
      userName: user.name,
      companyName: company?.name,
    })

    let isTestBypass = bypassByIdentity
    if (bypassByIdentity) {
      try {
        await ensureCompanyTestBypassReady(user.id)
        user = await prisma.user.findUnique({
          where: { id: user.id },
          select: userSelect,
        })
        if (!user) {
          return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
        }
        company = await loadCompanyRowByUserId(user.id)
      } catch (err) {
        console.error('Bypass empresa: ensure falhou, liberando mesmo assim:', err)
      }
      isTestBypass = true
    } else {
      try {
        isTestBypass = await ensureCompanyTestBypassReady(user.id)
      } catch {
        isTestBypass = false
      }
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
    }

    const actor = await resolveCompanyActor(user.id).catch(() => null)
    const ownerUserId = actor?.ownerUserId || user.id
    if (ownerUserId !== user.id) {
      company = (await loadCompanyRowByUserId(ownerUserId)) || company
    }

    let extra = null
    let verification = null
    try {
      extra = company ? await getCompanyExtraData(ownerUserId) : null
      verification = company ? await getCompanyVerificationInfo(ownerUserId) : null
    } catch (err) {
      console.error('Erro ao ler dados extras da empresa:', err)
      if (isTestBypass) {
        verification = {
          verificationStatus: 'VERIFIED',
          verifiedAt: new Date(),
          rejectionReason: null,
          cartaoCnpjUrl: null,
          emailCorporativo: null,
          emailCorporativoVerificado: true,
          isDocumentVerified: true,
          isEmailVerified: true,
          canAccessSensitiveProfiles: true,
        }
      }
    }

    const isCompany = user.role === 'COMPANY' || isTestBypass
    const isTeamMember = Boolean(actor && !actor.isOwner)

    const fieldsComplete = !!(
      company?.name?.trim() &&
      extra?.cnpj?.trim() &&
      extra?.responsavelNome?.trim() &&
      extra?.responsavelCpf?.trim() &&
      extra?.telefone?.trim() &&
      extra?.endereco?.trim()
    )

    const isRegistrationComplete = isTestBypass || isTeamMember || fieldsComplete

    return NextResponse.json({
      authenticated: true,
      isCompany,
      registrationComplete: isRegistrationComplete,
      testBypass: isTestBypass,
      teamMember: isTeamMember,
      teamRole: actor?.teamRole || null,
      verification,
      user: {
        id: user.id,
        email: user.email,
        nome: user.name,
        cnpj: extra?.cnpj || null,
        responsavelNome: extra?.responsavelNome || null,
        responsavelCpf: extra?.responsavelCpf ? formatCPF(extra.responsavelCpf) : null,
        telefone: extra?.telefone || null,
        endereco: extra?.endereco || null,
        emailCorporativo: extra?.emailCorporativo || null,
        emailCorporativoVerificado: extra?.emailCorporativoVerificado ?? false,
        cartaoCnpjUrl: extra?.cartaoCnpjUrl || null,
        logoUrl: extra?.logoUrl || null,
        fotoResponsavelUrl: extra?.fotoResponsavelUrl || null,
        razaoSocial: company?.name || null,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar registro:', error)
    return NextResponse.json({ error: 'Erro ao verificar registro' }, { status: 500 })
  }
}

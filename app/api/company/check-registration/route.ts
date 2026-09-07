import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyExtraData, getCompanyVerificationInfo } from '@/lib/company-storage'
import { ensureCompanyTestBypassReady, matchesCompanyTestBypass } from '@/lib/company/company-test-bypass'
import { formatCPF } from '@/lib/security'
import { resolveCompanyActor } from '@/lib/company/company-team'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    let user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
    }

    // Match por e-mail primeiro — mesmo se o ensure falhar (ex.: coluna ausente no DB)
    const bypassByIdentity = matchesCompanyTestBypass({
      email: user.email,
      userName: user.name,
      companyName: user.company?.name,
    })

    let isTestBypass = bypassByIdentity
    if (bypassByIdentity) {
      try {
        await ensureCompanyTestBypassReady(user.id)
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: { company: true },
        })
        if (!user) {
          return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
        }
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

    const actor = await resolveCompanyActor(user.id)
    const ownerUserId = actor?.ownerUserId || user.id
    const ownerUser =
      ownerUserId === user.id
        ? user
        : await prisma.user.findUnique({
            where: { id: ownerUserId },
            include: { company: true },
          })

    let extra = null
    let verification = null
    try {
      extra = ownerUser?.company ? await getCompanyExtraData(ownerUserId) : null
      verification = ownerUser?.company ? await getCompanyVerificationInfo(ownerUserId) : null
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
      ownerUser?.company?.name?.trim() &&
      extra?.cnpj?.trim() &&
      extra?.responsavelNome?.trim() &&
      extra?.responsavelCpf?.trim() &&
      extra?.telefone?.trim() &&
      extra?.endereco?.trim()
    )

    // Membro da equipe RH: usa cadastro do administrador / assinatura compartilhada
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
        razaoSocial: ownerUser?.company?.name || null,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar registro:', error)
    return NextResponse.json({ error: 'Erro ao verificar registro' }, { status: 500 })
  }
}

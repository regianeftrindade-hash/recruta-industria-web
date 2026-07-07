import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyExtraData } from '@/lib/company-storage'
import { formatCPF } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { company: true },
    })

    if (!user) {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
    }

    const extra = user.company ? await getCompanyExtraData(user.id) : null
    const isCompany = user.role === 'COMPANY'
    const isRegistrationComplete = !!(
      user.company?.name?.trim() &&
      extra?.cnpj?.trim() &&
      extra?.responsavelNome?.trim() &&
      extra?.responsavelCpf?.trim()
    )

    return NextResponse.json({
      authenticated: true,
      isCompany,
      registrationComplete: isRegistrationComplete,
      user: {
        id: user.id,
        email: user.email,
        nome: user.name,
        cnpj: extra?.cnpj || null,
        responsavelNome: extra?.responsavelNome || null,
        responsavelCpf: extra?.responsavelCpf ? formatCPF(extra.responsavelCpf) : null,
        razaoSocial: user.company?.name || null,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar registro:', error)
    return NextResponse.json({ error: 'Erro ao verificar registro' }, { status: 500 })
  }
}

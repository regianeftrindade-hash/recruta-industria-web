import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { getCompanyPlanContext } from '@/lib/company-plan'
import { notifyProfessionalAsync, notifyTipReceived } from '@/lib/professional-notifications'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const profileId = new URL(request.url).searchParams.get('profileId')
    if (!profileId) {
      return NextResponse.json({ error: 'profileId é obrigatório' }, { status: 400 })
    }

    const tips = await prisma.tip.findMany({
      where: { profileId, companyUserId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        isAnonymous: true,
        rating: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ tips })
  } catch (error) {
    console.error('Erro ao listar dicas:', error)
    return NextResponse.json({ error: 'Erro ao listar dicas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const planContext = await getCompanyPlanContext(user.id)
    if (!planContext.features.canSendTips) {
      return NextResponse.json({
        error: 'Dicas anônimas disponíveis a partir do plano Basic.',
        upgradeRequired: 'BASIC',
      }, { status: 403 })
    }

    const { profileId, message } = await request.json()

    if (!profileId || !message?.trim()) {
      return NextResponse.json({ error: 'Perfil e mensagem são obrigatórios' }, { status: 400 })
    }

    if (message.trim().length > 500) {
      return NextResponse.json({ error: 'Mensagem muito longa (máx. 500 caracteres)' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } })
    if (!profile || !profile.isVisible) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    await prisma.tip.create({
      data: {
        profileId,
        companyUserId: user.id,
        message: message.trim(),
        isAnonymous: true,
      },
    })

    notifyProfessionalAsync(() =>
      notifyTipReceived(profileId, message.trim())
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao enviar dica:', error)
    return NextResponse.json({ error: 'Erro ao enviar dica' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    })

    if (!user || user.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 })
    }

    const tipId = new URL(request.url).searchParams.get('id')?.trim() || ''
    if (!tipId) {
      return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    }

    const { resolveCompanyOwnerUserId } = await import('@/lib/company/company-team')
    const ownerUserId = (await resolveCompanyOwnerUserId(user.id)) || user.id

    const deleted = await prisma.tip.deleteMany({
      where: {
        id: tipId,
        companyUserId: { in: [ownerUserId, user.id] },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Dica não encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir dica:', error)
    return NextResponse.json({ error: 'Erro ao excluir dica' }, { status: 500 })
  }
}

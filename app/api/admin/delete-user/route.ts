import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, apiKey } = body

    const authError = await requireAdmin(request, { apiKey })
    if (authError) return authError

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        company: true,
        professional: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Deletar perfil se existir (cascade delete cuida das relações)
    if (user.profile) {
      await prisma.profile.delete({
        where: { id: user.profile.id },
      })
    }

    // Deletar company se existir
    if (user.company) {
      await prisma.company.delete({
        where: { id: user.company.id },
      })
    }

    // Deletar professional se existir
    if (user.professional) {
      await prisma.professional.delete({
        where: { id: user.professional.id },
      })
    }

    // Deletar usuário
    const deletedUser = await prisma.user.delete({
      where: { id: user.id },
    })

    return NextResponse.json({
      success: true,
      message: `Usuário ${normalizedEmail} deletado com sucesso`,
      deletedUser: {
        id: deletedUser.id,
        email: deletedUser.email,
        name: deletedUser.name,
      },
    })
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}

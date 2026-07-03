import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    const authError = await requireAdmin(request, { apiKey })
    if (authError) return authError

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: { title: true, location: true, status: true }
        },
        company: {
          select: { name: true }
        },
        professional: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        profile: u.profile,
        company: u.company,
        hasPassword: !!u.passwordHash
      }))
    })
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao listar usuários' },
      { status: 500 }
    )
  }
}

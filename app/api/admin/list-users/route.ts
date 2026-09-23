import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminEmails, requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    const authError = await requireAdmin(request, { apiKey })
    if (authError) return authError

    const adminEmails = new Set(getAdminEmails())

    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: { title: true, location: true, status: true },
        },
        company: {
          select: { name: true },
        },
        professional: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = users.map((u) => {
      const email = u.email.toLowerCase().trim()
      const isAdmin = u.role === 'ADMIN' || adminEmails.has(email)
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: isAdmin ? 'ADMIN' : u.role,
        isAdmin,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        profile: u.profile,
        company: u.company,
        hasPassword: !!u.passwordHash,
      }
    })

    const admins = mapped.filter((u) => u.isAdmin)
    const professionals = mapped.filter(
      (u) => !u.isAdmin && u.role === 'PROFESSIONAL',
    )
    const companies = mapped.filter((u) => !u.isAdmin && u.role === 'COMPANY')
    const others = mapped.filter(
      (u) => !u.isAdmin && u.role !== 'PROFESSIONAL' && u.role !== 'COMPANY',
    )

    return NextResponse.json({
      success: true,
      totalUsers: mapped.length,
      totals: {
        admins: admins.length,
        professionals: professionals.length,
        companies: companies.length,
        others: others.length,
      },
      admins,
      professionals,
      companies,
      others,
      users: mapped,
    })
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro ao listar usuários' },
      { status: 500 },
    )
  }
}

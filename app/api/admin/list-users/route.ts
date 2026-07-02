import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * 🔒 ENDPOINT ADMINISTRATIVO - LIST USERS
 * ========================================
 * Lista todos os usuários para debug/limpeza
 * 
 * POST /api/admin/list-users
 * Body: { apiKey: "seu-api-key-secreto" }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey } = body

    // Validar API Key
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'dev-key-12345'
    
    if (apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'API Key inválida' },
        { status: 401 }
      )
    }

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

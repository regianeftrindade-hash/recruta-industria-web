import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const data = await request.json()

    // Encontra o usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Atualiza o usuário com os dados do cadastro completo
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.nome,
        updatedAt: new Date(),
      }
    })

    // Atualiza ou cria informações de empresa
    const company = await prisma.company.upsert({
      where: { userId: user.id },
      update: {
        name: data.nome,
      },
      create: {
        userId: user.id,
        name: data.nome,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cadastro atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
      company: {
        id: company.id,
        name: company.name,
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar cadastro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cadastro' }, { status: 500 })
  }
}

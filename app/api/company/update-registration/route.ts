import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { findUserByEmail, updateUser } from '@/lib/users'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const data = await request.json()

    // Encontra o usuário
    const user = findUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Atualiza o usuário com os dados do cadastro completo
    const updatedUser = updateUser(user.id, {
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      cnpj: data.cnpj,
      setor: data.setor,
      estado: data.estado,
      cidade: data.cidade,
      updatedAt: new Date().toISOString()
    })

    if (!updatedUser) {
      return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cadastro atualizado com sucesso',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        nome: updatedUser.nome,
        cnpj: updatedUser.cnpj,
        setor: updatedUser.setor
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar cadastro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cadastro' }, { status: 500 })
  }
}

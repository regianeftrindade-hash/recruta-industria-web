import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { findUserByEmail } from '@/lib/users'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const user = await findUserByEmail(session.user.email)

    if (!user) {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 404 })
    }

    // Se não for empresa, redireciona para login
    if (user.userType !== 'company') {
      return NextResponse.json({ authenticated: false, isCompany: false }, { status: 403 })
    }

    // Verifica se o cadastro está completo (todos os campos obrigatórios preenchidos)
    const isRegistrationComplete = !!(
      user.nome &&
      user.telefone &&
      user.cnpj &&
      user.email &&
      user.setor
    )

    return NextResponse.json({
      authenticated: true,
      isCompany: true,
      registrationComplete: isRegistrationComplete,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        cnpj: user.cnpj,
      }
    })
  } catch (error) {
    console.error('Erro ao verificar registro:', error)
    return NextResponse.json({ error: 'Erro ao verificar registro' }, { status: 500 })
  }
}

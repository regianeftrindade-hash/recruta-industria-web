import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/users';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Busca o usuário no banco de dados
    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userType: user.userType,
      success: true
    });
  } catch (error) {
    console.error('Erro ao buscar tipo do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar tipo do usuário' },
      { status: 500 }
    );
  }
}

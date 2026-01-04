import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, paymentMethod, cardName, last4, expiryMonth, expiryYear, pixKey, boletoCode, transactionId } = body;

    // Validar que o email corresponde
    if (email !== session.user.email) {
      return NextResponse.json(
        { error: 'Email não corresponde' },
        { status: 403 }
      );
    }

    // Encontrar o usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar user com dados de upgrade
    const now = new Date();
    const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    let paymentInfo: any = { paymentMethod, transactionId };

    if (paymentMethod === 'cartao') {
      paymentInfo = {
        ...paymentInfo,
        cardName,
        last4,
        expiryMonth,
        expiryYear
      };
    } else if (paymentMethod === 'pix') {
      paymentInfo = {
        ...paymentInfo,
        pixKey
      };
    } else if (paymentMethod === 'boleto') {
      paymentInfo = {
        ...paymentInfo,
        boletoCode
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        updatedAt: now
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Upgrade realizado com sucesso',
      user: {
        email: updatedUser.email,
        upgradedAt: now.toISOString(),
        subscriptionRenewal: renewalDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao processar upgrade:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upgrade' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import fs from 'fs';
import path from 'path';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

function readUsers() {
  try {
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users: any[]) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2), 'utf-8');
}

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

    // Ler usuários
    let users = readUsers();

    // Encontrar o usuário
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar plano do usuário
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

    users[userIndex] = {
      ...users[userIndex],
      plan: 'PREMIUM',
      upgradedAt: now.toISOString(),
      subscriptionRenewal: renewalDate.toISOString(),
      paymentMethod: paymentInfo
    };

    // Salvar usuários
    writeUsers(users);

    return NextResponse.json({
      success: true,
      message: 'Upgrade realizado com sucesso',
      user: {
        email: users[userIndex].email,
        plan: users[userIndex].plan,
        upgradedAt: users[userIndex].upgradedAt,
        subscriptionRenewal: users[userIndex].subscriptionRenewal
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

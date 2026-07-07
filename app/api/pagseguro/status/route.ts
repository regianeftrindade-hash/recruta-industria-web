import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import {
  paymentBelongsToUser,
  syncPaymentStatusFromGateway,
} from '@/lib/payment-activation';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const chargeId = new URL(req.url).searchParams.get('chargeId');
    if (!chargeId) {
      return NextResponse.json({ error: 'chargeId é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const rec = await prisma.paymentRecord.findFirst({
      where: { reference: chargeId },
    });

    if (!rec) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!paymentBelongsToUser(rec.meta, user.id)) {
      return NextResponse.json({ error: 'Cobrança não pertence a este usuário' }, { status: 403 });
    }

    const { status, activated } = await syncPaymentStatusFromGateway(chargeId);

    const updated = await prisma.paymentRecord.findUnique({
      where: { reference: chargeId },
    });

    if (!updated) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.reference,
      reference: updated.reference,
      status,
      activated,
      amount: updated.amount,
      currency: updated.currency,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Erro PagSeguro status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'unexpected' },
      { status: 500 },
    );
  }
}

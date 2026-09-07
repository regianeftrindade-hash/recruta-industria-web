import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { saveCompanyExtraData } from '@/lib/company-storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { userId } = await params;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || 'verify');

    const company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    if (action === 'reject') {
      const reason = String(body.reason || 'Documentação não aprovada.').trim();
      await saveCompanyExtraData(userId, {
        verificationStatus: 'REJECTED',
        verifiedAt: null,
        rejectionReason: reason,
      });
      return NextResponse.json({ success: true, verificationStatus: 'REJECTED', rejectionReason: reason });
    }

    await saveCompanyExtraData(userId, {
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      rejectionReason: null,
    });

    return NextResponse.json({ success: true, verificationStatus: 'VERIFIED' });
  } catch (error) {
    console.error('Erro ao verificar empresa:', error);
    return NextResponse.json({ error: 'Erro ao atualizar verificação' }, { status: 500 });
  }
}

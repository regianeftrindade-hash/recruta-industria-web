import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { deleteOwnAccount } from '@/lib/account/delete-own-account';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { userId } = await params;
  if (!userId || userId.length > 80) {
    return NextResponse.json({ error: 'Empresa inválida.' }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { userId },
    select: { id: true, name: true },
  });
  if (!company) {
    return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
  }

  try {
    await prisma.companyPreference.deleteMany({ where: { companyUserId: userId } }).catch(() => undefined);
    const removed = await deleteOwnAccount(userId);
    return NextResponse.json({ ok: true, email: removed.email, name: company.name });
  } catch (error) {
    console.error('Erro ao excluir empresa:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível excluir a empresa.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

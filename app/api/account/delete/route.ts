import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/auth/api-auth';
import { deleteOwnAccount } from '@/lib/account/delete-own-account';

const CONFIRM_WORD = 'EXCLUIR';

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const confirm = String((body as { confirm?: unknown })?.confirm || '').trim().toUpperCase();
    if (confirm !== CONFIRM_WORD) {
      return NextResponse.json(
        { error: `Digite ${CONFIRM_WORD} para confirmar a exclusão.` },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const result = await deleteOwnAccount(user.id);

    return NextResponse.json({
      success: true,
      mode: result.mode,
      message: 'Cadastro excluído com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao excluir próprio cadastro:', error);
    const message = error instanceof Error ? error.message : 'Erro ao excluir cadastro';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

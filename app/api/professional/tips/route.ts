import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { limparDicasExpiradas } from '@/lib/profile/inbox-cleanup';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar o usuário e seu perfil
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ tips: [] });
    }

    await limparDicasExpiradas(user.profile.id);

    // Buscar as dicas deixadas para este profissional (último mês)
    const tips = await prisma.tip.findMany({
      where: { profileId: user.profile.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tips });
  } catch (error) {
    console.error('Erro ao buscar dicas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dicas' },
      { status: 500 }
    );
  }
}

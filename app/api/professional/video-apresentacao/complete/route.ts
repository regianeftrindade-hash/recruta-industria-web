import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { ensureVideoApresentacaoColumn } from '@/lib/ensure-db-schema';
import {
  getVideoApresentacaoPath,
  setVideoApresentacaoPath,
} from '@/lib/professional/professional-video-db';
import {
  deleteProfessionalVideo,
  isProfessionalVideoPathOwned,
} from '@/lib/professional/professional-video-storage';

export const runtime = 'nodejs';

async function resolveProfessionalUserId(request: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { id: true, role: true },
    });
    if (user && user.role !== 'COMPANY') return user.id;
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token?.email) {
    const user = await prisma.user.findUnique({
      where: { email: String(token.email).toLowerCase().trim() },
      select: { id: true, role: true },
    });
    if (user && user.role !== 'COMPANY') return user.id;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    await ensureVideoApresentacaoColumn();
    const userId = await resolveProfessionalUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = (await request.json()) as { path?: string };
    const path = body.path?.trim();

    if (!path || !isProfessionalVideoPathOwned(path, userId)) {
      return NextResponse.json({ error: 'Caminho de vídeo inválido' }, { status: 400 });
    }

    const previousPath = await getVideoApresentacaoPath(userId);
    const saved = await setVideoApresentacaoPath(userId, path);

    if (!saved) {
      await deleteProfessionalVideo(path).catch(() => undefined);
      return NextResponse.json(
        { error: 'Perfil não encontrado. Conclua o cadastro antes de anexar o vídeo.' },
        { status: 400 },
      );
    }

    if (previousPath && previousPath !== path) {
      await deleteProfessionalVideo(previousPath).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      hasVideoApresentacao: true,
    });
  } catch (error) {
    console.error('Erro ao concluir upload de vídeo:', error);
    return NextResponse.json({ error: 'Erro ao salvar vídeo no perfil' }, { status: 500 });
  }
}

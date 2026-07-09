import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { ensureVideoApresentacaoColumn } from '@/lib/ensure-db-schema';
import {
  VIDEO_APRESENTACAO_MAX_BYTES,
  extensionForVideoMime,
  isAllowedVideoMime,
  resolveVideoMime,
} from '@/lib/professional-video';
import {
  getVideoApresentacaoPath,
  setVideoApresentacaoPath,
} from '@/lib/professional/professional-video-db';
import {
  deleteProfessionalVideo,
  uploadProfessionalVideo,
} from '@/lib/professional/professional-video-storage';
import { streamVideoResponse } from '@/lib/professional/video-stream';

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

export async function GET(request: NextRequest) {
  try {
    await ensureVideoApresentacaoColumn();
    const userId = await resolveProfessionalUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const path = await getVideoApresentacaoPath(userId);
    const metaOnly = request.nextUrl.searchParams.get('meta') === '1';

    if (metaOnly) {
      return NextResponse.json({
        hasVideo: Boolean(path),
        hasVideoApresentacao: Boolean(path),
      });
    }

    if (!path) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    return streamVideoResponse(path, request);
  } catch (error) {
    console.error('Erro ao reproduzir vídeo:', error);
    return NextResponse.json({ error: 'Erro ao carregar vídeo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureVideoApresentacaoColumn();
    const userId = await resolveProfessionalUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Nenhum vídeo enviado' }, { status: 400 });
    }

    const mime = resolveVideoMime(file);

    if (!mime || !isAllowedVideoMime(mime)) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use MP4, MOV ou WebM.' },
        { status: 400 },
      );
    }

    if (file.size > VIDEO_APRESENTACAO_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx. 25 MB).' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const previousPath = await getVideoApresentacaoPath(userId);
    const newPath = await uploadProfessionalVideo(userId, buffer, mime);

    const saved = await setVideoApresentacaoPath(userId, newPath);
    if (!saved) {
      await deleteProfessionalVideo(newPath).catch(() => undefined);
      return NextResponse.json(
        { error: 'Perfil não encontrado. Conclua o cadastro antes de anexar o vídeo.' },
        { status: 400 },
      );
    }

    if (previousPath && previousPath !== newPath) {
      await deleteProfessionalVideo(previousPath).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      hasVideoApresentacao: true,
      mime: extensionForVideoMime(mime),
    });
  } catch (error) {
    console.error('Erro ao salvar vídeo:', error);
    const detail = error instanceof Error ? error.message : 'Erro ao salvar vídeo';
    const isSupabase = /supabase|storage|Variáveis do Supabase/i.test(detail);
    return NextResponse.json(
      {
        error: isSupabase
          ? 'Falha no storage de vídeo. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
          : 'Erro ao salvar vídeo',
        ...(process.env.NODE_ENV === 'development' ? { detail } : {}),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureVideoApresentacaoColumn();
    const userId = await resolveProfessionalUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const path = await getVideoApresentacaoPath(userId);
    if (path) {
      await deleteProfessionalVideo(path).catch(() => undefined);
    }
    await setVideoApresentacaoPath(userId, null);

    return NextResponse.json({ success: true, hasVideoApresentacao: false });
  } catch (error) {
    console.error('Erro ao remover vídeo:', error);
    return NextResponse.json({ error: 'Erro ao remover vídeo' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import { ensureVideoApresentacaoColumn } from '@/lib/ensure-db-schema';
import {
  VIDEO_APRESENTACAO_MAX_BYTES,
  isAllowedVideoMime,
  mimeFromFileName,
} from '@/lib/professional-video';
import {
  buildProfessionalVideoPath,
  createProfessionalVideoUploadUrl,
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

    const body = (await request.json()) as {
      mime?: string;
      fileName?: string;
      size?: number;
    };

    const mime =
      (body.mime && isAllowedVideoMime(body.mime) ? body.mime : null) ||
      (body.fileName ? mimeFromFileName(body.fileName) : null);

    if (!mime || !isAllowedVideoMime(mime)) {
      return NextResponse.json(
        { error: 'Formato não permitido. Use MP4, MOV ou WebM.' },
        { status: 400 },
      );
    }

    if (typeof body.size === 'number' && body.size > VIDEO_APRESENTACAO_MAX_BYTES) {
      return NextResponse.json(
        { error: 'Arquivo muito grande (máx. 25 MB).' },
        { status: 400 },
      );
    }

    const filePath = buildProfessionalVideoPath(userId, mime);
    const upload = await createProfessionalVideoUploadUrl(filePath);

    return NextResponse.json({
      signedUrl: upload.signedUrl,
      path: upload.path,
      token: upload.token,
      mime,
    });
  } catch (error) {
    console.error('Erro ao preparar upload de vídeo:', error);
    return NextResponse.json({ error: 'Erro ao preparar upload do vídeo' }, { status: 500 });
  }
}

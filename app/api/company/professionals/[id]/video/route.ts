import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/api-auth';
import { ensureVideoApresentacaoColumn } from '@/lib/ensure-db-schema';
import { getVideoApresentacaoPathByProfileId } from '@/lib/professional/professional-video-db';
import { streamVideoResponse } from '@/lib/professional/video-stream';
import { isCompanyVerified } from '@/lib/company-storage';
import { resolveCompanyOwnerUserId } from '@/lib/company/company-team';

export const runtime = 'nodejs';

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;

  const user = await prisma.user.findUnique({ where: { email: auth.email } });
  if (!user || user.role !== 'COMPANY') return null;
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await ensureVideoApresentacaoColumn();
    const companyUser = await getCompanyUser(request);
    if (!companyUser) {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 });
    }

    const { id: profileId } = await params;
    const ownerUserId = (await resolveCompanyOwnerUserId(companyUser.id)) || companyUser.id;

    // Desbloqueio fica no dono do plano (equipe RH usa o mesmo AccessRecord)
    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: { in: [ownerUserId, companyUser.id] },
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    if (!unlocked) {
      return NextResponse.json({ error: 'Perfil não desbloqueado' }, { status: 403 });
    }

    if (!(await isCompanyVerified(ownerUserId))) {
      return NextResponse.json({ error: 'Empresa aguardando verificação do CNPJ.' }, { status: 403 });
    }

    const path = await getVideoApresentacaoPathByProfileId(profileId);
    if (!path) {
      return NextResponse.json({ error: 'Vídeo não encontrado' }, { status: 404 });
    }

    return streamVideoResponse(path, request);
  } catch (error) {
    console.error('Erro ao reproduzir vídeo (empresa):', error);
    return NextResponse.json({ error: 'Erro ao carregar vídeo' }, { status: 500 });
  }
}

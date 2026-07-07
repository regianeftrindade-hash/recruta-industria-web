import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/api-auth';
import { getCompanyPlanContext } from '@/lib/company-plan';
import { listCompanyFavoriteProfileIds } from '@/lib/company-storage';
import {
  calculateCompatibilityScore,
  parseProfileIndustrial,
} from '@/lib/profile-industrial';
import { filterHabilidadesExtras } from '@/lib/company-profile-display';
import { mapProfileToFormEdit } from '@/lib/professional-profile-map';
import {
  getCompanyProfileTracking,
  upsertCompanyProfileTracking,
  type CompanyProfileTrackingData,
} from '@/lib/company-profile-tracking';
import { isArquivoAnexado } from '@/lib/arquivo-anexo';
import { parseSobreMimJSON } from '@/lib/sobre-mim';
import { parseTesteComportamentalJSON } from '@/lib/teste-comportamental';
import { lerCampoJsonDoPerfil } from '@/lib/profile-json-fields';
import { getVideoApresentacaoPathByProfileId } from '@/lib/professional/professional-video-db';
import { notifyProfessionalAsync, notifyProfileViewed } from '@/lib/professional-notifications';
function parseSkills(skills: string | null): string[] {
  if (!skills) return [];
  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 20) : [];
  } catch {
    return [];
  }
}

function maskName(name: string | null | undefined): string {
  if (!name?.trim()) return 'Profissional';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].charAt(0)}***`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}***`;
}

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
  });

  if (!user || user.role !== 'COMPANY') return null;
  return user;
}

function listarDocumentosAnexos(
  profile: {
    curricoURL: string | null;
    atestadoURL: string | null;
    formDataJSON: string | null;
  },
  certificadosUrl: string | null,
): Array<{ label: string; url: string }> {
  const vistos = new Set<string>();
  const docs: Array<{ label: string; url: string }> = [];

  const add = (label: string, url: unknown) => {
    if (!isArquivoAnexado(url) || vistos.has(url)) return;
    vistos.add(url);
    docs.push({ label, url });
  };

  add('Currículo', profile.curricoURL);
  add('Atestado', profile.atestadoURL);
  add('Certificados', certificadosUrl);

  if (profile.formDataJSON?.trim()) {
    try {
      const fd = JSON.parse(profile.formDataJSON) as Record<string, unknown>;
      add('Currículo', fd.curriculo);
      add('Atestado', fd.atestado);
      add('Certificados', fd.certificados);
      add('CNH', fd.cnhDocumento);
    } catch {
      /* ignora JSON inválido */
    }
  }

  return docs;
}

function sobreMimPreenchido(sobreMim: ReturnType<typeof parseSobreMimJSON>): boolean {
  return Object.values(sobreMim).some((v) => v.trim().length > 0);
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyUser = await getCompanyUser(request);    if (!companyUser) {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 });
    }

    const { id: profileId } = await params;
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const planContext = await getCompanyPlanContext(companyUser.id);
    const { features, tier } = planContext;

    const unlocked = await prisma.accessRecord.findFirst({
      where: {
        profileId,
        companyUserId: companyUser.id,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    const bloqueado = !unlocked;
    const industrial = parseProfileIndustrial(profile);
    const compatibilidade = calculateCompatibilityScore(profile, industrial, {});
    const favoritos = await listCompanyFavoriteProfileIds(companyUser.id);
    const favorito = favoritos.includes(profileId);

    await prisma.profileView.create({
      data: {
        profileId,
        companyUserId: companyUser.id,
        viewType: bloqueado ? 'SUMMARY' : 'FULL',
      },
    }).catch((err) => {
      console.warn('Falha ao registrar visualização:', err);
    });

    if (!bloqueado) {
      notifyProfessionalAsync(() =>
        notifyProfileViewed(profileId, companyUser.id)
      );
    }

    const tracking = await getCompanyProfileTracking(companyUser.id, profileId);

    const tips = await prisma.tip.findMany({
      where: { profileId, companyUserId: companyUser.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        message: true,
        isAnonymous: true,
        rating: true,
        createdAt: true,
      },
    });

    const habilidades = filterHabilidadesExtras(parseSkills(profile.skills), industrial);

    const resumo = {
      id: profile.id,
      nome: bloqueado ? maskName(profile.user.name) : profile.user.name || '—',
      cargo: profile.cargoDesejado || profile.title || '—',
      area: profile.areaInteresse || '—',
      local:
        profile.cidade && profile.estado
          ? `${profile.cidade}, ${profile.estado}`
          : profile.estado || '—',
      escolaridade: profile.escolaridade || '—',
      turno: profile.turnoDisponivel || '—',
      experiencia: profile.tempoExperiencia || '—',
      recolocacao: profile.recolocacao || '—',
      pretensaoSalarial: bloqueado ? undefined : profile.pretensaoSalarial || '—',
      mensagem: bloqueado ? undefined : profile.mensagemEmpresas || profile.bio || '—',
      habilidades,
      avatar: profile.avatar,
      bloqueado,
      unlocked: !bloqueado,
      favorito,
      compatibilidade,
      profileCompletion: profile.profileCompletion,
      segmentosIndustria: industrial.segmentosIndustria,
      maquinasEquipamentos: bloqueado
        ? industrial.maquinasEquipamentos.slice(0, 3)
        : industrial.maquinasEquipamentos,
      qualidadeProcessos: bloqueado ? [] : industrial.qualidadeProcessos,
      informatica: bloqueado ? [] : industrial.informatica,
      certificacoes: bloqueado ? [] : industrial.certificacoes,
      idiomas: bloqueado ? [] : industrial.idiomas,
      cursos: bloqueado ? [] : industrial.cursos,
      possuiCNH: bloqueado ? undefined : industrial.possuiCNH || '—',
      categoriaCNH: bloqueado ? undefined : industrial.categoriaCNH || '—',
      aceitaViagens: bloqueado ? undefined : industrial.aceitaViagens || '—',
      disponibilidadeMudanca: bloqueado ? undefined : industrial.disponibilidadeMudanca || '—',
      empresas: bloqueado ? [] : industrial.empresas,
      email: bloqueado ? undefined : profile.email || profile.user.email,
      telefone: bloqueado ? undefined : profile.phone || '—',
      whatsapp: bloqueado ? undefined : profile.whatsapp || '—',
      curriculoURL: bloqueado ? null : profile.curricoURL,
      certificadosUrl: bloqueado ? null : industrial.certificadosUrl,
      disponibilidadeContratacao: bloqueado
        ? undefined
        : industrial.disponivelContratacao
          || profile.disponivelContratacao
          || profile.disponibilidadeInicio
          || '—',
      ultimaAtualizacao: profile.updatedAt.toISOString(),
    };

    const formEdit = bloqueado
      ? null
      : mapProfileToFormEdit(profile, profile.user, profile.formDataJSON);

    const sobreMimRaw = bloqueado ? null : await lerCampoJsonDoPerfil(profile.userId, 'sobreMimJSON');
    const testeRaw = await lerCampoJsonDoPerfil(profile.userId, 'testeComportamentalJSON');
    const sobreMim = bloqueado ? null : parseSobreMimJSON(sobreMimRaw);
    const testeComportamental = parseTesteComportamentalJSON(testeRaw);
    const documentos = bloqueado
      ? []
      : listarDocumentosAnexos(profile, industrial.certificadosUrl);

    const videoPath = bloqueado ? null : await getVideoApresentacaoPathByProfileId(profileId);

    return NextResponse.json({
      resumo,
      formEdit,
      tracking,
      tips,
      sobreMim,
      sobreMimPreenchido: sobreMim ? sobreMimPreenchido(sobreMim) : false,
      testeComportamental,
      documentos,
      hasVideoApresentacao: Boolean(videoPath),
      videoApresentacaoUrl: videoPath ? `/api/company/professionals/${profileId}/video` : null,
      planTier: tier,      features,
      canUnlock:
        bloqueado
        && features.canUnlockContacts
        && (planContext.usage.unlocksRemaining === null || planContext.usage.unlocksRemaining > 0),
    });
  } catch (error) {
    console.error('Erro ao carregar perfil:', error);
    const detail = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      {
        error: 'Erro ao carregar perfil',
        detail: process.env.NODE_ENV === 'development' ? detail : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const companyUser = await getCompanyUser(request);    if (!companyUser) {
      return NextResponse.json({ error: 'Acesso restrito a empresas' }, { status: 403 });
    }

    const { id: profileId } = await params;
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const patch: Partial<CompanyProfileTrackingData> = {};

    if (typeof body.contatado === 'boolean') patch.contatado = body.contatado;
    if (typeof body.entrevistado === 'boolean') patch.entrevistado = body.entrevistado;
    if (typeof body.contratado === 'boolean') patch.contratado = body.contratado;
    if (typeof body.notes === 'string') patch.notes = body.notes;

    const tracking = await upsertCompanyProfileTracking(companyUser.id, profileId, patch);
    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Erro ao salvar anotações:', error);
    return NextResponse.json({ error: 'Erro ao salvar anotações' }, { status: 500 });
  }
}

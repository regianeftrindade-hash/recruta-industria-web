import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/api-auth';
import { listCompanyFavoriteProfileIds } from '@/lib/company-storage';
import {
  assertCompanyCandidateAccess,
  companyHasActiveUnlock,
} from '@/lib/company/company-candidate-access';
import {
  calculateCompatibilityScore,
  parseProfileIndustrial,
} from '@/lib/profile-industrial';
import { filterHabilidadesExtras } from '@/lib/company-profile-display';
import { mapProfileToFormEdit, readSnapshotDisplay } from '@/lib/professional-profile-map';
import {
  getCompanyProfileTracking,
  upsertCompanyProfileTracking,
  type CompanyProfileTrackingData,
} from '@/lib/company-profile-tracking';
import { isArquivoAnexado } from '@/lib/arquivo-anexo';
import { fotoGravada } from '@/lib/professional/foto-perfil';
import { parseSobreMimJSON } from '@/lib/sobre-mim';
import { parseTesteComportamentalJSON } from '@/lib/teste-comportamental';
import { lerCampoJsonDoPerfil } from '@/lib/profile-json-fields';
import { getVideoApresentacaoPathByProfileId } from '@/lib/professional/professional-video-db';
import { notifyProfessionalAsync, notifyProfileViewed } from '@/lib/professional-notifications';
import { companyProfileViewType, recordCompanyProfileView } from '@/lib/professional/record-profile-view';
import { isAnyCompanyAnonymous } from '@/lib/company/company-preferences';
import {
  resolveProfileIdFromParam,
} from '@/lib/profile/resolve-profile-ref';
import {
  buildProfilePublicSlug,
  companyProfessionalPath,
  looksLikeProfileCuid,
} from '@/lib/profile/public-slug';
import { companyDocumentHref } from '@/lib/storage/private-uploads';
import { apiErrorResponse } from "@/lib/i18n/api-response";
import { sanitizeUnlockedCompanyPayload } from "@/lib/privacy/company-unlocked-payload";

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
    const href = companyDocumentHref(url);
    if (href) docs.push({ label, url: href });
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
      return await apiErrorResponse("rest.api.companyOnly", 403);
    }

    const { id: rawId } = await params;
    const profileId = looksLikeProfileCuid(rawId)
      ? rawId
      : (await resolveProfileIdFromParam(rawId));
    if (!profileId) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const publicSlug = buildProfilePublicSlug({
      id: profile.id,
      title: profile.title,
      cargo: profile.cargoDesejado,
      city: profile.cidade,
      state: profile.estado,
    });

    const access = await assertCompanyCandidateAccess(companyUser.id, {
      actorUserId: companyUser.id,
    });
    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }
    const { planContext, dataUserId } = access;
    const { features, tier, verification } = planContext;

    const unlocked = await companyHasActiveUnlock(dataUserId, profileId);

    const bloqueado = !unlocked || !verification.canAccessSensitiveProfiles;
    const industrial = parseProfileIndustrial(profile);
    const compatibilidade = calculateCompatibilityScore(profile, industrial, {});
    const favoritos = await listCompanyFavoriteProfileIds(dataUserId);
    const favorito = favoritos.includes(profileId);

    // Modo anônimo: a visualização é registrada sem identificar a empresa
    // (sufixo _ANON) e o profissional não recebe o e-mail com o nome.
    const anonymousMode = await isAnyCompanyAnonymous([companyUser.id, dataUserId]);

    await recordCompanyProfileView({
      profileId,
      profileOwnerUserId: profile.userId,
      companyUserId: dataUserId,
      viewType: companyProfileViewType(!bloqueado, anonymousMode),
    }).catch((err) => {
      console.warn('Falha ao registrar visualização:', err);
    });

    if (!bloqueado && !anonymousMode) {
      notifyProfessionalAsync(() =>
        notifyProfileViewed(profileId, dataUserId, companyUser.id)
      );
    }

    const tracking = await getCompanyProfileTracking(dataUserId, profileId);

    const tips = await prisma.tip.findMany({
      where: { profileId, companyUserId: dataUserId },
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
    const snap = readSnapshotDisplay(profile.formDataJSON);

    const resumo = {
      id: profile.id,
      slug: publicSlug,
      path: companyProfessionalPath(publicSlug, profile.id),
      nome: bloqueado ? maskName(profile.user.name || snap.nome) : profile.user.name || snap.nome || '—',
      cargo: profile.cargoDesejado || profile.title || snap.cargo || '—',
      area: profile.areaInteresse || '—',
      local:
        profile.cidade && profile.estado
          ? `${profile.cidade}, ${profile.estado}`
          : profile.estado || snap.estado || snap.cidade || '—',
      escolaridade: profile.escolaridade || '—',
      turno: profile.turnoDisponivel || '—',
      experiencia: profile.tempoExperiencia || '—',
      recolocacao: profile.recolocacao || '—',
      pretensaoSalarial: bloqueado ? undefined : profile.pretensaoSalarial || '—',
      mensagem: bloqueado ? undefined : profile.mensagemEmpresas || profile.bio || '—',
      habilidades,
      // Avatar só após desbloqueio — evita identificação visual com blur CSS.
      avatar: bloqueado ? null : fotoGravada(profile.avatar, profile.formDataJSON),
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
      curriculoURL: bloqueado ? null : companyDocumentHref(profile.curricoURL),
      certificadosUrl: bloqueado ? null : companyDocumentHref(industrial.certificadosUrl),
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
    if (formEdit?.formData) {
      const files = formEdit.formData as Record<string, unknown>;
      for (const key of ['curriculo', 'atestado', 'certificados', 'cnhDocumento'] as const) {
        if (typeof files[key] === 'string') {
          files[key] = companyDocumentHref(files[key]) ?? files[key];
        }
      }
    }
    const sobreMimRaw = bloqueado ? null : await lerCampoJsonDoPerfil(profile.userId, 'sobreMimJSON');
    const testeRaw = bloqueado ? null : await lerCampoJsonDoPerfil(profile.userId, 'testeComportamentalJSON');
    const sobreMim = bloqueado ? null : parseSobreMimJSON(sobreMimRaw);
    const testeComportamental = bloqueado ? null : parseTesteComportamentalJSON(testeRaw);
    const documentos = bloqueado
      ? []
      : listarDocumentosAnexos(profile, industrial.certificadosUrl);

    const videoPath = bloqueado ? null : await getVideoApresentacaoPathByProfileId(profileId);

    const payload = {
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
      planTier: tier,
      features,
      verification,
      canUnlock:
        bloqueado
        && features.canUnlockContacts
        && (planContext.usage.unlocksRemaining === null || planContext.usage.unlocksRemaining > 0),
    };

    // Minimização LGPD Art. 11 também após desbloqueio (contatos autorizados permanecem).
    return NextResponse.json(
      bloqueado ? payload : sanitizeUnlockedCompanyPayload(payload as Record<string, unknown>),
    );
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
      return await apiErrorResponse("rest.api.companyOnly", 403);
    }

    const { id: rawId } = await params;
    const profileId = looksLikeProfileCuid(rawId)
      ? rawId
      : (await resolveProfileIdFromParam(rawId));
    if (!profileId) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || !profile.isVisible || profile.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 });
    }

    const access = await assertCompanyCandidateAccess(companyUser.id, {
      actorUserId: companyUser.id,
    });
    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }
    const { dataUserId } = access;

    const hasUnlock = await companyHasActiveUnlock(dataUserId, profileId);
    if (!hasUnlock) {
      return NextResponse.json(
        { error: 'Desbloqueie o perfil para registrar acompanhamento.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const patch: Partial<CompanyProfileTrackingData> = {};

    if (typeof body.contatado === 'boolean') patch.contatado = body.contatado;
    if (typeof body.entrevistado === 'boolean') patch.entrevistado = body.entrevistado;
    if (typeof body.emTeste === 'boolean') patch.emTeste = body.emTeste;
    if (typeof body.contratado === 'boolean') patch.contratado = body.contratado;
    if (typeof body.naoContratado === 'boolean') patch.naoContratado = body.naoContratado;
    if (typeof body.entrevistaCancelada === 'boolean') patch.entrevistaCancelada = body.entrevistaCancelada;
    if (typeof body.notes === 'string') patch.notes = body.notes;

    const tracking = await upsertCompanyProfileTracking(dataUserId, profileId, patch);
    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Erro ao salvar anotações:', error);
    return NextResponse.json({ error: 'Erro ao salvar anotações' }, { status: 500 });
  }
}

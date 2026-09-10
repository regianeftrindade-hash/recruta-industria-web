import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import {
  buildProfileUpsertPayload,
  mapProfileToDashboard,
  mapProfileToFormEdit,
  keepExistingProfileFields,
  readSnapshotDisplay,
} from '@/lib/professional-profile-map';
import {
  getProfileFormSnapshot,
  saveProfileFormSnapshot,
} from '@/lib/profile-snapshot';
import { isProfessionalRegistrationComplete } from '@/lib/professional-registration';
import { getVideoApresentacaoPath } from '@/lib/professional/professional-video-db';
import type { User, Prisma } from '@prisma/client';

const userAuthSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
} as const;

function toUser(row: {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
}): User {
  return {
    ...row,
    passwordHash: null,
    lastLogin: null,
    lastSeenAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

async function resolveAuthEmail(request: NextRequest): Promise<{ email: string; name?: string } | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return {
      email: session.user.email.toLowerCase().trim(),
      name: session.user.name ?? undefined,
    };
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.email) {
    return {
      email: String(token.email).toLowerCase().trim(),
      name: token.name ? String(token.name) : undefined,
    };
  }

  return null;
}

function incompleteProfileResponse(user: { name: string | null; email: string }) {
  return NextResponse.json({
      nome: user.name || user.email?.split('@')[0] || 'Usuário',
      email: user.email,
      profissao: 'Não preenchido',
      cargoDesejado: 'Não preenchido',
      localizacao: 'Não preenchido',
      experiencia: 'Não preenchido',
      experiencias: 'Não preenchido',
      formacao: 'Não preenchido',
      descricaoPessoal: 'Não preenchido',
      habilidades: [],
      telefone: '',
      whatsapp: '',
      fotoPerfil: null,
      avatar: null,
      curriculo: null,
      atestado: null,
      dataVisualizacoes: 0,
      plano: 'free',
      formEdit: null,
      hasProfile: false,
      hasFormSnapshot: false,
      hasVideoApresentacao: false,
      registrationComplete: false,
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: userAuthSelect,
    });

    // Não sobrescreve o nome do cadastro com o nome da conta Google.
    if (user && !user.name?.trim() && auth.name?.trim()) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: auth.name.trim() },
        select: userAuthSelect,
      });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: auth.email,
          name: auth.name?.trim() || auth.email.split('@')[0],
          role: 'PROFESSIONAL'
        },
        select: userAuthSelect,
      });
    }

    let profile = null;
    try {
      profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });
    } catch (error) {
      console.error('[profile] Falha ao ler Profile via Prisma, tentando SELECT *:', error);
      try {
        const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
          SELECT * FROM "Profile" WHERE "userId" = ${user.id} LIMIT 1
        `;
        if (rows[0]) {
          profile = rows[0] as typeof profile;
        }
      } catch (rawError) {
        console.error('[profile] Leitura bruta do Profile falhou:', rawError);
      }
    }

    if (profile) {
      const snap = readSnapshotDisplay(profile.formDataJSON);
      if (snap.nome && !user.name?.trim()) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name: snap.nome },
            select: userAuthSelect,
          });
        } catch (error) {
          console.error('[profile] Falha ao restaurar nome do snapshot:', error);
        }
      }

      const mappedUser = toUser({
        ...user,
        name: user.name?.trim() || snap.nome || user.name,
      });
      const displayProfile = {
        ...profile,
        cargoDesejado: profile.cargoDesejado?.trim() || snap.cargo || profile.cargoDesejado,
        title: (profile.title?.trim() && profile.title !== 'Profissional')
          ? profile.title
          : (snap.cargo || profile.title),
        cidade: profile.cidade?.trim() || snap.cidade || profile.cidade,
        estado: profile.estado?.trim() || snap.estado || profile.estado,
        phone: profile.phone?.trim() || snap.telefone || profile.phone,
        mensagemEmpresas: profile.mensagemEmpresas?.trim() || snap.mensagem || profile.mensagemEmpresas,
      };

      try {
        const formSnapshot = profile.formDataJSON ?? (await getProfileFormSnapshot(user.id));
        const dashboard = mapProfileToDashboard(displayProfile, mappedUser);
        const formEdit = mapProfileToFormEdit(displayProfile, mappedUser, formSnapshot);
        let videoPath: string | null = null;
        try {
          videoPath = await getVideoApresentacaoPath(user.id);
        } catch (error) {
          console.error('[profile] vídeo de apresentação:', error);
        }

        return NextResponse.json({
          ...dashboard,
          formEdit,
          hasProfile: true,
          hasFormSnapshot: !!formSnapshot,
          hasVideoApresentacao: Boolean(videoPath),
          registrationComplete: isProfessionalRegistrationComplete(profile),
        });
      } catch (error) {
        console.error('[profile] Falha ao montar perfil:', error);
        const formEdit = mapProfileToFormEdit(profile, mappedUser, profile.formDataJSON);
        return NextResponse.json({
          ...mapProfileToDashboard(profile, mappedUser),
          formEdit,
          hasProfile: true,
          hasFormSnapshot: Boolean(profile.formDataJSON),
          hasVideoApresentacao: false,
          registrationComplete: isProfessionalRegistrationComplete(profile),
        });
      }
    }

    return incompleteProfileResponse(user);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);

    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);

    if (!auth) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    let user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: userAuthSelect,
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: auth.email,
          name: auth.name?.trim() || auth.email.split('@')[0],
          role: 'PROFESSIONAL'
        },
        select: userAuthSelect,
      });
    }

    if (body.nome && typeof body.nome === 'string' && body.nome.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: body.nome.trim() },
      });
      user = { ...user, name: body.nome.trim() };
    }

    const { prismaData: profileData, formDataJSON } = buildProfileUpsertPayload(
      body,
      user.email
    );

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });
    const mergedData = keepExistingProfileFields(
      profileData as Record<string, unknown>,
      existingProfile as unknown as Record<string, unknown> | null,
    );

    let snapshotToSave = formDataJSON;
    if (existingProfile?.formDataJSON?.trim() && formDataJSON) {
      try {
        const incoming = JSON.parse(formDataJSON) as Record<string, unknown>;
        const previous = JSON.parse(existingProfile.formDataJSON) as Record<string, unknown>;
        const filled = (obj: Record<string, unknown>) =>
          Object.values(obj).filter((v) => {
            if (typeof v === 'string') return v.trim().length > 0;
            if (Array.isArray(v)) return v.length > 0;
            return v != null && v !== false;
          }).length;
        if (filled(incoming) + 4 < filled(previous)) {
          snapshotToSave = existingProfile.formDataJSON;
        }
      } catch {
        snapshotToSave = existingProfile.formDataJSON;
      }
    }

    const profile = await prisma.profile.upsert({
      where: {
        userId: user.id
      },
      update: {
        ...(mergedData as Prisma.ProfileUncheckedUpdateInput),
        formDataJSON: snapshotToSave,
        updatedAt: new Date()
      },
      create: {
        ...(mergedData as Prisma.ProfileUncheckedCreateInput),
        userId: user.id,
        title: String(mergedData.title || 'Profissional'),
        location: String(mergedData.location || 'Não informado'),
        formDataJSON: snapshotToSave,
      }
    });

    await saveProfileFormSnapshot(user.id, snapshotToSave);

    await prisma.professional.upsert({
      where: {
        userId: user.id
      },
      update: {
        title: String(mergedData.title || ''),
      },
      create: {
        userId: user.id,
        title: String(mergedData.title || profileData.title || 'Profissional'),
      }
    });

    const mappedUser = toUser(user);
    const savedSnapshot = await getProfileFormSnapshot(user.id);
    const dashboard = mapProfileToDashboard(profile, mappedUser);

    return NextResponse.json({
      success: true,
      message: 'Perfil salvo com sucesso',
      profile: dashboard,
      formEdit: mapProfileToFormEdit(profile, mappedUser, savedSnapshot),
    });

  } catch (error) {
    console.error('Erro ao salvar perfil:', error);

    return NextResponse.json(
      {
        error: 'Erro ao salvar perfil',
        details: String(error)
      },
      {
        status: 500
      }
    );
  }
}

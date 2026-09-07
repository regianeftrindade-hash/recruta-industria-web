
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/db';
import {
  buildProfileUpsertPayload,
  mapProfileToDashboard,
  mapProfileToFormEdit,
  rebuildFormSnapshotFromProfile,
} from '@/lib/professional-profile-map';
import {
  getProfileFormSnapshot,
  saveProfileFormSnapshot,
} from '@/lib/profile-snapshot';
import { isProfessionalRegistrationComplete } from '@/lib/professional-registration';
import { ensurePaymentSchema, ensureUserLastSeenColumn } from '@/lib/ensure-db-schema';
import { getVideoApresentacaoPath } from '@/lib/professional/professional-video-db';
import type { User } from '@prisma/client';

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
    await ensureUserLastSeenColumn();

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

    if (user && auth.name && auth.name.trim() && user.name !== auth.name.trim()) {
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
      console.error('[profile] Falha ao ler Profile:', error);
    }

    if (profile) {
      try {
        if (!profile.formDataJSON?.trim()) {
          const rebuilt = rebuildFormSnapshotFromProfile(profile, toUser(user));
          profile = await prisma.profile.update({
            where: { userId: user.id },
            data: { formDataJSON: rebuilt },
          });
        }

        const formSnapshot = profile.formDataJSON ?? (await getProfileFormSnapshot(user.id));
        const mappedUser = toUser(user);
        const dashboard = mapProfileToDashboard(profile, mappedUser);
        const formEdit = mapProfileToFormEdit(profile, mappedUser, formSnapshot);
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
        return incompleteProfileResponse(user);
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
    await ensurePaymentSchema();
    await ensureUserLastSeenColumn();

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

    const profile = await prisma.profile.upsert({
      where: {
        userId: user.id
      },
      update: {
        ...profileData,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        ...profileData,
      }
    });

    await saveProfileFormSnapshot(user.id, formDataJSON);

    await prisma.professional.upsert({
      where: {
        userId: user.id
      },
      update: {
        title: profileData.cargoDesejado || profileData.title || ''
      },
      create: {
        userId: user.id,
        title: profileData.cargoDesejado || profileData.title || 'Profissional'
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

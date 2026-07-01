











import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Buscar token JWT diretamente da requisição
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log('TOKEN PROFILE:', token);
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar dados do usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      include: {
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se o usuário tem um perfil, retornar os dados reais
    if (user.profile) {
      const skills = user.profile.skills ? JSON.parse(user.profile.skills) : [];
      return NextResponse.json({
        nome: user.name || user.email?.split('@')[0] || 'Usuário',
        email: user.profile.email || user.email,
        profissao: user.profile.title || 'Não preenchido',
        cargoDesejado: user.profile.title || 'Não preenchido',
        localizacao: user.profile.location || 'Não preenchido',
        experiencia: user.profile.experience || 'Não preenchido',
        experiencias: user.profile.experience || 'Não preenchido',
        formacao: user.profile.fullDescription || 'Não preenchido',
        descricaoPessoal: user.profile.fullDescription || 'Não preenchido',
        habilidades: skills,
        telefone: user.profile.phone || '',
        whatsapp: user.profile.whatsapp || '',
        fotoPerfil: user.profile.avatar || null,
        avatar: user.profile.avatar || null,
        curriculo: user.profile.curricoURL || user.profile.portfolio || null,
        atestado: user.profile.atestadoURL || null,
        dataVisualizacoes: user.profile.viewCount || 0,
        plano: 'free'
      });
    }

    // Se não tem perfil, retornar dados padrão
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
      dataVisualizacoes: 0,
      plano: 'free'
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil' },
      { status: 500 }
    );
  }
}

// Helper function to clean data values
function getStringValue(value: any): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  if (value && typeof value === 'object' && Object.keys(value).length === 0) {
    return null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log('TOKEN PROFILE:', token);
    
    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log('>> /api/professional/profile POST - token email:', token.email);

    const body = await request.json();

    // Logar campos relevantes para debug
    console.log('>> /api/professional/profile POST - body keys:', Object.keys(body));
    console.log('>> fotoPerfil (preview):', typeof body.fotoPerfil === 'string' ? String(body.fotoPerfil).slice(0, 200) : body.fotoPerfil);
    console.log('>> curriculo / curricoURL (preview):', typeof body.curriculo === 'string' ? String(body.curriculo).slice(0, 200) : body.curriculo, typeof body.curricoURL === 'string' ? String(body.curricoURL).slice(0,200) : body.curricoURL);
    console.log('>> atestado / atestadoURL (preview):', typeof body.atestado === 'string' ? String(body.atestado).slice(0,200) : body.atestado, typeof body.atestadoURL === 'string' ? String(body.atestadoURL).slice(0,200) : body.atestadoURL);


    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: token.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Clean data values to ensure only strings or null are passed to Prisma
    const cleanedAvatar = getStringValue(body.fotoPerfil) || getStringValue(body.avatar) || null;
    const cleanedPortfolio = getStringValue(body.curriculo) || getStringValue(body.curricoURL) || getStringValue(body.portfolio) || null;
    const cleanedAtestado = getStringValue(body.atestado) || getStringValue(body.atestadoURL) || null;

    // Criar ou atualizar perfil profissional
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        title: body.cargoDesejado || body.profissao || '',
        bio: body.experiencias || body.descricaoPessoal || '',
        fullDescription: body.descricaoPessoal || body.experiencias || '',
        location: body.cidade && body.estado ? `${body.cidade}, ${body.estado}` : '',
        phone: body.telefone || '',
        whatsapp: body.whatsapp === 'Sim' ? body.telefone : '',
        email: body.email || user.email,
        skills: body.habilidades ? JSON.stringify(body.habilidades.split(',').map((h: string) => h.trim())) : null,
        experience: body.tempoExperiencia || body.experiencias || '',
        avatar: cleanedAvatar,
        portfolio: cleanedPortfolio,
        curricoURL: cleanedPortfolio,
        atestadoURL: cleanedAtestado,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        title: body.cargoDesejado || body.profissao || 'Profissional',
        bio: body.experiencias || body.descricaoPessoal || '',
        fullDescription: body.descricaoPessoal || body.experiencias || '',
        location: body.cidade && body.estado ? `${body.cidade}, ${body.estado}` : 'Não informado',
        phone: body.telefone || '',
        whatsapp: body.whatsapp === 'Sim' ? body.telefone : '',
        email: body.email || user.email,
        skills: body.habilidades ? JSON.stringify(body.habilidades.split(',').map((h: string) => h.trim())) : null,
        experience: body.tempoExperiencia || body.experiencias || '',
        avatar: cleanedAvatar,
        portfolio: cleanedPortfolio,
        curricoURL: cleanedPortfolio,
        atestadoURL: cleanedAtestado
      }
    });

    // Atualizar também a tabela Professional se existir
    const professional = await prisma.professional.upsert({
      where: { userId: user.id },
      update: {
        title: body.cargoDesejado || body.profissao || ''
      },
      create: {
        userId: user.id,
        title: body.cargoDesejado || body.profissao || 'Profissional'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil salvo com sucesso',
      profile: {
        nome: user.name,
        email: profile.email,
        profissao: profile.title,
        cargoDesejado: profile.title,
        localizacao: profile.location,
        experiencia: profile.experience,
        experiencias: profile.experience,
        formacao: profile.fullDescription,
        descricaoPessoal: profile.fullDescription,
        habilidades: profile.skills ? JSON.parse(profile.skills) : [],
        telefone: profile.phone,
        whatsapp: profile.whatsapp,
        avatar: profile.avatar,
        fotoPerfil: profile.avatar,
        curriculo: profile.curricoURL || profile.portfolio,
        dataVisualizacoes: profile.viewCount,
        plano: 'free'
      }
    });
  } catch (error) {
    console.error('Erro ao salvar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar perfil', details: String(error) },
      { status: 500 }
    );
  }
}

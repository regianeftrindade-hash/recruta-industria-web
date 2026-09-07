import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/users';
import { matchesCompanyTestBypass } from '@/lib/company/company-test-bypass-shared';
import { resolveAuthEmail } from '@/lib/auth/api-auth';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!(await enforceApiRateLimit(`user-type:${ip}`, 30, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 });
    }

    const auth = await resolveAuthEmail(request);
    if (!auth) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requested = typeof body.email === 'string' ? body.email.toLowerCase().trim() : '';

    // Só permite consultar o próprio e-mail da sessão (anti-enumeração)
    if (requested && requested !== auth.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const user = await findUserByEmail(auth.email);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const isTestBypass =
      process.env.NODE_ENV === 'development' &&
      matchesCompanyTestBypass({
        email: user.email,
        userName: user.name,
      });

    return NextResponse.json({
      userType: isTestBypass ? 'COMPANY' : user.role,
      testBypass: isTestBypass,
      success: true,
    });
  } catch (error) {
    console.error('Erro ao buscar tipo do usuário:', error);
    return NextResponse.json({ error: 'Erro ao buscar tipo do usuário' }, { status: 500 });
  }
}

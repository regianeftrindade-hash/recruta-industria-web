import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resolveAuthEmail } from '@/lib/api-auth';
import { clearUserPresence } from '@/lib/presence';

async function handleLogout(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (auth) {
      const user = await prisma.user.findUnique({
        where: { email: auth.email },
        select: { id: true },
      });
      if (user) await clearUserPresence(user.id);
    }
  } catch {
    /* segue com logout mesmo se presença falhar */
  }

  const redirectParam = request.nextUrl.searchParams.get('redirect');

  // Sem destino interno: home (logout público).
  if (!redirectParam?.startsWith('/') || redirectParam === '/') {
    const response = NextResponse.redirect(new URL('/', request.url), { status: 302 });
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('next-auth.csrf-token');
    response.cookies.delete('__Secure-next-auth.session-token');
    response.cookies.delete('__Host-next-auth.csrf-token');
    return response;
  }

  // Admin volta ao /login; demais fluxos públicos usam a home.
  const target =
    redirectParam === '/admin' || redirectParam.startsWith('/admin/')
      ? new URL(`/login?redirect=${encodeURIComponent(redirectParam)}`, request.url)
      : new URL(`/?redirect=${encodeURIComponent(redirectParam)}`, request.url);

  const response = NextResponse.redirect(target, {
    status: 302,
  });

  // Limpar todos os cookies de autenticação do NextAuth
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('next-auth.callback-url');
  response.cookies.delete('next-auth.csrf-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  response.cookies.delete('__Host-next-auth.csrf-token');

  return response;
}

export async function POST(request: NextRequest) {
  try {
    return handleLogout(request);
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export async function GET(request: NextRequest) {
  try {
    return handleLogout(request);
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

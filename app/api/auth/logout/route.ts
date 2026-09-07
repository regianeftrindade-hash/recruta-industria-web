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
  const loginUrl = new URL('/login', request.url);

  if (redirectParam?.startsWith('/')) {
    loginUrl.searchParams.set('redirect', redirectParam);
  } else {
    loginUrl.searchParams.set('tipo', 'profissional');
  }

  const response = NextResponse.redirect(loginUrl, {
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
    return NextResponse.redirect(new URL('/login?tipo=profissional', request.url));
  }
}

export async function GET(request: NextRequest) {
  try {
    return handleLogout(request);
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.redirect(new URL('/login?tipo=profissional', request.url));
  }
}

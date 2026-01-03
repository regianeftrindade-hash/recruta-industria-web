import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, isIPBlocked, generateCSRFToken } from '@/lib/security';

export function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  // Verificar se IP está bloqueado
  if (isIPBlocked(ip)) {
    return NextResponse.json(
      { error: 'Acesso bloqueado' },
      { status: 403 }
    );
  }

  // Adicionar Security Headers
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Em desenvolvimento, não faz bloqueio de rotas de cadastro
  if (process.env.NODE_ENV === 'development') {
    return response;
  }

  const { pathname } = request.nextUrl;

  // Redireciona HTTP para HTTPS em produção (usa cabeçalho do proxy)
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (forwardedProto && forwardedProto !== 'https' && !isLocalhost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, { status: 308 });
  }

  // Rotas protegidas que precisam de autenticação
  const protectedRoutes = [
    '/professional/dashboard',
    '/company/dashboard-empresa',
    '/company/company/profile',
  ];

  // Verifica se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Verifica se existe sessão/token (você pode implementar com cookies)
    // Por enquanto, deixamos o NextAuth gerenciar via cookies
    const session = request.cookies.get('next-auth.session-token');

    if (!session) {
      // Redireciona para login se não autenticado
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Configurar quais rotas usar o middleware
export const config = {
  matcher: [
    '/professional/dashboard/:path*',
    '/company/dashboard-empresa/:path*',
    '/company/company/profile/:path*',
  ],
};

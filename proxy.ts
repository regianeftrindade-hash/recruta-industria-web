import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getSecurityHeaders, isIPBlocked } from '@/lib/security';
import { hasAdminAccess } from '@/lib/auth/admin-auth';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';
import {
  ADMIN_2FA_COOKIE,
  isAdmin2faRequired,
  verifyAdmin2faToken,
} from '@/lib/security/admin-2fa-edge';
import { destinoEmailSemSessao } from '@/lib/notifications/email-home-link';
import {
  decideProtectedRouteAccess,
  protectedAreaForPath,
} from '@/lib/auth/route-role-guard';
import { applyRelativeRedirect } from '@/lib/auth/apply-relative-redirect';

export async function proxy(request: NextRequest) {
  const ip = getClientIp(request);

  if (isIPBlocked(ip)) {
    return NextResponse.json({ error: 'Acesso bloqueado' }, { status: 403 });
  }

  const { pathname } = request.nextUrl;

  // Login público em /login (home comercial não tem formulários).

  const isNextAuthFlow =
    pathname === '/api/auth/session'
    || pathname === '/api/auth/csrf'
    || pathname === '/api/auth/providers'
    || pathname === '/api/auth/error'
    || pathname.startsWith('/api/auth/signin')
    || pathname.startsWith('/api/auth/signout')
    || pathname.startsWith('/api/auth/callback');

  if (pathname.startsWith('/api/') && !isNextAuthFlow) {
    const sensitive =
      pathname.startsWith('/api/auth/') ||
      pathname.startsWith('/api/upload') ||
      pathname.startsWith('/api/admin/');
    const limit = sensitive ? 60 : 180;
    if (!(await enforceApiRateLimit(`mw:${ip}:${sensitive ? 's' : 'g'}`, limit, 60_000))) {
      return NextResponse.json({ error: 'Muitas requisições' }, { status: 429 });
    }
  }

  const response = NextResponse.next();
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    const email = typeof token?.email === 'string' ? token.email : null;

    if (
      !hasAdminAccess({
        isAdmin: token?.isAdmin === true,
        email,
        role: typeof token?.userType === 'string' ? token.userType : null,
      })
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const skip2fa =
      pathname.startsWith('/admin-verify-2fa')
      || pathname.startsWith('/api/admin/2fa');

    if (!skip2fa && isAdmin2faRequired() && email) {
      const cookie = request.cookies.get(ADMIN_2FA_COOKIE)?.value;
      if (!verifyAdmin2faToken(cookie, email)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin-verify-2fa';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }
    }

    return response;
  }

  // Página de 2FA admin (fora do layout /admin)
  if (pathname.startsWith('/admin-verify-2fa')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const email = typeof token?.email === 'string' ? token.email : null;
    if (
      !hasAdminAccess({
        isAdmin: token?.isAdmin === true,
        email,
        role: typeof token?.userType === 'string' ? token.userType : null,
      })
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(url);
    }
    return response;
  }

  // URLs antigas /company/profissional/... → sempre /company/professional/[id]
  // (antes do early-return de development e dos redirects HTTPS)
  if (pathname.startsWith('/company/profissional/')) {
    const rest = pathname.slice('/company/profissional/'.length).split('/')[0] || '';
    const qid = request.nextUrl.searchParams.get('id') || '';
    const cuidRe = /^c[a-z0-9]{20,}$/i;
    const targetId = cuidRe.test(qid) ? qid : cuidRe.test(rest) ? rest : '';
    const url = request.nextUrl.clone();
    if (targetId) {
      url.pathname = `/company/professional/${encodeURIComponent(targetId)}`;
      url.search = '';
      return NextResponse.redirect(url);
    }
    url.pathname = '/company/dashboard-empresa';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Sessão + papel: profissional / empresa (também em development)
  if (protectedAreaForPath(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    const email = typeof token?.email === 'string' ? token.email : null;
    const decision = decideProtectedRouteAccess({
      pathname,
      hasEmail: Boolean(email),
      userType: token?.userType,
      isAdmin: token?.isAdmin === true,
      emailHomePath: destinoEmailSemSessao(pathname),
    });

    if (decision.action === 'unauthenticated') {
      // redirectPath pode ser "/login?tipo=empresa" — não usar url.pathname=href
      // (isso virava "/%3Facesso=empresa" e quebrava o retorno do Stripe).
      return applyRelativeRedirect(request, decision.redirectPath, {
        preserveRedirectFrom: decision.preserveRedirectQuery ? pathname : null,
      });
    }

    if (decision.action === 'wrong_role') {
      return applyRelativeRedirect(request, decision.redirectPath);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return response;
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = request.headers.get('host') || '';
  const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  if (forwardedProto && forwardedProto !== 'https' && !isLocalhost) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, { status: 308 });
  }

  const hostname = host.split(':')[0].toLowerCase();
  if (hostname === 'recrutaindustria.com') {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.hostname = 'www.recrutaindustria.com';
    return NextResponse.redirect(url, { status: 308 });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};

import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/security.server';
import { isAdminUser } from '@/lib/admin-auth';
import {
  ensureCompanyTestBypassReady,
  matchesCompanyTestBypass,
} from '@/lib/company/company-test-bypass';
import {
  checkRateLimit,
  incrementRateLimitCounter,
  resetRateLimit,
  isAccountLocked,
  incrementFailedAttempts,
  resetFailedAttempts,
  logAudit,
} from '@/lib/security';
import type { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (credentials, req) => {
        let email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        email = email.toLowerCase().trim();
        const headers = (req as { headers?: Record<string, string | string[] | undefined> })?.headers;
        const forwarded = headers?.['x-forwarded-for'];
        const ip = Array.isArray(forwarded)
          ? forwarded[0]
          : String(forwarded || headers?.['x-real-ip'] || 'unknown').split(',')[0].trim();
        const userAgent = String(headers?.['user-agent'] || 'unknown');

        if (isAccountLocked(email)) {
          logAudit('login_locked', email, ip, userAgent, 'failure', 'Account locked');
          return null;
        }

        const rateKey = `login:${ip}:${email}`;
        if (!checkRateLimit(rateKey, 8, 15 * 60 * 1000)) {
          logAudit('login_rate_limited', email, ip, userAgent, 'failure', 'Rate limit');
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          incrementRateLimitCounter(rateKey);
          incrementFailedAttempts(email);
          logAudit('login_failed', email, ip, userAgent, 'failure', 'User not found or no password');
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          incrementRateLimitCounter(rateKey);
          incrementFailedAttempts(email);
          logAudit('login_failed', email, ip, userAgent, 'failure', 'Invalid password');
          return null;
        }

        resetRateLimit(rateKey);
        resetFailedAttempts(email);
        logAudit('login_success', email, ip, userAgent, 'success', 'Credentials OK');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: any) {
      if (account?.provider !== 'google') return true;

      const normalizedEmail = String(user.email || '').toLowerCase().trim();
      if (!normalizedEmail) return false;

      let loginIntent: 'COMPANY' | 'PROFESSIONAL' = 'PROFESSIONAL';
      try {
        const cookieStore = await cookies();
        const intent = cookieStore.get('login_intent')?.value;
        if (intent === 'company') loginIntent = 'COMPANY';
        if (intent === 'professional') loginIntent = 'PROFESSIONAL';
      } catch {
        /* ignora se cookies indisponível */
      }

      try {
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name,
              image: user.image,
              role: loginIntent,
            },
          });
        } else if (user.name) {
          await prisma.user.update({
            where: { email: normalizedEmail },
            data: {
              name: user.name,
              image: user.image ?? existing.image,
            },
          });
        }
      } catch (error) {
        console.error('[auth] Falha ao sincronizar usuário Google:', error);
        return false;
      }

      return true;
    },

    async jwt({ token, user }: any) {
      if (user?.userType) {
        token.userType = user.userType;
      }
      if (user?.name) {
        token.name = user.name;
      }

      const DB_SYNC_MS = 5 * 60 * 1000;
      const now = Date.now();
      const lastSync = typeof token.lastDbSync === 'number' ? token.lastDbSync : 0;
      const needsDbSync = Boolean(user) || now - lastSync > DB_SYNC_MS;

      if (needsDbSync && token.email) {
        const normalizedEmail = token.email.toLowerCase().trim();
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true, name: true, role: true },
        });

        if (dbUser) {
          if (matchesCompanyTestBypass({ email: normalizedEmail, userName: dbUser.name })) {
            await ensureCompanyTestBypassReady(dbUser.id);
            token.userType = 'COMPANY';
          } else {
            token.userType = dbUser.role;
          }
          if (!user?.name) {
            token.name = dbUser.name;
          }
          token.isAdmin = isAdminUser(normalizedEmail, dbUser.role);
        }
        token.lastDbSync = now;
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.userType = token.userType;
        session.user.isAdmin = token.isAdmin === true;
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return baseUrl;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
  },

  useSecureCookies: process.env.NODE_ENV === 'production',

  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

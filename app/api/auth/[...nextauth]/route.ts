import NextAuth, { type NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { validateCredentials, findUserByGoogleId, createUser, updateLastLogin } from "@/lib/users";
import { 
  isAccountLocked, 
  incrementFailedAttempts, 
  resetFailedAttempts,
  recordLogin,
  detectAnomalousLogin,
  logAudit,
  isIPBlocked
} from "@/lib/security";
import type { JWT } from "next-auth/jwt";

const { NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

// Log de verificação de variáveis
if (typeof window === 'undefined') { // Apenas no servidor
  console.log('🔍 [NextAuth Debug]');
  console.log('✅ NEXTAUTH_SECRET:', NEXTAUTH_SECRET ? 'Configurada' : '❌ NÃO configurada');
  console.log('✅ GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Configurada' : '❌ NÃO configurada');
  console.log('✅ GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Configurada' : '❌ NÃO configurada');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const email = credentials.email;
        
        // Verificar se conta está bloqueada
        if (isAccountLocked(email)) {
          throw new Error("Conta bloqueada. Tente novamente em 15 minutos.");
        }

        const user = validateCredentials(email, credentials.password);
        
        if (!user) {
          // Registrar tentativa falhada
          incrementFailedAttempts(email);
          throw new Error("Email ou senha inválidos");
        }

        // Reset tentativas falhadas após sucesso
        resetFailedAttempts(email);
        
        // Registrar login
        recordLogin(email, 'unknown', navigator.userAgent || 'unknown');

        updateLastLogin(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.nome || user.email,
          image: null,
          userType: user.userType,
        };
      },
    }),
    ...(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
        // Adicionar debugging
        httpOptions: {
          timeout: 10000,
        },
      }),
    ] : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const existingUser = findUserByGoogleId(account.providerAccountId);
        
        if (existingUser) {
          updateLastLogin(existingUser.id);
          return true;
        }

        // Criar novo usuário Google
        try {
          const email = user.email || profile?.email || "";
          if (!email) return false;
          
          createUser(
            email,
            null,
            "professional",
            account.providerAccountId,
            email
          );
          return true;
        } catch {
          return false;
        }
      }

      return true;
    },
    async redirect({ baseUrl, url }) {
      // Se tem URL relativa, redireciona para ela
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Se tem URL de mesmo host, redireciona
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.userType = user.userType || "professional";
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user as any).userType = token.userType as string;
      }
      return session;
    },
  },
  secret: NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

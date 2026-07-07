import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security.server";
import { isAdminUser } from "@/lib/admin-auth";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        let email = credentials?.email;
        const password = credentials?.password;
        if (!email || !password) return null;

        // Normalizar email
        email = email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

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
      if (account?.provider === "google") {
        const normalizedEmail = user.email!.toLowerCase().trim();
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        let loginIntent: "COMPANY" | "PROFESSIONAL" = "PROFESSIONAL";
        try {
          const cookieStore = await cookies();
          const intent = cookieStore.get("login_intent")?.value;
          if (intent === "company") loginIntent = "COMPANY";
          if (intent === "professional") loginIntent = "PROFESSIONAL";
        } catch {
          /* ignora se cookies indisponível */
        }

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

      if (token.email) {
        const normalizedEmail = token.email.toLowerCase().trim();
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (dbUser) {
          token.userType = dbUser.role;
          if (!user?.name) {
            token.name = dbUser.name;
          }
          token.isAdmin = isAdminUser(normalizedEmail, dbUser.role);
        }
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

        if (token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: String(token.email).toLowerCase().trim() },
          });
          if (dbUser?.name) {
            session.user.name = dbUser.name;
          } else if (token.name) {
            session.user.name = token.name as string;
          }
        }
      }
      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

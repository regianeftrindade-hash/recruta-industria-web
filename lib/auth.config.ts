import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
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
        // Normalizar email do Google
        const normalizedEmail = user.email!.toLowerCase().trim();
        const existing = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!existing) {
          await prisma.user.create({
            data: {
              email: normalizedEmail,
              name: user.name,
              image: user.image,
              role: "PROFESSIONAL",
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

      if (token.email) {
        const normalizedEmail = token.email.toLowerCase().trim();
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (dbUser) {
          token.userType = dbUser.role;
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

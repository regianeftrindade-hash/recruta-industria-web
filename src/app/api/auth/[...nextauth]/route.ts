import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/security";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("⚠️ Google OAuth not fully configured. Credentials provider enabled.");
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = verifyPassword(credentials.password, user.id);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google") {
        // Store Google account info
        const existingUser = await prisma.user.findUnique({
          where: { email: user?.email || "" },
        });

        if (!existingUser && user?.email) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: "PROFESSIONAL", // Default role for Google sign-ups
            },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        // Update last login
        await prisma.user.update({
          where: { email: user.email },
          data: { updatedAt: new Date() },
        });
      }
    },
  },
});

export { handler as GET, handler as POST };

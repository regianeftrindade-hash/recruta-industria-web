import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth.config";

export async function resolveAuthEmail(
  request: NextRequest
): Promise<{ email: string; name?: string } | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token?.email) {
    return {
      email: String(token.email).toLowerCase().trim(),
      name: token.name ? String(token.name) : undefined,
    };
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    return {
      email: session.user.email.toLowerCase().trim(),
      name: session.user.name ?? undefined,
    };
  }

  return null;
}

import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth.config";
import { syncNextAuthUrlFromRequest } from "@/lib/auth/sync-nextauth-url";

const nextAuthHandler = NextAuth(authOptions);

async function handler(
  req: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  syncNextAuthUrlFromRequest(req);
  return nextAuthHandler(req, context);
}

export { handler as GET, handler as POST };

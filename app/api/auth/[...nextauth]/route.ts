import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { ensureProductionNextAuthUrl } from "@/lib/auth/sync-nextauth-url";

ensureProductionNextAuthUrl();

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

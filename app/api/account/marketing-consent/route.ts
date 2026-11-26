import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/db";
import {
  persistMarketingConsentForUser,
  readMarketingConsentForUser,
} from "@/lib/privacy/record-marketing-consent";
import { normalizeMarketingConsentFlag } from "@/lib/privacy/marketing-consent";

/**
 * GET/POST — estado e data do consentimento de marketing da conta.
 * Opcional; não bloqueia uso da plataforma. Pode ser retirado a qualquer momento.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
  const state = await readMarketingConsentForUser(user.id, user.email);
  return NextResponse.json({ success: true, ...state });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const granted = normalizeMarketingConsentFlag(body.granted ?? body.marketingConsent);
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  const state = await persistMarketingConsentForUser({
    userId: user.id,
    email: user.email,
    granted,
    ip,
    userAgent,
  });

  return NextResponse.json({ success: true, ...state });
}

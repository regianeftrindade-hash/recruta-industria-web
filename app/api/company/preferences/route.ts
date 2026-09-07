import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  getCompanyAnonymousMode,
  setCompanyAnonymousMode,
} from "@/lib/company/company-preferences";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  const user = await prisma.user.findUnique({ where: { email: auth.email } });
  if (!user || user.role !== "COMPANY") return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }
    const anonymousMode = await getCompanyAnonymousMode(user.id);
    return NextResponse.json({ anonymousMode });
  } catch (error) {
    console.error("Erro ao carregar preferências da empresa:", error);
    return NextResponse.json({ error: "Erro ao carregar preferências" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user) {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }
    const body = await request.json();
    const anonymousMode = body?.anonymousMode === true;
    await setCompanyAnonymousMode(user.id, anonymousMode);
    return NextResponse.json({ success: true, anonymousMode });
  } catch (error) {
    console.error("Erro ao salvar preferências da empresa:", error);
    return NextResponse.json({ error: "Erro ao salvar preferências" }, { status: 500 });
  }
}

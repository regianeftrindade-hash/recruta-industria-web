import { NextRequest, NextResponse } from "next/server";
import { acceptTeamInvite, getInviteByToken } from "@/lib/company/company-team";

export async function GET(request: NextRequest) {
  try {
    const token = String(request.nextUrl.searchParams.get("token") || "").trim();
    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }
    const found = await getInviteByToken(token);
    if (!found) {
      return NextResponse.json({ error: "Convite inválido ou expirado" }, { status: 404 });
    }
    return NextResponse.json({
      email: found.invite.invitedEmail,
      role: found.invite.role,
      companyName: found.companyName,
    });
  } catch (error) {
    console.error("Erro ao validar convite:", error);
    return NextResponse.json({ error: "Erro ao validar convite" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body?.token || "").trim();
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");

    if (!token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const result = await acceptTeamInvite({ token, name, password });
    return NextResponse.json({
      success: true,
      email: result.email,
      message:
        "Conta criada. Entre em /login/empresa com este e-mail e senha — o sistema libera o painel da empresa.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const map: Record<string, string> = {
      INVITE_NOT_FOUND: "Convite inválido ou já utilizado.",
      PASSWORD_WEAK: "A senha deve ter pelo menos 6 caracteres.",
      EMAIL_IS_PROFESSIONAL: "Este e-mail já está cadastrado como profissional.",
      EMAIL_HAS_OWN_COMPANY: "Este e-mail já possui uma empresa própria.",
    };
    if (map[msg]) {
      return NextResponse.json({ error: map[msg] }, { status: 400 });
    }
    console.error("Erro ao aceitar convite:", error);
    return NextResponse.json({ error: "Erro ao aceitar convite" }, { status: 500 });
  }
}

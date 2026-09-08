import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/api-auth";
import {
  COMPANY_EXTRA_SEAT,
  COMPANY_EXTRA_SEAT_PACKAGES,
  getEffectiveMaxUsers,
} from "@/lib/company/company-extra-seats";
import {
  countTeamSeats,
  inviteTeamMember,
  listTeamMembers,
  replaceTeamMember,
  resolveCompanyActor,
  revokeTeamMember,
  type TeamMemberRole,
} from "@/lib/company/company-team";
import { mapTeamInviteError, mapTeamRevokeError } from "@/lib/company/company-team-errors";

async function getCompanyUser(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) return null;
  return prisma.user.findUnique({
    where: { email: auth.email },
    include: { company: true },
  });
}

/** Lista a equipe RH da assinatura. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const actor = await resolveCompanyActor(user.id);
    if (!actor) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const seats = await getEffectiveMaxUsers(actor.ownerUserId);
    const members = await listTeamMembers(actor.ownerUserId);
    const seatsUsed = await countTeamSeats(actor.ownerUserId);

    return NextResponse.json({
      members,
      seatsUsed,
      includedSeats: seats.includedSeats,
      extraSeats: seats.extraSeats,
      maxUsers: seats.maxUsers,
      seatsRemaining: Math.max(0, seats.maxUsers - seatsUsed),
      isOwner: actor.isOwner,
      teamRole: actor.teamRole,
      planTier: seats.planTier,
      extraSeatPrice: {
        centavos: COMPANY_EXTRA_SEAT.priceCentavos,
        label: COMPANY_EXTRA_SEAT.priceLabel,
        period: COMPANY_EXTRA_SEAT.period,
      },
      extraSeatPackages: COMPANY_EXTRA_SEAT_PACKAGES.map((p) => ({
        id: p.id,
        quantity: p.quantity,
        priceCentavos: p.priceCentavos,
        priceLabel: p.priceLabel,
        title: p.title,
        emoji: p.emoji,
        period: "/mês",
      })),
    });
  } catch (error) {
    console.error("Erro ao listar equipe:", error);
    return NextResponse.json({ error: "Erro ao listar equipe" }, { status: 500 });
  }
}

/** Convida ou substitui um usuário RH na mesma assinatura. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim();
    const role = String(body?.role || "RH").toUpperCase() as TeamMemberRole;
    const replaceMemberId = String(body?.replaceMemberId || "").trim();

    const member = replaceMemberId
      ? await replaceTeamMember({
          ownerUserId: user.id,
          memberId: replaceMemberId,
          email,
          role,
        })
      : await inviteTeamMember({
          ownerUserId: user.id,
          email,
          role,
        });

    const origin = request.nextUrl.origin;
    const inviteUrl = member.inviteToken
      ? `${origin}/company/convite?token=${member.inviteToken}`
      : null;

    return NextResponse.json({
      success: true,
      member,
      inviteUrl,
      replaced: Boolean(replaceMemberId),
      message: replaceMemberId
        ? "Usuário substituído. Envie o novo link de convite."
        : "Convite criado. Envie o link para a pessoa criar login e senha próprios na mesma assinatura.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const mapped = mapTeamInviteError(msg);
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    console.error("Erro ao convidar membro:", error);
    return NextResponse.json({ error: "Erro ao convidar membro" }, { status: 500 });
  }
}

/** Remove / revoga um membro. */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCompanyUser(request);
    if (!user || user.role !== "COMPANY") {
      return NextResponse.json({ error: "Acesso restrito a empresas" }, { status: 403 });
    }

    const memberId =
      request.nextUrl.searchParams.get("memberId") ||
      String((await request.json().catch(() => ({})))?.memberId || "");

    if (!memberId) {
      return NextResponse.json({ error: "Informe memberId" }, { status: 400 });
    }

    await revokeTeamMember({ ownerUserId: user.id, memberId });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    const mapped = mapTeamRevokeError(msg);
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }
    console.error("Erro ao remover membro:", error);
    return NextResponse.json({ error: "Erro ao remover membro" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { resolveCompanyActor } from "@/lib/company/company-team";

export async function resolveCompanyPublisher(request: NextRequest) {
  const auth = await resolveAuthEmail(request);
  if (!auth) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    select: { id: true },
  });
  if (!user) {
    return {
      error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
    };
  }

  const actor = await resolveCompanyActor(user.id);
  if (!actor) {
    return {
      error: NextResponse.json({ error: "Acesso restrito à empresa." }, { status: 403 }),
    };
  }

  const company = await prisma.company.findUnique({
    where: { userId: actor.ownerUserId },
    select: { name: true },
  });

  return {
    userId: user.id,
    ownerUserId: actor.ownerUserId,
    companyName: company?.name ?? "",
  };
}

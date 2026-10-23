import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db";
import { isProfessionalAccount } from "@/lib/jobs/job-posting";

export type CurrentProfessional = {
  id: string;
  email: string;
  name: string | null;
  profileId: string | null;
};

export async function requireCurrentProfessional(
  request: NextRequest,
): Promise<{ ok: true; user: CurrentProfessional } | { ok: false; response: NextResponse }> {
  const auth = await resolveAuthEmail(request);
  if (!auth?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Entre com uma conta de profissional." }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: auth.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      professional: { select: { id: true } },
      company: { select: { id: true } },
      profile: { select: { id: true } },
    },
  });

  if (!user || !isProfessionalAccount({
    role: user.role,
    hasProfessional: Boolean(user.professional),
    hasCompany: Boolean(user.company),
  })) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Esta área é da conta de profissional." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profileId: user.profile?.id ?? null,
    },
  };
}

import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db";
import { isProfessionalAccount } from "@/lib/jobs/job-posting";
import { loadOwnedResume } from "@/lib/jobs/job-application-mail";
import { jsonError } from "@/lib/jobs/job-api";

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveAuthEmail(request);
    if (!auth?.email) {
      return NextResponse.json({ error: "Entre com uma conta de profissional." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.email },
      select: {
        id: true,
        email: true,
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
      return NextResponse.json({ error: "A candidatura é feita com uma conta de profissional." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path.trim() : "";
    await loadOwnedResume(user.email, path);

    if (user.profile) {
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { curricoURL: path },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: user.id,
          title: "Profissional",
          location: "Não informado",
          email: user.email,
          curricoURL: path,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Não foi possível anexar o currículo.");
  }
}

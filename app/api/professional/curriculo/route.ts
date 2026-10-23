import { NextRequest, NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db";
import { draftFromProfile } from "@/lib/curriculum/resume-from-profile";
import { isProfessionalAccount } from "@/lib/jobs/job-posting";
import { loadOwnedResume } from "@/lib/jobs/job-application-mail";
import { jsonError } from "@/lib/jobs/job-api";
import { resumeFormatFromName, savedResumeFileName, savedResumeLabel } from "@/lib/jobs/resume-pdf";
import { requireCurrentProfessional } from "@/lib/professional/current-professional";
import { extractStoragePath } from "@/lib/storage/private-uploads";

function storedResumePath(raw: string | null | undefined): string {
  const value = raw?.trim() || "";
  if (!value) return "";
  return value.includes("://") ? extractStoragePath(value) || "" : value;
}

export async function GET(request: NextRequest) {
  const auth = await requireCurrentProfessional(request);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      name: true,
      email: true,
      profile: {
        select: {
          curricoURL: true,
          updatedAt: true,
          cidade: true,
          estado: true,
          location: true,
          phone: true,
          whatsapp: true,
          email: true,
          bio: true,
          mensagemEmpresas: true,
          cargoDesejado: true,
          title: true,
          escolaridade: true,
          cursosCertificacoes: true,
          skills: true,
          experienciasJSON: true,
          formDataJSON: true,
        },
      },
    },
  });

  const path = storedResumePath(user?.profile?.curricoURL);
  const label = savedResumeLabel(path, auth.user.email);
  let valid = false;
  if (label) {
    try {
      await loadOwnedResume(auth.user.email, path);
      valid = true;
    } catch {
      valid = false;
    }
  }

  return NextResponse.json({
    ok: true,
    hasResume: Boolean(label),
    valid,
    format: resumeFormatFromName(path),
    fileName: savedResumeFileName(path, auth.user.email),
    updatedAt: user?.profile?.updatedAt ? user.profile.updatedAt.toISOString() : null,
    availableForPremium: valid,
    draft: draftFromProfile({
      name: user?.name,
      email: user?.email,
      profile: user?.profile,
    }),
  });
}

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

    return NextResponse.json({
      ok: true,
      saved: true,
      format: resumeFormatFromName(path),
      fileName: savedResumeFileName(path, user.email),
    });
  } catch (error) {
    return jsonError(error, "Não foi possível anexar o currículo.");
  }
}

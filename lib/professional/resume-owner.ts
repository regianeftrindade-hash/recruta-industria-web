import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveAuthEmail } from "@/lib/auth/api-auth";
import { prisma } from "@/lib/db";
import { isProfessionalAccount } from "@/lib/jobs/job-posting";
import type { ResumeSource } from "@/lib/professional/resume-document";

const profileSelect = {
  id: true,
  curricoURL: true,
  phone: true,
  email: true,
  cidade: true,
  estado: true,
  location: true,
  cargoDesejado: true,
  title: true,
  mensagemEmpresas: true,
  bio: true,
  fullDescription: true,
  experienciasJSON: true,
  escolaridade: true,
  cursosCertificacoes: true,
  skills: true,
  turnoDisponivel: true,
  disponibilidadeInicio: true,
  areaInteresse: true,
  tempoExperiencia: true,
} as const;

export type ResumeActor = {
  userId: string;
  email: string;
  profileId: string | null;
  curricoURL: string | null;
  source: ResumeSource;
};

export async function loadResumeActor(
  request: NextRequest,
): Promise<{ actor: ResumeActor } | { response: NextResponse }> {
  const auth = await resolveAuthEmail(request);
  if (!auth?.email) {
    return {
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
      profile: { select: profileSelect },
    },
  });

  if (!user || !isProfessionalAccount({
    role: user.role,
    hasProfessional: Boolean(user.professional),
    hasCompany: Boolean(user.company),
  })) {
    return {
      response: NextResponse.json(
        { error: "O currículo fica na conta de profissional." },
        { status: 403 },
      ),
    };
  }

  const profile = user.profile;
  const source: ResumeSource = {
    name: user.name,
    email: profile?.email || user.email,
    phone: profile?.phone,
    city: profile?.cidade,
    state: profile?.estado,
    location: profile?.location,
    desiredRole: profile?.cargoDesejado,
    title: profile?.title,
    presentation: profile?.mensagemEmpresas,
    bio: profile?.bio,
    fullDescription: profile?.fullDescription,
    experiencesJson: profile?.experienciasJSON,
    education: profile?.escolaridade,
    coursesJson: profile?.cursosCertificacoes,
    skillsJson: profile?.skills,
    shift: profile?.turnoDisponivel,
    availability: profile?.disponibilidadeInicio,
    area: profile?.areaInteresse,
    experienceTime: profile?.tempoExperiencia,
  };

  return {
    actor: {
      userId: user.id,
      email: user.email,
      profileId: profile?.id ?? null,
      curricoURL: profile?.curricoURL ?? null,
      source,
    },
  };
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankCompatibleJobs, type JobMatchProfile } from "@/lib/jobs/job-match";
import { parseJobSearch } from "@/lib/jobs/job-search";
import { searchPublicJobs } from "@/lib/jobs/job-posting-db";
import { jsonError } from "@/lib/jobs/job-api";
import { requireCurrentProfessional } from "@/lib/professional/current-professional";
import { getProfessionalPlanContext } from "@/lib/professional/professional-plan";

function textList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (typeof item === "string") return item.trim() ? [item.trim()] : [];
      if (item && typeof item === "object") {
        const row = item as { cargo?: unknown; nome?: unknown };
        const text = String(row.cargo || row.nome || "").trim();
        return text ? [text] : [];
      }
      return [];
    });
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCurrentProfessional(request);
    if (!auth.ok) return auth.response;

    const plan = await getProfessionalPlanContext(auth.user.id);
    if (!plan.isPremium) {
      return NextResponse.json(
        {
          error: "Vagas compatíveis com você estão disponíveis no plano Premium.",
          premiumRequired: true,
          jobs: [],
          total: 0,
        },
        { status: 403 },
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: auth.user.id },
      select: {
        cargoDesejado: true,
        title: true,
        cidade: true,
        estado: true,
        skills: true,
        experienciasJSON: true,
      },
    });

    const signals: JobMatchProfile = {
      cargos: [profile?.cargoDesejado || "", profile?.title || "", ...textList(profile?.experienciasJSON)].filter(Boolean),
      habilidades: textList(profile?.skills),
      cidade: profile?.cidade || "",
      estado: profile?.estado || "",
    };
    const jobs = await searchPublicJobs(parseJobSearch(request.nextUrl.searchParams));
    const compatible = rankCompatibleJobs(signals, jobs);
    return NextResponse.json({ jobs: compatible, total: compatible.length });
  } catch (error) {
    return jsonError(error, "Não foi possível comparar as vagas com o perfil.");
  }
}

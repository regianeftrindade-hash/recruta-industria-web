import { NextResponse } from "next/server";
import { parseJobSearch } from "@/lib/jobs/job-search";
import { countPublicJobs, searchPublicJobs } from "@/lib/jobs/job-posting-db";
import { bindJobInterfaceLocale } from "@/lib/jobs/job-locale";
import { jsonError } from "@/lib/jobs/job-api";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    await bindJobInterfaceLocale();
    const params = new URL(request.url).searchParams;
    const filters = parseJobSearch(params);
    const wantsPage =
      params.has("page") ||
      params.has("pagina") ||
      params.has("limit") ||
      params.has("pageSize");

    // Sem parâmetros de página: mantém contrato legado (lista completa) usado
    // pelo painel profissional. Com page/limit: resposta paginada leve.
    if (!wantsPage) {
      const jobs = await searchPublicJobs(filters);
      return NextResponse.json({ jobs, total: jobs.length });
    }

    const rawLimit = Number(params.get("limit") || params.get("pageSize") || DEFAULT_LIMIT);
    const limit = Number.isFinite(rawLimit)
      ? Math.max(1, Math.min(Math.floor(rawLimit), MAX_LIMIT))
      : DEFAULT_LIMIT;
    const rawPage = Number(params.get("page") || params.get("pagina") || 1);
    const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;

    const total = await countPublicJobs(filters);
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
    const currentPage = total === 0 ? 1 : Math.min(page, totalPages);
    const jobs = await searchPublicJobs(filters, {
      skip: (currentPage - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      jobs,
      total,
      page: currentPage,
      limit,
      totalPages: total === 0 ? 0 : totalPages,
    });
  } catch (error) {
    return jsonError(error, "Não foi possível carregar as vagas.");
  }
}

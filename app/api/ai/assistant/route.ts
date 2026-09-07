import { NextResponse } from "next/server";

/**
 * Chat genérico descontinuado — use rotas específicas.
 * Ex.: POST /api/ai/professional/improve-presentation
 */
export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      available: false,
      error:
        "O chat genérico de IA foi descontinuado. Use as rotas específicas (ex.: melhorar apresentação).",
      code: "AI_USE_SPECIFIC_ROUTE",
      routes: {
        improvePresentation: "/api/ai/professional/improve-presentation",
        summarizeProfessional: "/api/ai/company/summarize-professional",
        compareProfessionals: "/api/ai/company/compare-professionals",
        interviewQuestions: "/api/ai/company/interview-questions",
        searchToFilters: "/api/ai/company/search-to-filters",
        usage: "/api/ai/usage",
      },
    },
    { status: 410 },
  );
}

/**
 * Recursos de IA — rotas específicas (não chat genérico).
 * Capacidade ≠ plano: plano da empresa = Company.planTier existente.
 */

export const AI_RESOURCES = [
  "improve_presentation",
  "improve_experience",
  "explain_incomplete_fields",
  "summarize_professional",
  "compare_professionals",
  "interview_questions",
  "search_to_filters",
] as const;

export type AiResource = (typeof AI_RESOURCES)[number];

export type AiResourceAudience = "PROFESSIONAL" | "COMPANY_PREMIUM";

export const AI_RESOURCE_META: Record<
  AiResource,
  {
    audience: AiResourceAudience;
    label: string;
    /** Implementado de verdade (senão stub) */
    implemented: boolean;
    maxInputChars: number;
  }
> = {
  improve_presentation: {
    audience: "PROFESSIONAL",
    label: "Melhorar apresentação profissional",
    implemented: true,
    maxInputChars: 2000,
  },
  improve_experience: {
    audience: "PROFESSIONAL",
    label: "Melhorar descrição de experiências",
    implemented: false,
    maxInputChars: 2000,
  },
  explain_incomplete_fields: {
    audience: "PROFESSIONAL",
    label: "Explicar campos incompletos",
    implemented: false,
    maxInputChars: 1500,
  },
  summarize_professional: {
    audience: "COMPANY_PREMIUM",
    label: "Resumir perfil profissional",
    implemented: false,
    maxInputChars: 4000,
  },
  compare_professionals: {
    audience: "COMPANY_PREMIUM",
    label: "Comparar profissionais",
    implemented: false,
    maxInputChars: 8000,
  },
  interview_questions: {
    audience: "COMPANY_PREMIUM",
    label: "Perguntas de entrevista",
    implemented: false,
    maxInputChars: 3000,
  },
  search_to_filters: {
    audience: "COMPANY_PREMIUM",
    label: "Busca → filtros",
    implemented: false,
    maxInputChars: 1000,
  },
};

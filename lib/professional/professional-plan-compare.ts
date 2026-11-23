import {
  getProfessionalPlanDefinition,
  type ProfessionalPlanDefinition,
} from "@/lib/professional/professional-premium-plans";

/** Recursos já liberados no plano gratuito, além da lista comercial do plano. */
const TAMBEM_NO_GRATUITO = [
  "Busca de vagas",
  "Candidatura manual",
  "Currículo no perfil",
] as const;

/** Recurso já travado no produto para quem não é Premium. */
const SO_NO_PREMIUM = ["Vagas compatíveis com o seu perfil"] as const;

const TUDO_DO_GRATUITO = "Todas as funcionalidades do plano gratuito";

export interface ProfessionalPlanCompareRow {
  item: string;
  free: boolean;
  premium: boolean;
}

export interface ProfessionalPlanCompare {
  free: ProfessionalPlanDefinition;
  premium: ProfessionalPlanDefinition;
  rows: ProfessionalPlanCompareRow[];
}

export function professionalPlanCompare(): ProfessionalPlanCompare {
  const free = getProfessionalPlanDefinition("FREE");
  const premium = getProfessionalPlanDefinition("PREMIUM");
  const shared = [...free.inclui, ...TAMBEM_NO_GRATUITO];
  const onlyPremium = [
    ...premium.inclui.filter((item) => item !== TUDO_DO_GRATUITO && !free.inclui.includes(item)),
    ...SO_NO_PREMIUM,
  ];

  return {
    free,
    premium,
    rows: [
      ...shared.map((item) => ({ item, free: true, premium: true })),
      ...onlyPremium.map((item) => ({ item, free: false, premium: true })),
    ],
  };
}

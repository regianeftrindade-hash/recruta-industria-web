export type ProfessionalPlanTier = 'FREE' | 'PREMIUM';

export interface ProfessionalPlanDefinition {
  id: ProfessionalPlanTier;
  emoji: string;
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  inclui: string[];
  precoCentavos: number;
}

export const PROFESSIONAL_PLAN_TIERS: ProfessionalPlanDefinition[] = [
  {
    id: 'FREE',
    emoji: '👤',
    nome: 'Gratuito',
    preco: 'R$ 0',
    periodo: '/mês',
    descricao: 'Painel básico com contagem de visualizações.',
    precoCentavos: 0,
    inclui: [
      'Perfil na vitrine para empresas',
      'Receber dicas e mensagens',
      'Contagem de visualizações da semana',
    ],
  },
  {
    id: 'PREMIUM',
    emoji: '👑',
    nome: 'Premium',
    preco: 'R$ 19,90',
    periodo: '/mês',
    descricao: 'Mais visibilidade e relatórios completos.',
    precoCentavos: 1990,
    inclui: [
      'Nome das empresas que visualizaram seu perfil',
      'Perfil em destaque na vitrine das empresas',
      'Relatórios detalhados de atividade',
      'Notificações por e-mail (visualização, dica, mensagem e favorito)',
    ],
  },
];

export function getProfessionalPlanDefinition(tier: ProfessionalPlanTier): ProfessionalPlanDefinition {
  return PROFESSIONAL_PLAN_TIERS.find((p) => p.id === tier) ?? PROFESSIONAL_PLAN_TIERS[0];
}

export function getPaidProfessionalPlanTiers(): ProfessionalPlanTier[] {
  return ['PREMIUM'];
}

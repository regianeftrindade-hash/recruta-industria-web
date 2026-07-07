export type CompanyPlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'EMPRESARIAL';

export interface CompanyPlanDefinition {
  id: CompanyPlanTier;
  emoji: string;
  nome: string;
  preco: string;
  periodo: string;
  descricao: string;
  inclui: string[];
  naoInclui?: string[];
  limites?: string[];
  precoCentavos: number;
}

export const COMPANY_PLAN_TIERS: CompanyPlanDefinition[] = [
  {
    id: 'FREE',
    emoji: '🏭',
    nome: 'FREE',
    preco: 'R$ 0',
    periodo: '/mês',
    descricao: 'Para conhecer a plataforma.',
    precoCentavos: 0,
    inclui: [
      'Pesquisar profissionais',
      'Ver perfil resumido (dados parciais)',
      'Filtros básicos: estado, cidade, área e cargo',
      'Índice de compatibilidade na busca',
      'Ver cidade, área, experiência e habilidades principais',
    ],
    naoInclui: [
      'Contatos e currículo completo',
      'Filtros avançados industriais',
      'Histórico de buscas',
      'Favoritos e dicas anônimas',
      'Liberação de contatos',
    ],
  },
  {
    id: 'BASIC',
    emoji: '🥉',
    nome: 'BASIC',
    preco: 'R$ 197',
    periodo: '/mês',
    descricao: 'Para pequenas empresas.',
    precoCentavos: 19700,
    inclui: [
      'Tudo do Free +',
      'Liberar contatos (telefone, e-mail, WhatsApp)',
      'Ver perfil completo após desbloqueio',
      'Filtros industriais avançados',
      'Favoritar até 100 profissionais',
      'Histórico de pesquisas',
      'Dicas anônimas para profissionais',
      'Dashboard de recrutamento',
    ],
    limites: [
      'Até 50 liberações de contato por mês',
    ],
  },
  {
    id: 'PREMIUM',
    emoji: '🥈',
    nome: 'PREMIUM',
    preco: 'R$ 397',
    periodo: '/mês',
    descricao: 'Para empresas que recrutam com frequência.',
    precoCentavos: 39700,
    inclui: [
      'Tudo do Basic +',
      'Liberações de contato ilimitadas',
      'Favoritos ilimitados',
      'Alertas de talentos compatíveis (painel)',
      'Exportação de perfil para impressão',
    ],
  },
  {
    id: 'EMPRESARIAL',
    emoji: '🥇',
    nome: 'EMPRESARIAL',
    preco: 'R$ 997',
    periodo: '/mês',
    descricao: 'Para empresas que organizam bancos de talentos.',
    precoCentavos: 99700,
    inclui: [
      'Tudo do Premium +',
      'Banco de talentos privado com listas personalizadas',
    ],
  },
];

export function getPlanDefinition(tier: string): CompanyPlanDefinition {
  return COMPANY_PLAN_TIERS.find((p) => p.id === tier) ?? COMPANY_PLAN_TIERS[0];
}

export function getPaidPlanTiers(): CompanyPlanTier[] {
  return ['BASIC', 'PREMIUM', 'EMPRESARIAL'];
}

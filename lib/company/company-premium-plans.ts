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

/**
 * Descrições comerciais dos planos empresa.
 */
export const COMPANY_PLAN_TIERS: CompanyPlanDefinition[] = [
  {
    id: 'FREE',
    emoji: '🥉',
    nome: 'FREE',
    preco: 'R$ 0',
    periodo: '/mês',
    descricao:
      'Ideal para conhecer a plataforma e explorar o banco de talentos. O plano Free permite que a empresa visualize o potencial da plataforma antes de investir em uma assinatura.',
    precoCentavos: 0,
    inclui: [
      'Pesquisa de profissionais da indústria',
      'Visualização resumida dos perfis',
      'Filtros básicos de busca',
      'Índice de compatibilidade com candidatos',
      'Visualização de área de atuação, cidade e experiência principal',
      '1 usuário (Administrador Principal)',
    ],
    naoInclui: [
      'Contatos dos candidatos',
      'Currículo completo',
      'Vídeo de apresentação',
      'Download de currículo',
      'Banco de talentos',
      'Favoritos',
      'Convites para entrevista',
      'Histórico de pesquisas',
      'Gestão de equipe RH',
    ],
  },
  {
    id: 'BASIC',
    emoji: '🥈',
    nome: 'BASIC',
    preco: 'R$ 249',
    periodo: '/mês',
    descricao:
      'Ideal para pequenas empresas e recrutamentos ocasionais. Tenha acesso completo aos perfis e encontre profissionais qualificados para suas vagas industriais.',
    precoCentavos: 24900,
    inclui: [
      'Tudo do Free',
      'Visualização completa do currículo',
      'Vídeo de apresentação do candidato',
      'Contatos dos profissionais',
      'Download de currículo',
      'Favoritos ilimitados',
      'Histórico de pesquisas',
      'Dashboard de recrutamento',
      'Acompanhamento de candidatos favoritos',
      'Histórico de disponibilidade e atualização do perfil',
      '1 usuário incluso',
    ],
    limites: [
      'Até 150 liberações de contato por mês',
      'Usuário adicional disponível mediante contratação',
    ],
  },
  {
    id: 'PREMIUM',
    emoji: '🥇',
    nome: 'PREMIUM',
    preco: 'R$ 499',
    periodo: '/mês',
    descricao:
      'Ideal para empresas que recrutam frequentemente e possuem mais de um recrutador. Projetado para RHs que realizam processos seletivos constantes e precisam trabalhar em equipe.',
    precoCentavos: 49900,
    inclui: [
      'Tudo do Basic',
      '2 usuários inclusos na mesma assinatura',
      'Liberações de contato ilimitadas',
      'Banco de talentos privado',
      'Pastas personalizadas para candidatos',
      'Alertas automáticos de profissionais compatíveis',
      'Exportação de perfis em PDF',
      'Histórico avançado de pesquisas',
      'Convites para entrevistas',
      'Registro de candidatos visualizados',
      'Dashboard completo de recrutamento',
      'Relatórios básicos de utilização',
    ],
    limites: [
      'Até 2 usuários inclusos',
      'Usuários adicionais mediante contratação',
    ],
  },
  {
    id: 'EMPRESARIAL',
    emoji: '👑',
    nome: 'EMPRESARIAL',
    preco: 'R$ 1.299',
    periodo: '/mês',
    descricao:
      'Ideal para indústrias com equipes de RH estruturadas e grande volume de recrutamento. Desenvolvido para empresas que recrutam constantemente, mantêm banco de talentos ativo e possuem múltiplos recrutadores.',
    precoCentavos: 129900,
    inclui: [
      'Tudo do Premium',
      '4 usuários inclusos na mesma assinatura',
      'Gestão completa da equipe de RH',
      'Administrador principal com controle de usuários',
      'Inclusão, remoção e substituição de recrutadores',
      'Banco de talentos avançado',
      'Pastas e listas personalizadas ilimitadas',
      'Relatórios avançados de recrutamento',
      'Histórico de ações dos usuários',
      'Estatísticas de utilização da equipe',
      'Painel completo de indicadores',
      'Atendimento prioritário',
      'Selo Empresa Verificada Recruta Indústria',
      'Prioridade em novos recursos e testes',
    ],
    limites: [
      'Até 4 usuários inclusos',
      'Usuários adicionais mediante contratação',
    ],
  },
];

export function getPlanDefinition(tier: string): CompanyPlanDefinition {
  return COMPANY_PLAN_TIERS.find((p) => p.id === tier) ?? COMPANY_PLAN_TIERS[0];
}

export function getPaidPlanTiers(): CompanyPlanTier[] {
  return ['BASIC', 'PREMIUM', 'EMPRESARIAL'];
}

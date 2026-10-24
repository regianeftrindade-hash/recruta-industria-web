export type CompanyPlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'EMPRESARIAL';

/** Benefício comercial dos planos pagos. O profissional entra pelo convite, sem plano próprio. */
export const VIDEO_INTERVIEW_INCLUDED =
  'Entrevistas individuais por chamada de vídeo na plataforma';

/** Exclusão do plano Free — a empresa não inicia a chamada. */
export const VIDEO_INTERVIEW_EXCLUDED =
  'Entrevistas por chamada de vídeo na plataforma';

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
      'Ideal para conhecer a plataforma e ver a vitrine de profissionais. O plano Free permite que a empresa visualize o potencial da plataforma antes de investir em uma assinatura.',
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
      VIDEO_INTERVIEW_EXCLUDED,
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
      'Dashboard de recrutamento',
      'Acompanhamento de contatado, entrevistado, em teste e contratado',
      'Disponibilidade para contratação e data de atualização do perfil',
      'Convites para entrevista',
      'Marcação de perfis já visualizados',
      '1 usuário incluso',
      VIDEO_INTERVIEW_INCLUDED,
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
      'Alertas de profissionais compatíveis no painel',
      'Exportação do perfil para impressão',
      VIDEO_INTERVIEW_INCLUDED,
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
      'Gestão dos usuários do RH na mesma assinatura',
      'Administrador principal com controle de usuários',
      'Inclusão, remoção e substituição de recrutadores',
      VIDEO_INTERVIEW_INCLUDED,
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

/** Três destaques atuais do card, mais a entrevista por vídeo quando o plano a inclui. */
export function destaquesComerciaisDoPlano(plano: CompanyPlanDefinition): string[] {
  const base = plano.inclui.filter((item) => !item.startsWith('Tudo do ')).slice(0, 3);
  if (!plano.inclui.includes(VIDEO_INTERVIEW_INCLUDED) || base.includes(VIDEO_INTERVIEW_INCLUDED)) {
    return base;
  }
  return [...base, VIDEO_INTERVIEW_INCLUDED];
}

export const VIDEO_INTERVIEW_PAID_ONLY =
  "Entrevista por vídeo disponível nos planos pagos.";

export function getPaidPlanTiers(): CompanyPlanTier[] {
  return COMPANY_PLAN_TIERS.filter((p) => p.precoCentavos > 0).map((p) => p.id);
}

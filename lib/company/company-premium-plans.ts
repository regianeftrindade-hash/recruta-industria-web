export type CompanyPlanTier = 'FREE' | 'BASIC' | 'PREMIUM' | 'EMPRESARIAL';

export interface CompanyPlanSection {
  titulo: string;
  itens: string[];
}

export interface CompanyPlanDefinition {
  id: CompanyPlanTier;
  emoji: string;
  nome: string;
  subtitulo: string;
  preco: string;
  periodo: string;
  /** Preço cheio mensal. O lançamento só vale nos 3 primeiros meses, no pagamento mensal. */
  precoLancamento?: string;
  precoLancamentoCentavos?: number;
  descricao: string;
  secoes: CompanyPlanSection[];
  inclui: string[];
  naoInclui?: string[];
  limites?: string[];
  precoCentavos: number;
}

const SUGESTAO_VAGAS =
  'Sugestão comercial, ainda sem trava no sistema';

/**
 * Textos comerciais dos planos empresa.
 * Só entra o que o painel já faz. Limite de vagas é sugestão, não regra do sistema.
 */
export const COMPANY_PLAN_TIERS: CompanyPlanDefinition[] = [
  {
    id: 'FREE',
    emoji: '🥉',
    nome: 'FREE',
    subtitulo: 'Gratuito',
    preco: 'R$ 0',
    periodo: '/mês',
    descricao:
      'Ideal para empresas que querem conhecer a plataforma, pesquisar profissionais e experimentar o recrutamento industrial.',
    precoCentavos: 0,
    secoes: [
      {
        titulo: 'Pesquisa de profissionais',
        itens: [
          'Pesquisa de profissionais da indústria.',
          'Visualização resumida dos perfis.',
          'Filtros básicos de busca.',
          'Índice de compatibilidade com candidatos.',
          'Visualização de área de atuação, cidade e experiência principal.',
        ],
      },
      {
        titulo: 'Publicação de vagas',
        itens: [
          `${SUGESTAO_VAGAS}: uma vaga ativa por vez.`,
          'Página pública da vaga com link para compartilhamento.',
          'Candidatura pela plataforma, pelo site da empresa, por e-mail ou por WhatsApp, conforme o anúncio.',
        ],
      },
      {
        titulo: 'Limitações',
        itens: [
          'Sem acesso aos contatos dos candidatos.',
          'Sem currículo completo ou download.',
          'Sem vídeo de apresentação.',
          'Sem favoritos ou banco de talentos privado.',
          'Sem convites para entrevistas.',
          'Um usuário administrador principal.',
        ],
      },
    ],
    inclui: [
      'Pesquisa de profissionais da indústria',
      'Visualização resumida dos perfis',
      'Filtros básicos de busca',
      'Índice de compatibilidade com candidatos',
      'Visualização de área de atuação, cidade e experiência principal',
      'Página pública da vaga com link para compartilhamento',
      '1 usuário (Administrador Principal)',
    ],
    naoInclui: [
      'Contatos dos candidatos',
      'Currículo completo ou download',
      'Vídeo de apresentação',
      'Favoritos ou banco de talentos',
      'Convites para entrevistas',
    ],
    limites: [`${SUGESTAO_VAGAS}: uma vaga ativa por vez.`],
  },
  {
    id: 'BASIC',
    emoji: '🥈',
    nome: 'BASIC',
    subtitulo: 'Para pequenas empresas',
    preco: 'R$ 249',
    periodo: '/mês',
    precoLancamento: 'R$ 199,20',
    precoLancamentoCentavos: 19920,
    descricao:
      'Ideal para empresas que contratam ocasionalmente e precisam acessar currículos completos.',
    precoCentavos: 24900,
    secoes: [
      {
        titulo: 'Tudo do Free, mais',
        itens: [
          'Visualização completa do currículo.',
          'Vídeo de apresentação do candidato.',
          'Acesso aos contatos dos profissionais.',
          'Download de currículos.',
          'Favoritos ilimitados.',
          'Histórico de pesquisas.',
          'Dashboard de recrutamento.',
          'Disponibilidade para contratação e data da última atualização do perfil.',
          'Caixa de contato com o e-mail da Recruta Indústria.',
          'Um usuário incluído.',
        ],
      },
      {
        titulo: 'Limite de contatos',
        itens: [
          'Até 150 liberações de contato por mês.',
          'Usuário adicional mediante contratação.',
        ],
      },
      {
        titulo: 'Publicação de vagas',
        itens: [
          'Publicação e compartilhamento de vagas.',
          'Página individual para cada vaga.',
          'Acompanhamento das candidaturas no destino configurado no anúncio.',
          `${SUGESTAO_VAGAS}: até 5 vagas ativas ao mesmo tempo.`,
        ],
      },
    ],
    inclui: [
      'Tudo do Free',
      'Visualização completa do currículo',
      'Vídeo de apresentação do candidato',
      'Acesso aos contatos dos profissionais',
      'Download de currículos',
      'Favoritos ilimitados',
      'Histórico de pesquisas',
      'Dashboard de recrutamento',
      'Disponibilidade para contratação e data da última atualização do perfil',
      'Caixa de contato com o e-mail da Recruta Indústria',
      'Um usuário incluído',
    ],
    limites: [
      'Até 150 liberações de contato por mês',
      'Usuário adicional mediante contratação',
      `${SUGESTAO_VAGAS}: até 5 vagas ativas ao mesmo tempo.`,
    ],
  },
  {
    id: 'PREMIUM',
    emoji: '🥇',
    nome: 'PREMIUM',
    subtitulo: 'Recrutamento frequente',
    preco: 'R$ 499',
    periodo: '/mês',
    precoLancamento: 'R$ 399,20',
    precoLancamentoCentavos: 39920,
    descricao:
      'Ideal para empresas com processos seletivos recorrentes e mais de um recrutador.',
    precoCentavos: 49900,
    secoes: [
      {
        titulo: 'Tudo do Basic, mais',
        itens: [
          'Dois usuários incluídos na mesma assinatura.',
          'Liberações de contato ilimitadas.',
          'Banco de talentos privado.',
          'Listas personalizadas para candidatos.',
          'Alertas automáticos de profissionais compatíveis.',
          'Exportação do perfil para impressão ou PDF.',
          'Convites para entrevistas.',
          'Chat e compartilhamento de perfil entre os usuários da assinatura.',
        ],
      },
      {
        titulo: 'Publicação de vagas',
        itens: [
          'Publicação e compartilhamento de vagas.',
          'Acompanhamento dos processos seletivos a partir dos convites enviados.',
          `${SUGESTAO_VAGAS}: até 15 vagas ativas ao mesmo tempo.`,
        ],
      },
    ],
    inclui: [
      'Tudo do Basic',
      'Dois usuários incluídos na mesma assinatura',
      'Liberações de contato ilimitadas',
      'Banco de talentos privado',
      'Listas personalizadas para candidatos',
      'Alertas automáticos de profissionais compatíveis',
      'Exportação do perfil para impressão ou PDF',
      'Convites para entrevistas',
      'Chat e compartilhamento de perfil entre os usuários da assinatura',
    ],
    limites: [
      'Até 2 usuários inclusos',
      'Usuários adicionais mediante contratação',
      `${SUGESTAO_VAGAS}: até 15 vagas ativas ao mesmo tempo.`,
    ],
  },
  {
    id: 'EMPRESARIAL',
    emoji: '👑',
    nome: 'EMPRESARIAL',
    subtitulo: 'Para equipes de RH',
    preco: 'R$ 1.299',
    periodo: '/mês',
    precoLancamento: 'R$ 1.039,20',
    precoLancamentoCentavos: 103920,
    descricao:
      'Ideal para indústrias com grande volume de contratações e equipes de RH estruturadas.',
    precoCentavos: 129900,
    secoes: [
      {
        titulo: 'Tudo do Premium, mais',
        itens: [
          'Quatro usuários incluídos na mesma assinatura.',
          'Administrador principal com controle de usuários.',
          'Inclusão, remoção e substituição de recrutadores.',
          'Atendimento prioritário da Recruta Indústria.',
        ],
      },
      {
        titulo: 'Publicação de vagas',
        itens: [
          'Publicação e compartilhamento de vagas.',
          'Gestão das vagas pela equipe da mesma assinatura.',
          'Acompanhamento das candidaturas no destino configurado em cada anúncio.',
          `${SUGESTAO_VAGAS}: até 40 vagas ativas ao mesmo tempo.`,
        ],
      },
    ],
    inclui: [
      'Tudo do Premium',
      'Quatro usuários incluídos na mesma assinatura',
      'Administrador principal com controle de usuários',
      'Inclusão, remoção e substituição de recrutadores',
      'Atendimento prioritário da Recruta Indústria',
    ],
    limites: [
      'Até 4 usuários inclusos',
      'Usuários adicionais mediante contratação',
      `${SUGESTAO_VAGAS}: até 40 vagas ativas ao mesmo tempo.`,
    ],
  },
];

export function getPlanDefinition(tier: string): CompanyPlanDefinition {
  return COMPANY_PLAN_TIERS.find((p) => p.id === tier) ?? COMPANY_PLAN_TIERS[0];
}

export function getPaidPlanTiers(): CompanyPlanTier[] {
  return COMPANY_PLAN_TIERS.filter((p) => p.precoCentavos > 0).map((p) => p.id);
}

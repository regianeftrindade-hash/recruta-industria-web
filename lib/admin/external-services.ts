export type ExternalServiceSlug = 'supabase' | 'vercel' | 'github' | 'google' | 'bancos';

export type ExternalService = {
  slug: ExternalServiceSlug;
  label: string;
  title: string;
  description: string;
  /** URL principal do console (pode ser sobrescrita por env). */
  url: string;
  /** Atalhos úteis do mesmo serviço. */
  links: Array<{ label: string; url: string }>;
  color: string;
};

function envUrl(key: string, fallback: string): string {
  const value = process.env[key]?.trim();
  return value || fallback;
}

export function getExternalServices(): ExternalService[] {
  const supabase = envUrl('ADMIN_URL_SUPABASE', 'https://supabase.com/dashboard');
  const vercel = envUrl('ADMIN_URL_VERCEL', 'https://vercel.com/dashboard');
  const github = envUrl('ADMIN_URL_GITHUB', 'https://github.com');
  const google = envUrl('ADMIN_URL_GOOGLE', 'https://console.cloud.google.com/');
  // Placeholder: PagBank por enquanto — trocar depois via ADMIN_URL_BANCOS
  const bancos = envUrl('ADMIN_URL_BANCOS', 'https://minhaconta.pagbank.com.br/');

  return [
    {
      slug: 'supabase',
      label: 'Supabase',
      title: 'Supabase',
      description: 'Banco, Auth, Storage e logs do projeto Recruta Indústria.',
      url: supabase,
      color: '#3ecf8e',
      links: [
        { label: 'Dashboard', url: supabase },
        { label: 'Table Editor', url: envUrl('ADMIN_URL_SUPABASE_TABLES', `${supabase.replace(/\/$/, '')}/editor`) },
        { label: 'SQL', url: envUrl('ADMIN_URL_SUPABASE_SQL', `${supabase.replace(/\/$/, '')}/sql`) },
        { label: 'Auth', url: envUrl('ADMIN_URL_SUPABASE_AUTH', `${supabase.replace(/\/$/, '')}/auth/users`) },
      ],
    },
    {
      slug: 'vercel',
      label: 'Vercel',
      title: 'Vercel',
      description: 'Deploy, domínios, variáveis de ambiente e logs de produção.',
      url: vercel,
      color: '#ffffff',
      links: [
        { label: 'Dashboard', url: vercel },
        { label: 'Deployments', url: envUrl('ADMIN_URL_VERCEL_DEPLOYMENTS', `${vercel.replace(/\/$/, '')}/deployments`) },
        { label: 'Settings', url: envUrl('ADMIN_URL_VERCEL_SETTINGS', `${vercel.replace(/\/$/, '')}/settings`) },
        { label: 'Logs', url: envUrl('ADMIN_URL_VERCEL_LOGS', `${vercel.replace(/\/$/, '')}/logs`) },
      ],
    },
    {
      slug: 'github',
      label: 'GitHub',
      title: 'GitHub',
      description: 'Código, pull requests, Actions e issues do repositório.',
      url: github,
      color: '#f0f6fc',
      links: [
        { label: 'Repositório', url: github },
        { label: 'Pull requests', url: envUrl('ADMIN_URL_GITHUB_PRS', `${github.replace(/\/$/, '')}/pulls`) },
        { label: 'Actions', url: envUrl('ADMIN_URL_GITHUB_ACTIONS', `${github.replace(/\/$/, '')}/actions`) },
        { label: 'Issues', url: envUrl('ADMIN_URL_GITHUB_ISSUES', `${github.replace(/\/$/, '')}/issues`) },
      ],
    },
    {
      slug: 'google',
      label: 'Google Console',
      title: 'Google Cloud Console',
      description: 'OAuth Google, APIs, credenciais e projeto Cloud.',
      url: google,
      color: '#8ab4f8',
      links: [
        { label: 'Cloud Console', url: google },
        { label: 'APIs e serviços', url: envUrl('ADMIN_URL_GOOGLE_APIS', 'https://console.cloud.google.com/apis') },
        { label: 'Credenciais', url: envUrl('ADMIN_URL_GOOGLE_CREDENTIALS', 'https://console.cloud.google.com/apis/credentials') },
        { label: 'OAuth consent', url: envUrl('ADMIN_URL_GOOGLE_OAUTH', 'https://console.cloud.google.com/apis/credentials/consent') },
      ],
    },
    {
      slug: 'bancos',
      label: 'Bancos',
      title: 'Bancos',
      description: 'Pagamentos e conciliação (placeholder PagBank — será trocado).',
      url: bancos,
      color: '#00a868',
      links: [
        { label: 'PagBank (temporário)', url: bancos },
        { label: 'Assinaturas', url: envUrl('ADMIN_URL_BANCOS_ASSINATURAS', 'https://minhaconta.pagbank.com.br/') },
        { label: 'Extrato', url: envUrl('ADMIN_URL_BANCOS_EXTRATO', 'https://minhaconta.pagbank.com.br/') },
      ],
    },
  ];
}

export function getExternalService(slug: string): ExternalService | null {
  return getExternalServices().find((service) => service.slug === slug) || null;
}

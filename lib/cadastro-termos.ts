export type CadastroTermoSlug =
  | 'autorizacao-dados'
  | 'declaracao-veracidade'
  | 'lgpd';

export type CadastroTermo = {
  slug: CadastroTermoSlug;
  titulo: string;
  paragrafos: string[];
};

export const CADASTRO_TERMOS: CadastroTermo[] = [
  {
    slug: 'autorizacao-dados',
    titulo: 'Termo de Autorização de Uso de Dados',
    paragrafos: [
      'Ao marcar este termo no cadastro do Recruta Indústria, você autoriza a plataforma a coletar, armazenar e utilizar os dados informados no seu perfil profissional para fins de cadastro, identificação, contato e apresentação do seu perfil a empresas cadastradas.',
      'Os dados poderão ser utilizados para: (i) viabilizar sua participação no processo de recrutamento; (ii) permitir que empresas visualizem informações compatíveis com o seu perfil e plano de acesso; (iii) enviar comunicações relacionadas ao uso da plataforma, quando aplicável.',
      'Você poderá solicitar atualização ou exclusão dos dados conforme a legislação vigente e as políticas da plataforma, observadas as obrigações legais de retenção.',
      'A autorização refere-se aos dados fornecidos voluntariamente por você no formulário de cadastro e em eventuais atualizações posteriores do perfil.',
    ],
  },
  {
    slug: 'declaracao-veracidade',
    titulo: 'Termo de Declaração de Veracidade',
    paragrafos: [
      'Ao aceitar este termo, você declara, sob sua responsabilidade, que todas as informações prestadas no cadastro profissional são verdadeiras, completas e atualizadas na medida do seu conhecimento.',
      'Você reconhece que informações falsas, incompletas ou enganosas podem prejudicar processos seletivos, gerar desclassificação de candidaturas e, quando cabível, responsabilização civil ou administrativa.',
      'Compromete-se a manter seus dados atualizados, especialmente contato, disponibilidade, formação, experiências e documentos anexados, sempre que houver alteração relevante.',
      'A plataforma poderá solicitar comprovação de informações ou documentos adicionais para validação de perfil, quando necessário.',
    ],
  },
  {
    slug: 'lgpd',
    titulo: 'Termo LGPD — Tratamento de Dados Pessoais',
    paragrafos: [
      'Este termo informa sobre o tratamento de dados pessoais realizado pelo Recruta Indústria em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais — LGPD).',
      'São tratados, conforme sua navegação e cadastro, dados como identificação, contato, dados profissionais, formação, experiência, documentos enviados por você e demais informações necessárias à operação da plataforma de recrutamento industrial.',
      'As bases legais do tratamento incluem execução de contrato ou procedimentos preliminares, legítimo interesse na operação da plataforma, cumprimento de obrigação legal e consentimento, quando aplicável.',
      'Você tem direito de confirmar a existência de tratamento, acessar, corrigir, anonimizar, bloquear ou eliminar dados desnecessários, solicitar portabilidade e obter informações sobre compartilhamento, nos termos da LGPD.',
      'O tratamento observa medidas de segurança compatíveis com a natureza dos dados. Dúvidas ou solicitações relacionadas à privacidade podem ser encaminhadas pelos canais de contato informados na plataforma.',
    ],
  },
];

export function getTermoBySlug(slug: string): CadastroTermo | undefined {
  return CADASTRO_TERMOS.find((t) => t.slug === slug);
}

export function hrefTermoCadastro(slug: CadastroTermoSlug): string {
  return `/termos/${slug}`;
}

import type { PublicTermDocument } from "@/lib/legal/public-terms";

/**
 * Termos de Uso — conteúdo inicial em pt-BR.
 * Não inclui CNPJ, endereço, representante legal, prazos contratuais
 * ou compromissos que ainda dependam de validação jurídica.
 */
export const usoPtBR: PublicTermDocument = {
  slug: "uso",
  titlePtBR: "Termos de Uso",
  paragraphsByLocale: {
    "pt-BR": [
      "Estes Termos de Uso descrevem, de forma geral, as condições para utilização da plataforma Recruta Indústria por profissionais e empresas. O uso da plataforma implica a leitura atenta deste documento e dos demais avisos jurídicos disponíveis em /termos.",
      "O Recruta Indústria é uma plataforma digital de recrutamento e conexão entre profissionais e empresas do setor industrial e afins, com operação voltada a usuários no Brasil e em outros países, conforme disponibilidade de funcionalidades, planos e requisitos de cadastro. O cadastro de profissionais é permitido apenas para maiores de 18 anos.",
      "Cadastro e contas. Para utilizar áreas autenticadas, é necessário criar uma conta de profissional ou de empresa, fornecendo informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade das credenciais de acesso e por atividades realizadas sob sua conta.",
      "Tipos de conta. Contas de profissional destinam-se à apresentação de perfil, candidaturas e comunicação com empresas. Contas de empresa destinam-se à publicação de vagas, busca de profissionais e gestão de processos seletivos, observadas as permissões do plano contratado. Contas administrativas são restritas a operadores autorizados da plataforma.",
      "Responsabilidades do usuário. Você compromete-se a utilizar a plataforma de forma lícita, respeitosa e compatível com a finalidade de recrutamento; a não publicar conteúdo ilegal, ofensivo, discriminatório ou enganoso; e a não tentar obter acesso não autorizado a dados, contas ou sistemas de terceiros ou da própria plataforma.",
      "Responsabilidades da plataforma. O Recruta Indústria disponibiliza ferramentas tecnológicas para facilitar o contato entre profissionais e empresas. A plataforma não garante contratação, resultado de processos seletivos, veracidade absoluta de todas as informações inseridas por terceiros, nem disponibilidade ininterrupta do serviço.",
      "Conteúdo e vagas. Profissionais e empresas são responsáveis pelo conteúdo que publicam (perfis, vagas, mensagens e anexos). A plataforma pode moderar, ocultar ou remover conteúdos que violem estes termos, a legislação aplicável ou políticas internas de segurança e boa-fé.",
      "Planos e pagamentos. Determinados recursos podem depender de planos pagos processados por prestadores de pagamento (por exemplo, no Brasil e em outros mercados). Condições comerciais, cobranças e cancelamentos seguem as informações exibidas no momento da contratação e as regras do meio de pagamento utilizado. Detalhes financeiros específicos constam nas telas de plano e checkout — não neste texto genérico.",
      "Operação internacional. Usuários fora do Brasil podem utilizar a plataforma conforme o suporte a país, idioma, documentos e meios de pagamento disponíveis. Requisitos documentais e de verificação podem variar por jurisdição.",
      "Propriedade intelectual. Marcas, layout, software e materiais da plataforma pertencem ao Recruta Indústria ou a licenciadores. É vedada a reprodução ou exploração comercial não autorizada.",
      "Suspensão e encerramento. A plataforma pode suspender ou encerrar contas em caso de violação destes termos, risco à segurança, fraude ou obrigação legal. O usuário pode solicitar o encerramento da conta pelos canais de contato informados na plataforma, observadas retenções legais eventualmente necessárias.",
      "Contato. Dúvidas sobre estes Termos de Uso podem ser enviadas para contato@recrutaindustria.com.",
      "Este documento é informativo e está sujeito a revisão. Em caso de conflito entre versões traduzidas, a versão em português brasileiro prevalece até que haja validação jurídica formal de textos localizados.",
    ],
  },
  pendingLegalValidation: [
    "Razão social completa, CNPJ e endereço da controladora/operadora",
    "Identificação de representante legal / DPO (quando aplicável)",
    "Foro, lei aplicável e cláusulas de limitação de responsabilidade detalhadas",
    "Prazos contratuais de aviso prévio, SLA e condições de reembolso",
    "Versões oficiais traduzidas para os 12 idiomas da interface",
    "Alinhamento com contratos de prestadores de pagamento e subprocessadores",
  ],
};

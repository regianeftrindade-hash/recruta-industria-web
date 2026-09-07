/** Retenção de mensagens, dicas e propostas no painel do profissional */
export const RETENCAO_MENSAGENS_DICAS_MESES = 1;

export function limiteRetencaoInbox(): Date {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - RETENCAO_MENSAGENS_DICAS_MESES);
  return limite;
}

export const AVISO_RETENCAO_INBOX =
  "Mensagens e dicas com mais de 1 mês são apagadas automaticamente.";

export const AVISO_RETENCAO_PROPOSTAS =
  "Propostas e entrevistas com mais de 1 mês são apagadas automaticamente.";

export const AVISO_RETENCAO_GENERICO =
  "Itens com mais de 1 mês são apagados automaticamente.";

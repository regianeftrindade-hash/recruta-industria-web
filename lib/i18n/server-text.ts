import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

/** Textos fixos que as APIs devolvem e a tela mostra. O contrato continua sendo uma string. */
const KNOWN: Record<string, MessageKey> = {
  "Não autenticado": "rest.api.unauthenticated",
  "Acesso restrito a empresas": "rest.api.companyOnly",
  "Acesso negado": "rest.api.denied",
  "Corpo da requisição inválido.": "rest.api.invalidBody",
  "Dados inválidos": "rest.api.invalidData",
  "Usuário não encontrado": "rest.api.userMissing",
  "Perfil não encontrado": "rest.api.profileMissing",
  "Empresa não encontrada": "rest.api.companyMissing",
  "Profissional não encontrado": "rest.api.professionalMissing",
  "Erro ao salvar vídeo.": "rest.video.saveError",
  "Erro ao preparar upload.": "rest.video.prepareError",
  "Erro ao remover vídeo.": "rest.video.removeError",
  "Não foi possível enviar o certificado.": "rest.cert.failed",
  "Erro ao enviar certificado": "rest.cert.sendError",
  "Não foi possível alterar o plano.": "fix.u.080",
  "Não foi possível convidar.": "fix.u.158",
  "Erro ao remover.": "fix.u.160",
  "Não foi possível iniciar o pagamento.": "fix.u.163",
  "Erro ao enviar mensagem.": "fix.u.197",
  "Erro ao salvar": "fix.u.263",
  "Não foi possível excluir a mensagem.": "internal.pro.deleteMessageError",
  "Erro ao enviar mensagem": "fix.u.275",
  "Não foi possível enviar o feedback.": "fix.u.284",
  "Não foi possível excluir o feedback.": "fix.u.287",
  "Erro ao enviar dica": "fix.u.294",
  "Não foi possível excluir a dica.": "internal.pro.deleteTipError",
  "Não foi possível carregar as candidaturas.": "fix.u.302",
  "Não foi possível carregar as vagas.": "fix.u.303",
  "Não foi possível salvar a vaga.": "fix.u.305",
  "Não foi possível atualizar a vaga.": "fix.u.306",
  "Não foi possível excluir a vaga.": "fix.u.308",
  "Não foi possível excluir a candidatura.": "fix.u.310",
  "Não foi possível atualizar a etapa.": "fix.u.312",
  "Erro ao agendar": "fix.u.376",
  "Erro ao excluir": "internal.pro.deleteError",
  "Erro ao cancelar entrevista": "fix.u.381",
  "Erro ao atualizar": "fix.interview.updateError",
  "Vídeo indisponível.": "fix.u.474",
  "Não foi possível carregar o vídeo.": "fix.u.476",
  "Não foi possível excluir o cadastro.": "fix.u.478",
  "Não foi possível abrir a mensagem.": "fix.u.525",
  "Não foi possível enviar o e-mail.": "fix.u.527",
  "Não foi possível excluir o e-mail.": "fix.u.530",
  "Erro ao carregar empresas.": "fix.u.570",
  "Não foi possível excluir a empresa.": "fix.u.571",
  "Erro ao atualizar verificação.": "fix.u.574",
  "Não foi possível cadastrar a vaga.": "fix.u.581",
};

export function localizeServerText(value: unknown): string {
  if (typeof value !== "string") return "";
  const key = KNOWN[value];
  return key ? t(key) : value;
}

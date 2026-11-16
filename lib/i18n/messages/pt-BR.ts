import { localeUiMessages } from "@/lib/i18n/messages/locale-ui";
import { internalMessages } from "@/lib/i18n/messages/internal";
import { fixMessages } from "@/lib/i18n/messages/fix";
import { restMessages } from "@/lib/i18n/messages/rest";
import { surfaceMessages } from "@/lib/i18n/messages/surfaces";
import { registrationUiMessages } from "@/lib/i18n/messages/registration-ui";
import { sharedOptionMessages } from "@/lib/i18n/messages/shared-options";

/**
 * Catálogo da interface. Os textos são os que a tela já mostra.
 * Não há tradução para outro idioma neste arquivo.
 */
const registrationSimpleMessages = {
  "registration.country.label": "País",
  "registration.country.brazil": "Brasil",
  "registration.country.unavailable":
    "O cadastro deste país ainda não está disponível. Hoje só é possível concluir o cadastro no Brasil.",
  "registration.country.invalid": "Selecione um país.",
  "registration.country.locked": "O país deste cadastro não pode ser alterado.",

  "registration.simple.metaTitle": "Cadastro rápido",
  "registration.simple.metaDescription":
    "Crie sua conta no Recruta Indústria com nome, CPF, e-mail, telefone e senha. Complete o perfil depois no painel.",
  "registration.simple.loading": "Criando sua conta...",
  "registration.simple.accessTag": "Cadastro rápido",
  "registration.simple.fullName": "Nome completo",
  "registration.simple.cpf": "CPF",
  "registration.simple.cpfPlaceholder": "000.000.000-00",
  "registration.simple.email": "E-mail",
  "registration.simple.phone": "Telefone",
  "registration.simple.phonePlaceholder": "(00) 00000-0000",
  "registration.simple.password": "Senha",
  "registration.simple.showPassword": "Mostrar senha",
  "registration.simple.hidePassword": "Ocultar senha",
  "registration.simple.confirmPassword": "Confirmar senha",
  "registration.simple.showConfirm": "Mostrar confirmação",
  "registration.simple.hideConfirm": "Ocultar confirmação",
  "registration.simple.submit": "Criar conta",
  "registration.simple.backHome": "← Voltar para a página inicial",
  "registration.simple.nameRequired": "Informe seu nome completo.",
  "registration.simple.cpfInvalid": "CPF inválido.",
  "registration.simple.emailInvalid": "Informe um e-mail válido.",
  "registration.simple.phoneInvalid": "Telefone inválido. Informe DDD + número.",
  "registration.simple.passwordMismatch": "Senhas não conferem.",
  "registration.simple.passwordWeak": "Senha não atende aos requisitos de segurança.",
  "registration.simple.createFailed": "Não foi possível criar a conta.",
  "registration.simple.autoLoginFailed":
    "Conta criada, mas o login automático falhou. Entre com seu e-mail e senha.",
  "registration.simple.networkError": "Erro ao criar conta. Tente novamente.",
} as const;

export const messagesPtBR = {
  ...registrationSimpleMessages,
  ...registrationUiMessages,
  ...sharedOptionMessages,
  ...localeUiMessages,
  ...surfaceMessages,
  ...internalMessages,
  ...restMessages,
  ...fixMessages,
} as const;

export type MessageKey = keyof typeof messagesPtBR;

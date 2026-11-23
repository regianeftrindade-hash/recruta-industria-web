import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import type { SupportedLocale } from "@/lib/i18n/locales";

/** Traduções pontuais das validações CPF/CNPJ só-Brasil nos catálogos estrangeiros. */
export const brazilOnlyDocumentMessages: Partial<
  Record<SupportedLocale, Partial<Record<MessageKey, string>>>
> = {
  es: {
    "registration.simple.cpfBrazilOnly": "El CPF solo se acepta en registros de Brasil.",
    "registration.simple.cnpjBrazilOnly": "El CNPJ solo se acepta en registros de Brasil.",
  },
  fr: {
    "registration.simple.cpfBrazilOnly": "Le CPF n'est accepté que pour les inscriptions au Brésil.",
    "registration.simple.cnpjBrazilOnly": "Le CNPJ n'est accepté que pour les inscriptions au Brésil.",
  },
  de: {
    "registration.simple.cpfBrazilOnly": "CPF wird nur bei Registrierungen in Brasilien akzeptiert.",
    "registration.simple.cnpjBrazilOnly": "CNPJ wird nur bei Registrierungen in Brasilien akzeptiert.",
  },
  it: {
    "registration.simple.cpfBrazilOnly": "Il CPF è accettato solo per le registrazioni in Brasile.",
    "registration.simple.cnpjBrazilOnly": "Il CNPJ è accettato solo per le registrazioni in Brasile.",
  },
  "pt-PT": {
    "registration.simple.cpfBrazilOnly": "O CPF só é aceite em registos do Brasil.",
    "registration.simple.cnpjBrazilOnly": "O CNPJ só é aceite em registos do Brasil.",
  },
  "zh-CN": {
    "registration.simple.cpfBrazilOnly": "CPF 仅适用于巴西注册。",
    "registration.simple.cnpjBrazilOnly": "CNPJ 仅适用于巴西注册。",
  },
  ja: {
    "registration.simple.cpfBrazilOnly": "CPFはブラジルでの登録でのみ受け付けられます。",
    "registration.simple.cnpjBrazilOnly": "CNPJはブラジルでの登録でのみ受け付けられます。",
  },
  ko: {
    "registration.simple.cpfBrazilOnly": "CPF는 브라질 등록에서만 허용됩니다.",
    "registration.simple.cnpjBrazilOnly": "CNPJ는 브라질 등록에서만 허용됩니다.",
  },
  ar: {
    "registration.simple.cpfBrazilOnly": "يُقبل رقم CPF فقط في التسجيلات داخل البرازيل.",
    "registration.simple.cnpjBrazilOnly": "يُقبل رقم CNPJ فقط في التسجيلات داخل البرازيل.",
  },
  hi: {
    "registration.simple.cpfBrazilOnly": "CPF केवल ब्राज़ील में पंजीकरण के लिए स्वीकार किया जाता है।",
    "registration.simple.cnpjBrazilOnly": "CNPJ केवल ब्राज़ील में पंजीकरण के लिए स्वीकार किया जाता है।",
  },
};

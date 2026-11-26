/**
 * Minimização LGPD Art. 11: dados sensíveis / identificadores fortes
 * não devem ir ao painel da empresa no formEdit.
 */
const SENSITIVE_FORM_KEYS = [
  "orientacaoSexual",
  "religiao",
  "antecedentes",
  "identidadeGenero",
  "sexoBiologico",
  "cpf",
] as const;

export function stripSensitiveCompanyFormEdit<T extends Record<string, unknown>>(
  formEdit: T | null | undefined,
): T | null | undefined {
  if (!formEdit) return formEdit;

  const files =
    formEdit.formData && typeof formEdit.formData === "object"
      ? (formEdit.formData as Record<string, unknown>)
      : null;

  if (files) {
    for (const key of SENSITIVE_FORM_KEYS) {
      if (key in files) files[key] = "";
    }
  }

  if ("cpf" in formEdit) {
    (formEdit as { cpf?: string }).cpf = "";
  }

  return formEdit;
}

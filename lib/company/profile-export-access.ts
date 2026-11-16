/** A exportação só sai depois do plano Premium verificado e do desbloqueio ativo. */
export function profileExportDecision(input: {
  canExportProfiles: boolean;
  hasActiveUnlock: boolean;
}): "ok" | "plan" | "locked" {
  if (!input.canExportProfiles) return "plan";
  if (!input.hasActiveUnlock) return "locked";
  return "ok";
}

/** Nome de arquivo sem aspas, quebra de linha ou caminho. */
export function profileExportFileSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "perfil";
}

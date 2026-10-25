/** Só a lista de vagas do admin pode ser destino do Voltar aberto a partir do painel. */
const VOLTAS_PERMITIDAS = new Set(["/admin/vagas"]);

export function caminhoDeVolta(value: string | null | undefined): string | null {
  if (!value) return null;
  let path = value.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  if (!VOLTAS_PERMITIDAS.has(path)) return null;
  return path;
}

export function hrefComVolta(path: string, volta: string | null | undefined): string {
  const destino = caminhoDeVolta(volta);
  if (!destino) return path;
  const separador = path.includes("?") ? "&" : "?";
  return `${path}${separador}voltar=${encodeURIComponent(destino)}`;
}

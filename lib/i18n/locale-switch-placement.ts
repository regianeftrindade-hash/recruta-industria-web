/** Largura em que o seletor da home deixa de flutuar e entra no fluxo. */
export const HOME_LOCALE_FLOW_MAX_WIDTH = 768;

/**
 * A home desenha o seletor no próprio cabeçalho.
 * As outras rotas usam a faixa do layout, visível antes do conteúdo.
 */
export function localeSwitchHost(pathname: string): "home-header" | "page-header" {
  return pathname === "/" ? "home-header" : "page-header";
}

export function showsGlobalLocaleBar(pathname: string): boolean {
  return localeSwitchHost(pathname) === "page-header";
}

export function homeLocaleSlotMode(viewportWidth: number): "overlay" | "flow" {
  return viewportWidth <= HOME_LOCALE_FLOW_MAX_WIDTH ? "flow" : "overlay";
}

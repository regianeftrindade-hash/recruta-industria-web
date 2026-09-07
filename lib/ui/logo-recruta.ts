/**
 * Logotipo oficial Recruta Indústria — configuração padrão do projeto.
 * Fonte única de verdade: imagens em /public/logo-recruta.png e /public/simbolo-recruta.png
 *
 * Uso: `<LogoRecruta />` para o logotipo completo; `<LogoRecrutaSymbol />` só para o símbolo.
 */

import type { CSSProperties } from "react";

/** Arquivos oficiais enviados pelo usuário */
export const LOGO_ASSETS = {
  /** Logotipo completo (símbolo + RECRUTA INDÚSTRIA) */
  wordmark: "/logo-recruta-trim.png",
  /** Símbolo circular (engrenagem + monograma) */
  symbol: "/simbolo-recruta.png",
} as const;

/** Tamanhos responsivos do logotipo completo */
export const LOGO_SIZES = {
  hero: { width: "clamp(248px, 56vw, 400px)", uso: "Página inicial" },
  md: { width: "clamp(200px, 52vw, 340px)", uso: "Destaque médio" },
  sm: { width: "clamp(155px, 38vw, 240px)", uso: "Login e cards" },
  xs: { width: "clamp(118px, 28vw, 170px)", uso: "Cabeçalhos de dashboard" },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

/** Tamanhos do símbolo isolado */
export const SYMBOL_SIZES = {
  xs: "28px",
  sm: "40px",
  md: "64px",
  lg: "96px",
} as const;

export type SymbolSize = keyof typeof SYMBOL_SIZES;

export const LOGO_WRAPPER_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  padding: 0,
  lineHeight: 0,
};

/** Configuração consolidada — logo padrão do projeto */
export const LOGO_PADRAO = {
  assets: LOGO_ASSETS,
  sizes: LOGO_SIZES,
  symbolSizes: SYMBOL_SIZES,
  defaultSize: "md" as LogoSize,
  defaultSymbolSize: "md" as SymbolSize,
  /** Mantido por compatibilidade — a arte já traz o relevo 3D */
  depth: true,
  wrapperStyle: LOGO_WRAPPER_STYLE,
  ariaLabel: "Recruta Indústria",
  componentPath: "@/app/components/LogoRecruta",
  symbolComponentPath: "@/app/components/LogoRecrutaSymbol",
} as const;

/** @deprecated — tipografia antiga do SVG; a marca agora é imagem oficial */
export const LOGO_TYPOGRAPHY = {
  fontFamily: "inherit",
  fontWeight: 700,
  letterSpacing: "0.02em",
  fontKerning: "normal" as const,
} as const;

/** @deprecated — sombra embutida na arte oficial */
export const LOGO_DEPTH_SHADOW = {
  enabled: true,
  translateX: 0,
  translateY: 0,
  opacity: 1,
  color: "transparent",
} as const;

/** @deprecated */
export const LOGO_METRICS = {
  textX: 0,
  recrutaY: 0,
  wordSize: 0,
  lineGap: 0,
  cruRCharIndex: 0,
  lineStartOffset: 0,
  lineStartExtra: 0,
  lineEndExtra: 0,
} as const;

/** @deprecated */
export const LOGO_GOLD_GRADIENT = [
  { offset: "0%", color: "#8D6B1F" },
  { offset: "35%", color: "#D4AF37" },
  { offset: "65%", color: "#F0D878" },
  { offset: "100%", color: "#C89B3C" },
] as const;

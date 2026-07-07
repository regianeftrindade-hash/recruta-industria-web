/**
 * Logotipo oficial Recruta Indústria — configuração padrão do projeto.
 * Fonte única de verdade para tipografia, cores, sombra 3D e tamanhos.
 *
 * Uso no código: importe o componente `LogoRecruta` de `@/app/components/LogoRecruta`.
 * Não use texto plano "RECRUTA INDÚSTRIA" nem imagens antigas de logo.
 */

import type { CSSProperties } from "react";
import { FONT_STACK } from "@/lib/theme";
import { GOLD_GRADIENT_STOPS } from "@/lib/decorative-gold-line";

/** Sombra 3D padrão (mesma da página inicial) */
export const LOGO_DEPTH_SHADOW = {
    enabled: true,
    translateX: 3,
    translateY: 4,
    opacity: 0.9,
    color: "#2a1f08",
} as const;

/** Tamanhos responsivos do SVG */
export const LOGO_SIZES = {
    hero: { width: "clamp(248px, 56vw, 400px)", uso: "Página inicial" },
    md: { width: "clamp(200px, 52vw, 340px)", uso: "Destaque médio" },
    sm: { width: "clamp(155px, 38vw, 240px)", uso: "Login e cards" },
    xs: { width: "clamp(118px, 28vw, 170px)", uso: "Cabeçalhos de dashboard" },
} as const;

export type LogoSize = keyof typeof LOGO_SIZES;

/** Métricas internas do desenho SVG */
export const LOGO_METRICS = {
    textX: 26,
    recrutaY: 44,
    wordSize: 43,
    lineGap: 2,
    cruRCharIndex: 3,
    lineStartOffset: 12,
    /** Extensão extra da linha além do fim de INDÚSTRIA (px) */
    lineStartExtra: 0,
    lineEndExtra: 18,
} as const;

/** Tipografia do logotipo */
export const LOGO_TYPOGRAPHY = {
    fontFamily: FONT_STACK,
    fontWeight: 700,
    letterSpacing: "0.02em",
    fontKerning: "normal" as const,
} as const;

/** Gradiente dourado horizontal do texto e sublinhado */
export const LOGO_GOLD_GRADIENT = GOLD_GRADIENT_STOPS;

/** Wrapper padrão do componente */
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
    /** Sempre usar sombra 3D salvo pedido explícito em contrário */
    depth: LOGO_DEPTH_SHADOW.enabled,
    depthShadow: LOGO_DEPTH_SHADOW,
    sizes: LOGO_SIZES,
    defaultSize: "md" as LogoSize,
    metrics: LOGO_METRICS,
    typography: LOGO_TYPOGRAPHY,
    gradient: LOGO_GOLD_GRADIENT,
    wrapperStyle: LOGO_WRAPPER_STYLE,
    ariaLabel: "Recruta Indústria",
    componentPath: "@/app/components/LogoRecruta",
} as const;

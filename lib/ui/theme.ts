import type { CSSProperties } from "react";

/** Paleta alinhada à home: página cinza claro, cards mais escuros */
export const COLORS = {
  /** Fundo de página (cinza claro) */
  preto: "#3A3A3A",
  /** Fundo de cards / painéis (mais escuro) */
  cardBg: "#2B2B2B",
  /** Texto em botões dourados — não usar como fundo */
  tinta: "#000000",
  dourado: "#C89B3C",
  douradoEscuro: "#8D6B1F",
  branco: "#F2F2F2",
  textoSuave: "#F2F2F2",
} as const;

export const FONT_STACK =
  "var(--font-oswald), 'Oswald', 'Bebas Neue', 'Teko', Impact, sans-serif";

/** Tipografia legível para formulários, painéis e dashboards */
export const READABLE_FONT_STACK =
  'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", sans-serif';

export const READABLE_TEXT_STYLE: CSSProperties = {
  fontFamily: READABLE_FONT_STACK,
  letterSpacing: "normal",
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
};

/** Espaçamento de letras único em todo o site */
export const LETTER_SPACING = "normal";

export const goldTextGradient: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 50%, #A87E2E 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

export const GOLD_GRADIENT =
  "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 45%, #A87E2E 100%)";

export const GOLD_GRADIENT_MUTED =
  "linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)";

export const GOLD_GRADIENT_DISABLED =
  "linear-gradient(180deg, #4a3810 0%, #5a4512 45%, #6b5218 100%)";

export const goldButtonStyle: CSSProperties = {
  background: GOLD_GRADIENT,
  color: COLORS.tinta,
  border: "1px solid #6b5218",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "inset 0 1px 0 rgba(200, 155, 60, 0.45), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)",
};

export const inputStyle: CSSProperties = {
  padding: "12px",
  borderRadius: 0,
  border: `1px solid ${COLORS.douradoEscuro}`,
  background: COLORS.preto,
  color: COLORS.branco,
  fontFamily: READABLE_FONT_STACK,
  fontSize: "15px",
  letterSpacing: "normal",
  lineHeight: 1.45,
  outline: "none",
};

export const cardStyle: CSSProperties = {
  background: COLORS.cardBg,
  border: `1px solid ${COLORS.douradoEscuro}`,
  borderRadius: "8px",
  color: COLORS.branco,
};

export const fieldLabelStyle: CSSProperties = {
  color: COLORS.dourado,
  fontWeight: 700,
};

export const fieldValueStyle: CSSProperties = {
  color: COLORS.branco,
  fontWeight: 700,
};

export const pageStyle: CSSProperties = {
  background: COLORS.preto,
  minHeight: "100vh",
  color: COLORS.branco,
  fontFamily: FONT_STACK,
  letterSpacing: LETTER_SPACING,
};

export const readablePageStyle: CSSProperties = {
  ...pageStyle,
  ...READABLE_TEXT_STYLE,
};

export function avatarImageStyle(size = 120): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    border: `2px solid ${COLORS.douradoEscuro}`,
    imageRendering: "auto",
    flexShrink: 0,
    display: "block",
  };
}

export const crispImageStyle: CSSProperties = {
  imageRendering: "auto",
  maxWidth: "100%",
  height: "auto",
  display: "block",
};

import type { CSSProperties } from "react";
import { COLORS, GOLD_GRADIENT, GOLD_GRADIENT_DISABLED, GOLD_GRADIENT_MUTED } from "@/lib/theme";

/** Sombras 3D — alto relevo (padrão do projeto / cor do logo) */
export const BUTTON_3D_GOLD_SHADOW =
    "inset 0 1px 0 rgba(200, 155, 60, 0.45), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)";

export const BUTTON_3D_GOLD_SHADOW_ACTIVE =
    "inset 0 2px 5px rgba(0, 0, 0, 0.42), 0 1px 0 #5a4512";

/** @deprecated Preferir goldButton3DStyle — todos os botões são dourados 3D */
export const BUTTON_3D_OUTLINE_SHADOW = BUTTON_3D_GOLD_SHADOW;

/** @deprecated Preferir goldButton3DStyle */
export const BUTTON_3D_DARK_SHADOW = BUTTON_3D_GOLD_SHADOW;

/** Botão dourado com relevo 3D — padrão único do site (cor do logo) */
export const goldButton3DStyle: CSSProperties = {
    background: GOLD_GRADIENT,
    color: COLORS.tinta,
    border: "1px solid #6b5218",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: BUTTON_3D_GOLD_SHADOW,
    borderRadius: 8,
};

/** Atalho usado nos dashboards */
export const btnGoldStyle: CSSProperties = {
    ...goldButton3DStyle,
    fontSize: 13,
};

export const goldButton3DDisabledStyle: CSSProperties = {
    background: GOLD_GRADIENT_DISABLED,
    color: COLORS.branco,
    border: "1px solid #4a3810",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 1px 0 #3a2a08",
    cursor: "not-allowed",
    opacity: 0.75,
};

/** Estado inativo de toggle (ainda dourado 3D, tom mais fechado) */
export const goldButton3DMutedStyle: CSSProperties = {
    background: GOLD_GRADIENT_MUTED,
    color: COLORS.branco,
    border: "1px solid #6b5218",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: BUTTON_3D_GOLD_SHADOW,
    borderRadius: 8,
};

/** Alias — secundário também é dourado 3D */
export const outlineButton3DStyle: CSSProperties = {
    ...goldButton3DStyle,
};

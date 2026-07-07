import type { CSSProperties } from "react";
import { COLORS, GOLD_GRADIENT, GOLD_GRADIENT_DISABLED } from "@/lib/theme";

/** Sombras 3D — alto relevo (padrão do projeto) */
export const BUTTON_3D_GOLD_SHADOW =
    "inset 0 1px 0 rgba(255, 228, 150, 0.55), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)";

export const BUTTON_3D_GOLD_SHADOW_ACTIVE =
    "inset 0 2px 5px rgba(0, 0, 0, 0.42), 0 1px 0 #5a4512";

export const BUTTON_3D_OUTLINE_SHADOW =
    "inset 0 1px 0 rgba(200, 155, 60, 0.2), 0 2px 0 rgba(0, 0, 0, 0.38), 0 3px 8px rgba(0, 0, 0, 0.32)";

export const BUTTON_3D_DARK_SHADOW =
    "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 2px 0 rgba(0, 0, 0, 0.5), 0 3px 8px rgba(0, 0, 0, 0.35)";

/** Botão dourado com relevo 3D — usar em estilos inline */
export const goldButton3DStyle: CSSProperties = {
    background: GOLD_GRADIENT,
    color: COLORS.preto,
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

export const outlineButton3DStyle: CSSProperties = {
    background: "transparent",
    color: COLORS.dourado,
    border: `1px solid ${COLORS.douradoEscuro}`,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: BUTTON_3D_OUTLINE_SHADOW,
    borderRadius: 8,
};

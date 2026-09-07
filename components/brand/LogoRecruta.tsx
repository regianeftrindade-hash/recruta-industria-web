"use client";

import React from "react";
import {
  LOGO_ASSETS,
  LOGO_PADRAO,
  LOGO_SIZES,
  LOGO_WRAPPER_STYLE,
  type LogoSize,
} from "@/lib/logo-recruta";

interface LogoRecrutaProps {
  size?: LogoSize;
  as?: "h1" | "h2" | "div" | "span";
  /** Mantido por compatibilidade — a arte oficial já inclui o relevo 3D */
  depth?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Logotipo oficial Recruta Indústria (imagem enviada pelo usuário).
 * Use em páginas, login, dashboards e cabeçalhos.
 */
export default function LogoRecruta({
  size = LOGO_PADRAO.defaultSize,
  as: Tag = "div",
  depth: _depth = LOGO_PADRAO.depth,
  style,
  className,
}: LogoRecrutaProps) {
  const config = LOGO_SIZES[size];

  return (
    <Tag
      className={className}
      aria-label={LOGO_PADRAO.ariaLabel}
      style={{
        ...LOGO_WRAPPER_STYLE,
        ...style,
      }}
    >
      <img
        src={LOGO_ASSETS.wordmark}
        alt={LOGO_PADRAO.ariaLabel}
        width={400}
        height={178}
        decoding="async"
        style={{
          display: "block",
          width: config.width,
          height: "auto",
          maxWidth: "100%",
        }}
      />
    </Tag>
  );
}

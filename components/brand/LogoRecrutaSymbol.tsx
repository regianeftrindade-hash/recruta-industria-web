"use client";

import React from "react";
import {
  LOGO_ASSETS,
  LOGO_PADRAO,
  LOGO_WRAPPER_STYLE,
  SYMBOL_SIZES,
  type SymbolSize,
} from "@/lib/logo-recruta";

type Props = {
  size?: SymbolSize;
  /** Mantido por compatibilidade */
  depth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
};

/**
 * Símbolo oficial Recruta Indústria (engrenagem + monograma).
 * Use em favicon, ícone de app e onde só o símbolo for necessário.
 */
export default function LogoRecrutaSymbol({
  size = LOGO_PADRAO.defaultSymbolSize,
  depth: _depth = LOGO_PADRAO.depth,
  className,
  style,
  label = LOGO_PADRAO.ariaLabel,
}: Props) {
  const width = SYMBOL_SIZES[size];

  return (
    <span
      className={className}
      aria-label={label}
      role="img"
      style={{ ...LOGO_WRAPPER_STYLE, ...style }}
    >
      <img
        src={LOGO_ASSETS.symbol}
        alt={label}
        width={96}
        height={96}
        decoding="async"
        style={{
          display: "block",
          width,
          height: width,
          objectFit: "contain",
        }}
      />
    </span>
  );
}

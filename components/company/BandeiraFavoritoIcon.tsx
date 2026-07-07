"use client";

import React from "react";

const VERMELHO_ATIVO = "#e53935";
const VERMELHO_BORDA = "#c62828";

export default function BandeiraFavoritoIcon({
  ativo,
  size = 22,
  className,
}: {
  ativo: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      style={{ display: "block" }}
    >
      <path
        d="M12 20.25l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 20.25z"
        fill={ativo ? VERMELHO_ATIVO : "transparent"}
        stroke={ativo ? VERMELHO_BORDA : "currentColor"}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

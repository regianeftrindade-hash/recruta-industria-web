import type { CSSProperties } from "react";

/** Tinta do perfil que a empresa vê: preto, preto negrito, dourado escuro e vermelho de aviso. */
export const COR_PRETO = "#000000";
export const COR_DOURADO = "#5C3D07";
export const COR_VERMELHO = "#C40000";

const contornoPreto = [
  "0 0 1px #000",
  "1px 0 0 #000",
  "-1px 0 0 #000",
  "0 1px 0 #000",
  "0 -1px 0 #000",
  "1px 1px 0 #000",
  "-1px -1px 0 #000",
  "1px -1px 0 #000",
  "-1px 1px 0 #000",
].join(", ");

export const textoPreto: CSSProperties = {
  color: COR_PRETO,
  fontWeight: 400,
};

export const textoPretoNegrito: CSSProperties = {
  color: COR_PRETO,
  fontWeight: 800,
};

export const textoDourado: CSSProperties = {
  color: COR_DOURADO,
  fontWeight: 700,
  textShadow: contornoPreto,
};

export const textoAviso: CSSProperties = {
  color: COR_VERMELHO,
  fontWeight: 800,
  textShadow: contornoPreto,
};

/** Botão do perfil: preto negrito e borda preta, sem o degradê dourado claro. */
export const botaoPerfil: CSSProperties = {
  background: "transparent",
  color: COR_PRETO,
  border: "2px solid #000",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "none",
  borderRadius: 8,
  textShadow: "none",
  fontFamily: "inherit",
  textDecoration: "none",
};

export const CLASSE_PERFIL = "ri-perfil-empresa";

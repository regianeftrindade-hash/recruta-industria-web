"use client";

import React from "react";
import styles from "./register.module.css";

export type MarcadorPreenchimento = "obrigatorio" | "recomendado";

function classeMarcador(marcador?: MarcadorPreenchimento): string {
  if (marcador === "obrigatorio") return styles.labelMarcadorObrigatorio;
  if (marcador === "recomendado") return styles.labelMarcadorRecomendado;
  return "";
}

type LabelProps = {
  htmlFor?: string;
  marcador?: MarcadorPreenchimento;
  children: React.ReactNode;
  className?: string;
};

export function LabelMarcador({ htmlFor, marcador, children, className = "" }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={[styles.label, classeMarcador(marcador), className].filter(Boolean).join(" ")}
    >
      {children}
    </label>
  );
}

export function TextoMarcador({
  as: Tag = "span",
  marcador,
  children,
  className = "",
}: {
  as?: "span" | "label" | "p";
  marcador?: MarcadorPreenchimento;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tag className={[styles.label, classeMarcador(marcador), className].filter(Boolean).join(" ")}>
      {children}
    </Tag>
  );
}

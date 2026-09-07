"use client";

import React from "react";
import Link from "next/link";
import type { CadastroTermoSlug } from "@/lib/cadastro-termos";
import { hrefTermoCadastro } from "@/lib/cadastro-termos";
import styles from "./register.module.css";

type Props = {
  id: string;
  slug: CadastroTermoSlug;
  titulo: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export default function RegisterTermoItem({ id, slug, titulo, checked, onChange, className }: Props) {
  return (
    <div className={className ?? styles.termoItem}>
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.termoCheckbox}
      />
      <Link
        href={hrefTermoCadastro(slug)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.termoTituloLink} ${styles.labelMarcadorObrigatorio}`}
      >
        {titulo}
      </Link>
    </div>
  );
}

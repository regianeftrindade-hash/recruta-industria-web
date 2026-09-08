"use client";

import React, { useId, useState } from "react";
import styles from "@/app/professional/register/register.module.css";
import RegisterSectionHeader from "@/components/ui/RegisterSectionHeader";
import type { MarcadorPreenchimento } from "@/app/professional/register/RegisterLabelMarcador";

type Props = {
  emoji: string;
  title: string;
  marcador?: MarcadorPreenchimento;
  /** Seções opcionais começam fechadas para reduzir cansaço. */
  defaultOpen?: boolean;
  children: React.ReactNode;
};

/** Seção do cadastro que pode recolher (detalhes nativos + estilo do card). */
export default function RegisterCollapsibleSection({
  emoji,
  title,
  marcador,
  defaultOpen = false,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={`${styles.sectionCard} ${styles.sectionCollapsible}`}>
      <button
        type="button"
        className={styles.sectionToggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <RegisterSectionHeader emoji={emoji} title={title} marcador={marcador} />
        <span className={styles.sectionChevron} aria-hidden>
          {open ? "▾" : "▸"}
        </span>
      </button>
      <div id={panelId} hidden={!open} className={styles.sectionCollapsibleBody}>
        {children}
      </div>
    </section>
  );
}

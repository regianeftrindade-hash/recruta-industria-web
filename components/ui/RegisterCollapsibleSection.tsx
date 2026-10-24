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
  /** Controle externo (ex.: abrir seção com erro de validação). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** No perfil, libera só este bloco. Fora do perfil, omitir. */
  editar?: {
    aberto: boolean;
    onEditar: () => void;
  };
  children: React.ReactNode;
};

/** Seção do cadastro que pode recolher (detalhes nativos + estilo do card). */
export default function RegisterCollapsibleSection({
  emoji,
  title,
  marcador,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  editar,
  children,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const panelId = useId();
  const controlled = typeof openProp === "boolean";
  const open = controlled ? openProp : internalOpen;

  const setOpen = (next: boolean) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const blocoTravado = Boolean(editar && !editar.aberto);

  return (
    <section className={`${styles.sectionCard} ${styles.sectionCollapsible}`}>
      <div className={styles.sectionHead}>
        <button
          type="button"
          className={styles.sectionToggle}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          <RegisterSectionHeader emoji={emoji} title={title} marcador={marcador} />
          <span className={styles.sectionChevron} aria-hidden>
            {open ? "▾" : "▸"}
          </span>
        </button>
        {editar ? (
          <button
            type="button"
            className={styles.blocoEditarBtn}
            onClick={() => {
              setOpen(true);
              editar.onEditar();
            }}
            disabled={editar.aberto}
          >
            {editar.aberto ? "Editando" : "Editar"}
          </button>
        ) : null}
      </div>
      <div
        id={panelId}
        hidden={!open}
        className={styles.sectionCollapsibleBody}
        inert={blocoTravado ? true : undefined}
      >
        {children}
      </div>
    </section>
  );
}

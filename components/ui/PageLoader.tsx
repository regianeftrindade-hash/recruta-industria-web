"use client";

import React from "react";
import styles from "./PageLoader.module.css";

interface PageLoaderProps {
  message?: string;
  /** page = tela inteira; overlay = por cima do conteúdo (ex.: envio do formulário) */
  mode?: "page" | "overlay";
}

export default function PageLoader({
  message = "Carregando...",
  mode = "page",
}: PageLoaderProps) {
  const wrapperClass = mode === "overlay" ? styles.overlay : styles.page;

  return (
    <div className={wrapperClass} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.content}>
        <div className={styles.spinner} aria-hidden="true" />
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
}

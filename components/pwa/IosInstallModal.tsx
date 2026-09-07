"use client";

import { useEffect } from "react";
import styles from "./InstallAppPrompt.module.css";

type Props = {
  onClose: () => void;
};

export default function IosInstallModal({ onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-labelledby="ios-install-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ios-install-title" className={styles.modalTitle}>
          Instalar no iPhone ou iPad
        </h2>
        <p className={styles.modalText}>
          Toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
        </p>
        <ol className={styles.modalSteps}>
          <li>
            Toque no ícone <strong>Compartilhar</strong> na barra inferior do Safari
          </li>
          <li>Role e escolha <strong>Adicionar à Tela de Início</strong></li>
          <li>Confirme em <strong>Adicionar</strong></li>
        </ol>
        <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
}

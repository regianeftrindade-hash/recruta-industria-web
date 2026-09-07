"use client";

import { useEffect } from "react";
import styles from "./InstallAppPrompt.module.css";

type Props = {
  onClose: () => void;
  apkUrl?: string;
};

export default function AndroidInstallModal({ onClose, apkUrl }: Props) {
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
        aria-labelledby="android-install-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="android-install-title" className={styles.modalTitle}>
          Instalar o aplicativo Recruta
        </h2>
        <p className={styles.modalText}>
          Isso coloca o Recruta na <strong>lista de aplicativos</strong> do celular, como um app —
          não é atalho da tela inicial.
        </p>
        <ol className={styles.modalSteps}>
          <li>Abra este site no <strong>Chrome</strong> (não no Instagram, WhatsApp ou Safari)</li>
          <li>Toque nos <strong>três pontos</strong> no canto superior direito</li>
          <li>Toque em <strong>Instalar aplicativo</strong> ou <strong>Instalar app</strong></li>
          <li>Confirme em <strong>Instalar</strong></li>
        </ol>
        {apkUrl ? (
          <a className={styles.modalCloseBtn} href={apkUrl} download style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 10 }}>
            Baixar o arquivo do app (APK)
          </a>
        ) : null}
        <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
}

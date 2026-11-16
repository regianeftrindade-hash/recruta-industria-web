"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n/translate";
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
          {t("surface.pwa.iosTitle")}
        </h2>
        <p className={styles.modalText}>{t("surface.pwa.iosBody")}</p>
        <ol className={styles.modalSteps}>
          <li>{t("surface.pwa.iosShare")}</li>
          <li>{t("surface.pwa.iosHome")}</li>
          <li>{t("surface.pwa.iosAdd")}</li>
        </ol>
        <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
          {t("surface.pwa.gotIt")}
        </button>
      </div>
    </div>
  );
}

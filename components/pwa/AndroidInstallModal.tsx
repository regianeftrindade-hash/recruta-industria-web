"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n/translate";
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
          {t("surface.pwa.androidTitle")}
        </h2>
        <p className={styles.modalText}>{t("surface.pwa.androidBody")}</p>
        <ol className={styles.modalSteps}>
          <li>{t("surface.pwa.androidChrome")}</li>
          <li>{t("surface.pwa.androidMenu")}</li>
          <li>{t("surface.pwa.androidInstall")}</li>
          <li>{t("surface.pwa.androidConfirm")}</li>
        </ol>
        <p className={styles.modalText} style={{ marginTop: 8 }}>{t("surface.pwa.desktop")}</p>
        {apkUrl ? (
          <a className={styles.modalCloseBtn} href={apkUrl} download style={{ display: "block", textAlign: "center", textDecoration: "none", marginBottom: 10 }}>
            {t("surface.pwa.apk")}
          </a>
        ) : null}
        <button type="button" className={styles.modalCloseBtn} onClick={onClose}>
          {t("surface.pwa.gotIt")}
        </button>
      </div>
    </div>
  );
}

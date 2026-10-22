"use client";

import styles from "./vagas.module.css";

export default function JobBackButton() {
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        window.location.href = "/vagas";
      }}
    >
      Voltar
    </button>
  );
}

"use client";

import { caminhoDeVolta } from "@/lib/jobs/job-return-path";
import styles from "./vagas.module.css";

export default function JobBackButton() {
  return (
    <button
      type="button"
      className={styles.backButton}
      onClick={() => {
        const volta = caminhoDeVolta(new URLSearchParams(window.location.search).get("voltar"));
        if (volta) {
          window.location.href = volta;
          return;
        }
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

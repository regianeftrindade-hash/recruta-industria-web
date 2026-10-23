"use client";

import CopyTextButton from "./CopyTextButton";
import styles from "./vagas.module.css";

export default function JobShareButton({ jobId }: { jobId: string }) {
  return (
    <CopyTextButton
      value={`/vagas/${jobId}`}
      label="Compartilhar vaga"
      copiedLabel="Link copiado"
      className={styles.shareButton}
    />
  );
}

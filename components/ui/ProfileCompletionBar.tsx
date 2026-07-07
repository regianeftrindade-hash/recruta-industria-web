"use client";

import React from "react";
import { getCompletionLabel } from "@/lib/profile-completion";
import styles from "@/app/professional/register/register.module.css";

interface ProfileCompletionBarProps {
  percent: number;
}

export default function ProfileCompletionBar({ percent }: ProfileCompletionBarProps) {
  const label = getCompletionLabel(percent);
  const highlight80 = percent >= 80;

  return (
    <div className={styles.completionWrap}>
      <div className={styles.completionHeader}>
        <span className={styles.completionTitle}>⭐ Perfil completo</span>
        <span className={styles.completionPercent}>{label}</span>
      </div>
      <div className={styles.completionTrack}>
        <div
          className={styles.completionFill}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <div className={styles.completionMilestones}>
        {[30, 60, 80, 100].map((m) => (
          <span
            key={m}
            className={percent >= m ? styles.milestoneActive : styles.milestone}
          >
            {m}%
          </span>
        ))}
      </div>
      <p className={highlight80 ? styles.completionHighlight : styles.completionNote}>
        {highlight80
          ? "✅ Seu perfil tem prioridade nas buscas das empresas!"
          : "Perfis com mais de 80% de preenchimento aparecem primeiro nas pesquisas."}
      </p>
    </div>
  );
}

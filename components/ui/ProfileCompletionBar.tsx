"use client";

import React from "react";
import { t } from "@/lib/i18n/translate";
import styles from "@/app/professional/register/register.module.css";

interface ProfileCompletionBarProps {
  percent: number;
}

export default function ProfileCompletionBar({ percent }: ProfileCompletionBarProps) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const label = t("rest.completion.percent").replace("{percent}", String(safePercent));
  const highlight80 = percent >= 80;

  return (
    <div className={styles.completionWrap}>
      <div className={styles.completionHeader}>
        <span className={styles.completionTitle}>{t("rest.completion.title")}</span>
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
        {highlight80 ? t("rest.completion.priority") : t("rest.completion.hint80")}
      </p>
    </div>
  );
}

"use client";

import React, { useLayoutEffect, useRef } from "react";
import styles from "@/app/login/login.module.css";
import { t } from "@/lib/i18n/translate";

/** Texto de vitrine na login/cadastro da empresa — mesma altura do card, expande lateral se precisar. */
export default function CompanyVitrinePitch() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fit = () => {
      const shell = root.closest(`.${styles.authShell}`) as HTMLElement | null;
      const loginCard = shell?.querySelector(`.${styles.card}`) as HTMLElement | null;
      const targetH = loginCard?.offsetHeight || root.clientHeight;

      if (targetH > 80) {
        root.style.minHeight = `${targetH}px`;
        root.style.height = `${targetH}px`;
      }

      // Largura base = login; se a fonte mínima ainda estourar, amplia para o lado.
      const widths = [440, 500, 560, 620];
      let chosenW = widths[0];
      let chosenFs = 9.5;

      for (const w of widths) {
        root.style.maxWidth = `${w}px`;
        root.style.width = `${w}px`;
        let lo = 9.5;
        let hi = 15.5;
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          root.style.setProperty("--pitch-fs", `${mid}px`);
          if (root.scrollHeight <= root.clientHeight + 1) lo = mid;
          else hi = mid;
        }
        chosenW = w;
        chosenFs = lo;
        if (root.scrollHeight <= root.clientHeight + 1 && lo >= 11) break;
      }

      root.style.maxWidth = `${chosenW}px`;
      root.style.width = "100%";
      root.style.setProperty("--pitch-fs", `${chosenFs}px`);
    };

    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(root);
    const shell = root.closest(`.${styles.authShell}`);
    if (shell) ro.observe(shell);
    requestAnimationFrame(() => requestAnimationFrame(fit));
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={`${styles.vitrinePitch} ${styles.vitrinePitchExpandable}`}
      aria-labelledby="company-vitrine-pitch-title"
    >
      <div className={styles.vitrinePitchInner}>
        <h2 id="company-vitrine-pitch-title" className={styles.vitrinePitchTitle}>
          {t("surface.auth.pitch.company.title")}
        </h2>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.company.p1")}</p>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.company.p2")}</p>

        <h3 className={styles.vitrinePitchSubtitle}>
          {t("surface.auth.pitch.company.subtitle")}
        </h3>
        <ul className={styles.vitrinePitchList}>
          <li>{t("surface.auth.pitch.company.li1")}</li>
          <li>{t("surface.auth.pitch.company.li2")}</li>
          <li>{t("surface.auth.pitch.company.li3")}</li>
          <li>{t("surface.auth.pitch.company.li4")}</li>
          <li>{t("surface.auth.pitch.company.li5")}</li>
          <li>{t("surface.auth.pitch.company.li6")}</li>
          <li>{t("surface.auth.pitch.company.li7")}</li>
          <li>{t("surface.auth.pitch.company.li8")}</li>
        </ul>

        <p className={styles.vitrinePitchHighlight}>
          {t("surface.auth.pitch.company.highlight")}
        </p>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.company.closing")}</p>
      </div>
    </section>
  );
}

"use client";

import React, { useLayoutEffect, useRef } from "react";
import styles from "@/app/login/login.module.css";
import { t } from "@/lib/i18n/translate";

/** Texto de vitrine na login/cadastro do profissional — preenche a altura do card de login. */
export default function ProfessionalVitrinePitch() {
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const fit = () => {
      // Ajusta o tamanho da fonte para preencher a altura do card (igual ao de login), sem rolagem.
      let lo = 9.5;
      let hi = 15.5;
      for (let i = 0; i < 14; i++) {
        const mid = (lo + hi) / 2;
        root.style.setProperty("--pitch-fs", `${mid}px`);
        if (root.scrollHeight <= root.clientHeight + 1) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      root.style.setProperty("--pitch-fs", `${lo}px`);
    };

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(fit);
    });
    ro.observe(root);
    // Card vizinho pode definir a altura depois do primeiro paint
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
      className={styles.vitrinePitch}
      aria-labelledby="vitrine-pitch-title"
    >
      <div className={styles.vitrinePitchInner}>
        <h2 id="vitrine-pitch-title" className={styles.vitrinePitchTitle}>
          {t("surface.auth.pitch.pro.title")}
        </h2>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.pro.p1")}</p>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.pro.p2")}</p>

        <h3 className={styles.vitrinePitchSubtitle}>{t("surface.auth.pitch.pro.subtitle")}</h3>
        <ul className={styles.vitrinePitchList}>
          <li>{t("surface.auth.pitch.pro.li1")}</li>
          <li>{t("surface.auth.pitch.pro.li2")}</li>
          <li>{t("surface.auth.pitch.pro.li3")}</li>
          <li>{t("surface.auth.pitch.pro.li4")}</li>
          <li>{t("surface.auth.pitch.pro.li5")}</li>
          <li>{t("surface.auth.pitch.pro.li6")}</li>
          <li>{t("surface.auth.pitch.pro.li7")}</li>
          <li>{t("surface.auth.pitch.pro.li8")}</li>
        </ul>

        <p className={styles.vitrinePitchHighlight}>{t("surface.auth.pitch.pro.highlight")}</p>
        <p className={styles.vitrinePitchText}>{t("surface.auth.pitch.pro.closing")}</p>
      </div>
    </section>
  );
}

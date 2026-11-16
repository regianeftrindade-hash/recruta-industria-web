"use client";

import Link from "next/link";
import { t } from "@/lib/i18n/translate";
import LogoRecruta from "@/app/components/LogoRecruta";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import styles from "./baixar-app.module.css";

export default function BaixarAppPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <LogoRecruta size="sm" as="h1" depth />
        <p className={styles.kicker}>{t("surface.page.installKicker")}</p>
        <h2 className={styles.title}>{t("surface.page.installTitle")}</h2>
        <p className={styles.text}>{t("surface.page.installLead")}</p>
        <InstallAppPrompt variant="banner" />
        <ol className={styles.steps}>
          <li>{t("surface.page.installAndroid")}</li>
          <li>{t("surface.page.installIphone")}</li>
          <li>{t("surface.page.installDesktop")}</li>
        </ol>
        <p className={styles.back}>
          <Link href="/">{t("surface.page.backHome")}</Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { t } from "@/lib/i18n/translate";
import { useInstallPrompt } from "./InstallPromptProvider";
import styles from "./InstallAppPrompt.module.css";

type Variant = "banner" | "footer" | "menu" | "inline";

type Props = {
  variant?: Variant;
  className?: string;
};

export default function InstallAppPrompt({ variant = "banner", className }: Props) {
  const { showPrompt, install, isIos, isInstalled } = useInstallPrompt();

  // Dashboard (menu): mostra enquanto não estiver instalado.
  // Banner/footer: só com prompt nativo ou iOS.
  const visible =
    variant === "inline" || variant === "menu" ? !isInstalled : showPrompt;
  if (!visible) return null;

  const handleClick = () => {
    void install();
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        className={`${styles.installBtnInline} ${className ?? ""}`}
        onClick={handleClick}
        title={isIos ? t("surface.pwa.titleIos") : t("surface.pwa.titleAndroid")}
        aria-label={t("surface.pwa.downloadShort")}
      >
        {t("surface.pwa.downloadShort")}
      </button>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`${styles.footerWrap} ${className ?? ""}`}>
        <p className={styles.footerText}>{t("surface.pwa.footer")}</p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          {t("surface.pwa.download")}
        </button>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className={`${styles.menuCard} ${className ?? ""}`}>
        <p className={styles.menuTitle}>{t("surface.pwa.menuTitle")}</p>
        <p className={styles.menuText}>
          {t("surface.pwa.menuBody")}
          {isIos ? ` ${t("surface.pwa.menuIos")}` : ""}
        </p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          {t("surface.pwa.download")}
        </button>
      </div>
    );
  }

  return (
    <section className={`${styles.banner} ${className ?? ""}`} aria-labelledby="install-app-title">
      <p className={styles.bannerKicker}>{t("surface.pwa.kicker")}</p>
      <h2 id="install-app-title" className={styles.bannerTitle}>
        {t("surface.pwa.headline")}
      </h2>
      <p className={styles.bannerText}>{t("surface.pwa.banner")}</p>
      <button type="button" className={styles.installBtn} onClick={handleClick}>
        {t("surface.pwa.download")}
      </button>
      <p className={styles.bannerHint}>
        {isIos ? t("surface.pwa.hintIos") : t("surface.pwa.hintAndroid")}
        {" "}
        <a href="/baixar-app" className={styles.guideLink}>
          {t("surface.pwa.guide")}
        </a>
      </p>
    </section>
  );
}

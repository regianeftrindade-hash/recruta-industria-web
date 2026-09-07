"use client";

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
        title={
          isIos
            ? "Instalar o Recruta no iPhone"
            : "Baixar o aplicativo Recruta no celular"
        }
        aria-label="Baixar aplicativo"
      >
        Baixar app
      </button>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`${styles.footerWrap} ${className ?? ""}`}>
        <p className={styles.footerText}>Tenha o Recruta Indústria sempre à mão no seu dispositivo.</p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          Baixar aplicativo
        </button>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className={`${styles.menuCard} ${className ?? ""}`}>
        <p className={styles.menuTitle}>Instalar aplicativo</p>
        <p className={styles.menuText}>
          Instala o Recruta na lista de aplicativos do celular, com ícone próprio.
          {isIos ? " No iPhone, a Apple instala pelo Safari até o app estar na App Store." : ""}
        </p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          Baixar aplicativo
        </button>
      </div>
    );
  }

  return (
    <section className={`${styles.banner} ${className ?? ""}`} aria-labelledby="install-app-title">
      <p className={styles.bannerKicker}>Instalar Recruta Indústria</p>
      <h2 id="install-app-title" className={styles.bannerTitle}>
        Tenha o Recruta Indústria sempre à mão
      </h2>
      <p className={styles.bannerText}>
        Instale o aplicativo e acesse seu perfil, mensagens e oportunidades com mais rapidez.
      </p>
      <button type="button" className={styles.installBtn} onClick={handleClick}>
        Baixar aplicativo
      </button>
      <p className={styles.bannerHint}>
        {isIos
          ? "No iPhone a Apple não deixa baixar um arquivo de app pelo site. O Recruta abre como aplicativo pelo Safari."
          : "No Android, o Chrome instala o Recruta na lista de aplicativos (não é atalho)."}
      </p>
    </section>
  );
}

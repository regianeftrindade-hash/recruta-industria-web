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
            ? "Toque em Compartilhar e depois em Adicionar à Tela de Início"
            : "Instalar aplicativo"
        }
        aria-label="Instalar aplicativo"
      >
        Instalar app
      </button>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`${styles.footerWrap} ${className ?? ""}`}>
        <p className={styles.footerText}>Tenha o Recruta Indústria sempre à mão no seu dispositivo.</p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          Instalar aplicativo
        </button>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <div className={`${styles.menuCard} ${className ?? ""}`}>
        <p className={styles.menuTitle}>Instalar aplicativo</p>
        <p className={styles.menuText}>
          Acesse perfil, mensagens e oportunidades com mais rapidez.
          {isIos ? " No iPhone, use Compartilhar → Adicionar à Tela de Início." : ""}
        </p>
        <button type="button" className={`${styles.installBtn} ${styles.installBtnCompact}`} onClick={handleClick}>
          Instalar aplicativo
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
        Instalar aplicativo
      </button>
      <p className={styles.bannerHint}>
        {isIos
          ? "No iPhone ou iPad: toque em Compartilhar e depois em Adicionar à Tela de Início."
          : "No Android ou Chrome, use o prompt de instalação. No computador, instale como programa."}
      </p>
    </section>
  );
}

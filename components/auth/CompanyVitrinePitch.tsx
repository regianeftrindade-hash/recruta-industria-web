"use client";

import React, { useLayoutEffect, useRef } from "react";
import styles from "@/app/login/login.module.css";

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
          🏭 Encontre profissionais industriais na Vitrine
        </h2>
        <p className={styles.vitrinePitchText}>
          No <strong>Recruta Indústria</strong>, sua empresa não precisa depender só de
          anúncios e currículos soltos. Você acessa a{" "}
          <strong>Vitrine de profissionais</strong>, filtra por perfil industrial e
          encontra talentos alinhados à sua operação.
        </p>
        <p className={styles.vitrinePitchText}>
          A plataforma foi pensada para aproximar{" "}
          <strong>empresas e profissionais de forma mais direta</strong>, da busca ao
          contato, propostas e entrevistas — tudo em um só lugar.
        </p>

        <h3 className={styles.vitrinePitchSubtitle}>⭐ Tudo em um só lugar</h3>
        <ul className={styles.vitrinePitchList}>
          <li>
            <strong>Busca com filtros:</strong> localização, cargo, experiência,
            escolaridade e mais.
          </li>
          <li>
            <strong>Perfis completos:</strong> formação, cursos, habilidades e vídeo de
            apresentação.
          </li>
          <li>
            <strong>Contato direto:</strong> converse com profissionais pela própria
            plataforma.
          </li>
          <li>
            <strong>Propostas:</strong> envie propostas alinhadas à sua necessidade.
          </li>
          <li>
            <strong>Entrevistas online:</strong> agende e realize entrevistas sem outros
            apps.
          </li>
          <li>
            <strong>Dicas ao profissional:</strong> oriente o perfil com feedbacks
            objetivos.
          </li>
          <li>
            <strong>Histórico de recrutamento:</strong> acompanhe o funil na operação.
          </li>
          <li>
            <strong>Verificação da empresa:</strong> segurança para liberar contatos e
            dados sensíveis.
          </li>
        </ul>

        <p className={styles.vitrinePitchHighlight}>
          ✨ Complete o cadastro e a verificação para visualizar os perfis.
        </p>
        <p className={styles.vitrinePitchText}>
          Crie a conta da sua empresa, finalize o cadastro e, após a verificação, acesse
          a vitrine para encontrar profissionais industriais com o perfil que você
          precisa.
        </p>
      </div>
    </section>
  );
}

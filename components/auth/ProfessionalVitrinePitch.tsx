import React from "react";
import styles from "@/app/login/login.module.css";

/** Texto de vitrine na login/cadastro do profissional. */
export default function ProfessionalVitrinePitch() {
  return (
    <section className={styles.vitrinePitch} aria-labelledby="vitrine-pitch-title">
      <h2 id="vitrine-pitch-title" className={styles.vitrinePitchTitle}>
        Sua experiência em uma vitrine profissional
      </h2>
      <p className={styles.vitrinePitchText}>
        Crie sua <strong>vitrine profissional gratuitamente</strong> e apresente sua
        experiência, formação e habilidades para empresas que procuram profissionais.
      </p>
      <p className={styles.vitrinePitchText}>
        Complete seu perfil, destaque seus conhecimentos e deixe seu currículo
        disponível para novas oportunidades.
      </p>
      <p className={styles.vitrinePitchHighlight}>
        Você cria seu perfil. As empresas encontram você.
      </p>
    </section>
  );
}

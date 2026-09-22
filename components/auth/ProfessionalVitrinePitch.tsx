import React from "react";
import styles from "@/app/login/login.module.css";

/** Texto de vitrine na login/cadastro do profissional. */
export default function ProfessionalVitrinePitch() {
  return (
    <section className={styles.vitrinePitch} aria-labelledby="vitrine-pitch-title">
      <h2 id="vitrine-pitch-title" className={styles.vitrinePitchTitle}>
        🚀 Transforme seu perfil em uma Vitrine Profissional
      </h2>
      <p className={styles.vitrinePitchText}>
        No Recruta Indústria, seu perfil não fica perdido entre centenas de currículos.
        Você cria sua <strong>Vitrine Profissional</strong>, apresenta sua experiência,
        habilidades e qualificações e fica disponível para empresas que procuram
        profissionais como você.
      </p>
      <p className={styles.vitrinePitchText}>
        <strong>É gratuito para profissionais.</strong> Você pode criar seu perfil,
        preencher suas informações, adicionar experiências, cursos, qualificações e até
        um vídeo de apresentação para mostrar quem você é profissionalmente.
      </p>
      <p className={styles.vitrinePitchHighlight}>
        🔎 As empresas procuram. Você é encontrado.
      </p>
      <p className={styles.vitrinePitchText}>
        Em vez de depender apenas de enviar currículos para vagas, no Recruta Indústria
        as empresas também podem encontrar profissionais diretamente pela nossa
        plataforma, utilizando filtros de acordo com suas necessidades.
      </p>
      <p className={styles.vitrinePitchText}>
        Quanto mais completo estiver o seu perfil, mais informações a empresa terá para
        conhecer seu perfil profissional.
      </p>
      <p className={styles.vitrinePitchHighlight}>
        Crie sua Vitrine Profissional gratuitamente e deixe seu perfil trabalhar por você.
      </p>
      <p className={styles.vitrinePitchCta}>
        👉 Cadastre-se com o Google e comece agora.
      </p>
    </section>
  );
}

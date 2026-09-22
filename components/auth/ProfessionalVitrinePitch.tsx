import React from "react";
import styles from "@/app/login/login.module.css";

/** Texto de vitrine na login/cadastro do profissional. */
export default function ProfessionalVitrinePitch() {
  return (
    <section className={styles.vitrinePitch} aria-labelledby="vitrine-pitch-title">
      <h2 id="vitrine-pitch-title" className={styles.vitrinePitchTitle}>
        🚀 Sua experiência pode ser encontrada pelas empresas
      </h2>
      <p className={styles.vitrinePitchText}>
        No <strong>Recruta Indústria</strong>, você não precisa ficar procurando
        oportunidades e enviando currículo para cada empresa. Você cria sua{" "}
        <strong>Vitrine Profissional</strong> e fica disponível para empresas que
        procuram profissionais com o seu perfil.
      </p>
      <p className={styles.vitrinePitchText}>
        Diferente de uma plataforma comum de empregos, o Recruta Indústria foi pensado
        para aproximar <strong>profissionais e empresas de forma mais direta</strong>,
        desde a apresentação do perfil até o contato e o processo de seleção.
      </p>

      <h3 className={styles.vitrinePitchSubtitle}>⭐ Tudo em um só lugar</h3>
      <ul className={styles.vitrinePitchList}>
        <li>
          <strong>Cadastro completo:</strong> apresente sua experiência, formação,
          cursos, habilidades e qualificações.
        </li>
        <li>
          <strong>Vídeo de apresentação:</strong> mostre quem você é e destaque sua
          experiência profissional.
        </li>
        <li>
          <strong>Busca por empresas:</strong> seu perfil pode ser encontrado por
          empresas através de filtros profissionais.
        </li>
        <li>
          <strong>Contato direto:</strong> converse com empresas interessadas no seu
          perfil pela própria plataforma.
        </li>
        <li>
          <strong>Entrevistas online:</strong> participe de entrevistas sem precisar
          baixar outros aplicativos.
        </li>
        <li>
          <strong>Agendamento de entrevistas:</strong> receba e organize convites para
          entrevistas diretamente pela plataforma.
        </li>
        <li>
          <strong>Propostas profissionais:</strong> receba propostas de empresas
          interessadas no seu perfil.
        </li>
        <li>
          <strong>Dicas das empresas:</strong> receba informações e orientações sobre
          seu perfil profissional.
        </li>
      </ul>

      <p className={styles.vitrinePitchHighlight}>
        ✨ E para o profissional, é gratuito.
      </p>
      <p className={styles.vitrinePitchText}>
        Crie sua <strong>Vitrine Profissional</strong> e tenha em um só lugar as
        ferramentas para apresentar sua experiência, ser encontrado por empresas e
        acompanhar novas oportunidades de contato profissional.
      </p>
    </section>
  );
}

import React from "react";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
import HomeAccessForm from "@/app/components/HomeAccessForm";
import { FONT_STACK } from "@/lib/theme";
import styles from "./home.module.css";

const taglineFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export default function Home() {
  return (
    <main className={`${styles.homePage} ${styles.homePageFlow}`} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />

      <div className={styles.homeShell}>
        <div className={styles.empresaEntry}>
          <HomeAccessForm role="company" registerHref="/company/cadastro" compact />
        </div>

        <header className={styles.hero}>
          <div className={styles.logoHero}>
            <LogoRecruta size="hero" depth as="h1" />
          </div>

          <div className={styles.heroLineRow}>
            <span className={styles.heroLineSegment} aria-hidden />
            <span className={`${styles.heroTaglineStar} ${taglineFont.className}`} aria-hidden>
              ★
            </span>
            <p className={`${styles.heroTagline} ${taglineFont.className}`}>
              A indústria evolui. O recrutamento também.
            </p>
            <span className={`${styles.heroTaglineStar} ${taglineFont.className}`} aria-hidden>
              ★
            </span>
            <span className={styles.heroLineSegment} aria-hidden />
          </div>
        </header>

        <section className={`${styles.actionCards} ${styles.proCardWrap}`} aria-label="Acesso profissional">
          <article className={`${styles.actionCard} ${styles.actionCardSide} ${styles.proHomeCard}`}>
            <div className={styles.cardImageWrap}>
              <Image
                src="/profissional.jpg"
                alt="Profissional da indústria com capacete de proteção"
                fill
                sizes="(max-width: 768px) 92vw, 380px"
                quality={65}
                priority
                className={styles.cardImage}
              />
            </div>
            <div className={styles.cardSideBody}>
              <div className={styles.proCopy}>
                <h2 className={styles.proLeadTitle}>Pare de correr atrás de vagas.</h2>
                <h3 className={styles.proLeadSubtitle}>Deixe as empresas encontrarem você.</h3>
                <p>
                  Crie seu perfil profissional gratuitamente e fique disponível para empresas que
                  procuram profissionais com a sua experiência.
                </p>
                <p className={styles.proHighlight}>Seu perfil. Sua experiência. Novas oportunidades.</p>

                <h3 className={styles.proSectionTitle}>Como funciona?</h3>
                <ol className={styles.proSteps}>
                  <li>
                    <strong>Crie seu perfil</strong> — Cadastre experiências, formação, cursos e
                    habilidades.
                  </li>
                  <li>
                    <strong>Complete suas informações</strong> — Quanto mais completo, mais a empresa
                    conhece você.
                  </li>
                  <li>
                    <strong>Seja encontrado</strong> — Empresas pesquisam conforme suas necessidades.
                  </li>
                  <li>
                    <strong>Conecte-se</strong> — Com interesse, a empresa entra em contato pela
                    plataforma.
                  </li>
                </ol>

                <p>
                  Chega de preencher o mesmo cadastro várias vezes. No Recruta Indústria, você cria seu
                  perfil uma vez e mantém suas informações atualizadas.
                </p>
                <p className={styles.proHighlight}>Deixe seu currículo trabalhar por você.</p>
              </div>

              <HomeAccessForm role="professional" registerHref="/professional/register" />
            </div>
          </article>
        </section>

        <div className={styles.homeBottom}>
          <div className={styles.homeContactsWrap}>
            <div className={styles.homeContacts}>
              <a href="mailto:contato@recrutaindustria.com" className={styles.homeContactLink}>
                contato@recrutaindustria.com
              </a>
              <span className={styles.homeContactSep} aria-hidden>
                /
              </span>
              <a href="mailto:suporte@recrutaindustria.com" className={styles.homeContactLink}>
                suporte@recrutaindustria.com
              </a>
            </div>
            <div className={styles.homeContactLine} aria-hidden />
          </div>

          <footer className={styles.footer} suppressHydrationWarning>
            <p className={styles.footerTrust}>
              Dados protegidos com criptografia, controle de acesso e auditoria contínua.
            </p>
            <p className={styles.footerCopy} suppressHydrationWarning>
              © {new Date().getFullYear()} Recruta Indústria · Todos os direitos reservados
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

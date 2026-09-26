import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
import { FONT_STACK } from "@/lib/theme";
import styles from "../home.module.css";

const taglineFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Para empresas",
  description:
    "Encontre profissionais da indústria de acordo com o perfil, experiência, localização e formação que sua empresa procura.",
};

export default function HomeEmpresa() {
  return (
    <main className={`${styles.homePage} ${styles.homePageFlow}`} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />

      <div className={styles.homeShell}>
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

        <section className={`${styles.actionCards} ${styles.proCardWrap}`} aria-label="Acesso para empresas">
          <article className={`${styles.actionCard} ${styles.actionCardSide}`}>
            <div className={styles.cardImageWrap}>
              <Image
                src="/empresa.jpg"
                alt="Ambiente industrial e equipe de produção"
                fill
                sizes="(max-width: 768px) 92vw, 380px"
                quality={65}
                priority
                className={`${styles.cardImage} ${styles.cardImageEmpresa}`}
              />
            </div>

            <div className={styles.cardSideBody}>
              <div className={styles.proCopy}>
                <h2>Encontre o profissional que sua empresa precisa.</h2>
                <h3>Não espere apenas os currículos chegarem.</h3>
                <p>
                  No Recruta Indústria, sua empresa pode pesquisar profissionais de acordo com os
                  critérios que precisa para cada contratação.
                </p>
                <p className={styles.proHighlight}>Você procura. Encontra. Analisa. Conecta.</p>

                <h3 className={styles.proSectionTitle}>Como funciona?</h3>
                <ol className={styles.proSteps}>
                  <li>
                    <strong>Cadastre sua empresa</strong> — Crie sua conta e configure o perfil
                    empresarial.
                  </li>
                  <li>
                    <strong>Defina o que procura</strong> — Filtros por experiência, função, formação,
                    localização e mais.
                  </li>
                  <li>
                    <strong>Analise os perfis</strong> — Conheça trajetória e qualificações dos
                    profissionais.
                  </li>
                  <li>
                    <strong>Entre em contato</strong> — Use os recursos de contato do seu plano.
                  </li>
                </ol>

                <h3 className={styles.proSectionTitle}>Por que usar o Recruta Indústria?</h3>
                <ul className={styles.proReasons}>
                  <li>
                    <strong>Busca ativa</strong> — Procure mesmo quem não está se candidatando.
                  </li>
                  <li>
                    <strong>Perfis completos</strong> — Mais informações antes do contato.
                  </li>
                  <li>
                    <strong>Mais agilidade</strong> — Menos tempo procurando candidatos.
                  </li>
                  <li>
                    <strong>Busca direcionada</strong> — Encontre conforme a necessidade da empresa.
                  </li>
                </ul>

                <h3 className={styles.proSectionTitle}>Publique ou pesquise.</h3>
                <p>
                  Você pode divulgar suas oportunidades ou ir diretamente em busca dos profissionais que
                  sua empresa precisa.
                </p>
              </div>

              <Link href="/company/register" className={styles.cardCta}>
                Cadastrar minha empresa
              </Link>

              <p className={styles.proBrand}>Recruta Indústria</p>
              <p className={styles.proClose}>Sua empresa procurando. Profissionais disponíveis.</p>
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
              <span className={styles.homeContactSep} aria-hidden>
                /
              </span>
              <Link href="/" className={styles.homeContactLink}>
                Para profissionais →
              </Link>
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

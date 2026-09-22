import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
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
    <main className={styles.homePage} style={{ fontFamily: FONT_STACK }}>
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

        <section className={styles.actionCards} aria-label="Escolha seu acesso">
          {[
            {
              href: "/login?tipo=profissional",
              title: "Sou Profissional",
              img: "/profissional.jpg",
              text: "Cadastre seu perfil, currículo e experiência para vagas reais na indústria.",
              cta: "Acessar",
              alt: "Profissional da indústria com capacete de proteção",
              priority: true,
            },
            {
              href: "/login?tipo=empresa",
              title: "Sou Empresa",
              img: "/empresa.jpg",
              text: "Encontre soldadores, operadores CNC e talentos de chão de fábrica para sua operação.",
              cta: "Acessar",
              alt: "Ambiente industrial e equipe de produção",
              priority: false,
            },
          ].map((c) => (
            <Link key={c.href} href={c.href} className={styles.actionCard}>
              <div className={styles.cardImageWrap}>
                <Image
                  src={c.img}
                  alt={c.alt}
                  fill
                  sizes="(max-width: 900px) 92vw, 400px"
                  quality={65}
                  priority={c.priority}
                  className={
                    c.href.includes("empresa")
                      ? `${styles.cardImage} ${styles.cardImageEmpresa}`
                      : styles.cardImage
                  }
                />
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>{c.title}</h2>
                <p className={styles.cardText}>{c.text}</p>
                <span className={styles.cardCta}>{c.cta}</span>
              </div>
            </Link>
          ))}
        </section>

        <div className={styles.homeBottom}>
          <section className={styles.aboutBlock} aria-labelledby="home-about-title">
            <h2 id="home-about-title" className={styles.aboutTitle}>
              Encontre profissionais. Encontre oportunidades.
            </h2>
            <div className={styles.aboutCardBody}>
              <p className={styles.aboutText}>
                O <strong>Recruta Indústria</strong> conecta empresas e profissionais de forma
                mais direta, permitindo que empresas encontrem profissionais de acordo com suas
                necessidades e que profissionais apresentem sua experiência por meio de uma{" "}
                <strong>Vitrine Profissional</strong>.
              </p>
              <p className={styles.aboutText}>
                Mais do que um currículo, seu perfil reúne suas experiências, formação, cursos,
                habilidades e qualificações em um só lugar.
              </p>
              <p className={styles.aboutText}>
                Para as empresas, uma plataforma para{" "}
                <strong>buscar, conhecer, selecionar e entrar em contato com profissionais</strong>,
                além de conduzir entrevistas, enviar propostas e trabalhar em equipe durante o
                processo.
              </p>
              <p className={styles.aboutText}>
                Para os profissionais, uma forma de{" "}
                <strong>dar visibilidade à sua experiência e ser encontrado por empresas</strong>,
                com ferramentas para contato, entrevistas e propostas dentro da própria plataforma.
              </p>
              <p className={styles.aboutHighlight}>
                Recruta Indústria. Aproximando quem procura profissionais de quem está pronto para
                novas oportunidades.
              </p>
            </div>
          </section>

          <section className={styles.bannerSection}>
            <div className={styles.bannerSideLeft} aria-hidden />
            <div className={styles.bannerTextColumn}>
              <p className={styles.bannerTextSubtitle}>
                Mais do que recrutamento. Conexões que geram resultados na indústria.
              </p>
            </div>
            <div className={styles.bannerSideRight} aria-hidden />
          </section>

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

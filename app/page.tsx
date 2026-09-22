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
              eyebrow: "Para profissionais",
              title: "Crie sua Vitrine Profissional",
              img: "/profissional.jpg",
              text: "Cadastre gratuitamente seu perfil, apresente sua experiência, formação e habilidades e fique disponível para empresas que buscam profissionais para suas equipes.",
              cta: "Sou Profissional",
              alt: "Profissional da indústria com capacete de proteção",
              priority: true,
            },
            {
              href: "/login?tipo=empresa",
              eyebrow: "Para empresas",
              title: "Encontre profissionais para sua equipe",
              img: "/empresa.jpg",
              text: "Cadastre sua empresa e encontre profissionais de acordo com o perfil que sua indústria precisa. Consulte experiências, qualificações e informações profissionais para facilitar sua busca.",
              cta: "Sou Empresa",
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
                <p className={styles.cardEyebrow}>{c.eyebrow}</p>
                <h2 className={styles.cardTitle}>{c.title}</h2>
                <p className={styles.cardText}>{c.text}</p>
                <span className={styles.cardCta}>{c.cta}</span>
              </div>
            </Link>
          ))}
        </section>

        <div className={styles.homeBottom}>
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

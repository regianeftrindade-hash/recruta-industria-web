"use client";

/* Home — polimento visual autorizado pelo usuário (07/09/2026). Ver .cursor/rules/home-page-lock.mdc */

import React from "react";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
import { FONT_STACK } from "@/lib/theme";
import styles from "./home.module.css";

const taglineFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export default function Home() {
  return (
    <main className={styles.homePage} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />

      <div className={styles.homeShell}>
        <header className={styles.hero}>
          <div className={styles.logoHero}>
            <LogoRecruta size="hero" depth />
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
              loginHref: "/login?tipo=profissional",
              registerHref: "/professional/register",
              title: "Sou Profissional",
              img: "/profissional.jpg",
              text: "Cadastre seu perfil e encontre oportunidades na indústria.",
              loginCta: "Entrar",
              registerCta: "Criar cadastro",
              imageClass: styles.cardImage,
            },
            {
              loginHref: "/login?tipo=empresa",
              registerHref: "/company/register",
              title: "Sou Empresa",
              img: "/empresa.jpg",
              text: "Encontre profissionais qualificados para sua operação.",
              loginCta: "Entrar",
              registerCta: "Criar cadastro",
              imageClass: `${styles.cardImage} ${styles.cardImageEmpresa}`,
            },
          ].map((c) => (
            <article key={c.loginHref} className={styles.actionCard}>
              <Link href={c.loginHref} className={styles.cardMainLink}>
                <div className={styles.cardImageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt=""
                    className={c.imageClass}
                    decoding="async"
                  />
                </div>
                <div className={styles.cardContent}>
                  <h2 className={styles.cardTitle}>{c.title}</h2>
                  <p className={styles.cardText}>{c.text}</p>
                  <span className={styles.cardCta}>{c.loginCta}</span>
                </div>
              </Link>
              <Link href={c.registerHref} className={styles.cardRegisterLink}>
                {c.registerCta}
              </Link>
            </article>
          ))}
        </section>

        <div className={styles.homeBottom}>
          <section className={styles.bannerSection}>
            <div className={styles.bannerSideLeft} aria-hidden />
            <div className={styles.bannerTextColumn}>
              <p className={styles.bannerTextSubtitle}>
                Mais do que recrutamento. Conexões que geram resultados.
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
              Dados protegidos com criptografia, controle de acesso e auditoria.
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

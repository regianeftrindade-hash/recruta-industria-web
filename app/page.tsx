"use client";

/* 🔒 PÁGINA INICIAL BLOQUEADA (06/07/2026) — não editar sem pedido explícito do usuário (ver .cursor/rules/home-page-lock.mdc) */

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

const COLORS = {
    preto: "#3A3A3A",
    cardBg: "#2B2B2B",
    dourado: "#C89B3C",
    douradoEscuro: "#8D6B1F",
    branco: "#F2F2F2",
    textoSuave: "#F2F2F2",
};

const securityModules = [
    "SHA-256",
    "CPF/CNPJ",
    "Rate Limiting",
    "Auditoria",
    "Sanitização XSS",
    "Força de Senha",
    "Headers Seguros",
    "Bloqueio de Conta",
    "Login Suspeito",
    "Timeout de Sessão",
    "Token E-mail",
    "Math CAPTCHA",
    "Bloqueio de IP",
    "Log de Atividades",
];

const screenSmooth: React.CSSProperties = {
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "auto",
    letterSpacing: "normal",
};

export default function Home() {
    return (
        <main
            className={styles.homePage}
            style={{
                background: COLORS.preto,
                display: "flex",
                flexDirection: "column",
                color: COLORS.branco,
                fontFamily: FONT_STACK,
                ...screenSmooth,
            }}
        >
            <div className={styles.homeTop}>
            <section className={styles.logoSection}>
                <div className={styles.logoCard}>
                    <div className={styles.logoHero}>
                        <LogoRecruta size="hero" depth />
                    </div>

                    <div className={styles.heroLineRow}>
                        <span className={styles.heroLineSegment} aria-hidden />
                        <span className={`${styles.heroTaglineStar} ${taglineFont.className}`} aria-hidden>
                            ★
                        </span>
                        <p
                            className={`${styles.heroTagline} ${taglineFont.className}`}
                            style={screenSmooth}
                        >
                            A indústria evolui. O recrutamento também.
                        </p>
                        <span className={`${styles.heroTaglineStar} ${taglineFont.className}`} aria-hidden>
                            ★
                        </span>
                        <span className={styles.heroLineSegment} aria-hidden />
                    </div>
                </div>
            </section>

            <section className={styles.actionCards}>
                {[
                    {
                        href: "/login?tipo=profissional",
                        title: "Sou Profissional",
                        img: "/profissional.jpg",
                        text: "Cadastre seu perfil e encontre oportunidades na indústria.",
                        cta: "Acessar Cadastro",
                    },
                    {
                        href: "/login?tipo=empresa",
                        title: "Sou Empresa",
                        img: "/empresa.jpg",
                        text: "Encontre profissionais qualificados para sua operação.",
                        cta: "Contratar Talentos",
                    },
                ].map((c) => (
                    <Link
                        key={c.href}
                        href={c.href}
                        style={{
                            background: COLORS.cardBg,
                            border: `1px solid ${COLORS.dourado}`,
                            flex: "1 1 0",
                            maxWidth: 440,
                            minWidth: 0,
                            minHeight: "clamp(248px, 30vh, 310px)",
                            height: "auto",
                            display: "flex",
                            flexDirection: "column",
                            textDecoration: "none",
                            color: COLORS.branco,
                            padding: 8,
                            borderRadius: 10,
                            boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
                        }}
                    >
                        <div className={styles.cardImageWrap}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={c.img}
                                alt=""
                                className={
                                    c.href.includes("empresa")
                                        ? `${styles.cardImage} ${styles.cardImageEmpresa}`
                                        : styles.cardImage
                                }
                                decoding="async"
                            />
                        </div>
                        <div className={styles.cardContent}>
                            <h2
                                style={{
                                    fontFamily: FONT_STACK,
                                    fontSize: "clamp(0.95rem, 1.45vw, 1.22rem)",
                                    color: COLORS.dourado,
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    margin: 0,
                                    ...screenSmooth,
                                }}
                            >
                                {c.title}
                            </h2>
                            <p
                                style={{
                                    fontSize: "clamp(0.78rem, 1vw, 0.92rem)",
                                    color: COLORS.textoSuave,
                                    lineHeight: 1.4,
                                    textAlign: "center",
                                    maxWidth: 400,
                                    ...screenSmooth,
                                }}
                            >
                                {c.text}
                            </p>
                            <span className={`${styles.cardCta} ${styles.cardCtaText}`} style={screenSmooth}>
                                {c.cta}
                            </span>
                        </div>
                    </Link>
                ))}
            </section>
            </div>

            <div className={styles.homeBottom}>
            {/* Banner Portal — fotos laterais até as linhas verticais do texto */}
            <section
                className={styles.bannerSection}
                style={{
                    borderTop: `1px solid ${COLORS.douradoEscuro}`,
                    borderBottom: `1px solid ${COLORS.douradoEscuro}`,
                }}
            >
                <div className={styles.bannerSideLeft} aria-hidden />
                <div className={styles.bannerTextColumn}>
                    <div className={`${styles.bannerTextVLine} ${styles.bannerTextVLineLeft}`} aria-hidden />
                    <p
                        className={styles.bannerTextSubtitle}
                        style={{ fontFamily: FONT_STACK, ...screenSmooth }}
                    >
                        Mais do que recrutamento. Conexões que geram resultados.
                    </p>
                    <div className={`${styles.bannerTextVLine} ${styles.bannerTextVLineRight}`} aria-hidden />
                </div>
                <div className={styles.bannerSideRight} aria-hidden />
            </section>

            <div className={styles.homeContactsWrap}>
                <div className={styles.homeContactsRow}>
                    <div className={styles.homeContacts} style={screenSmooth}>
                        <a href="mailto:contato@recrutaindustria.com" className={styles.homeContactLink}>
                            contato@recrutaindustria.com
                        </a>
                        <span className={styles.homeContactSep} aria-hidden>/</span>
                        <a href="mailto:suporte@recrutaindustria.com" className={styles.homeContactLink}>
                            suporte@recrutaindustria.com
                        </a>
                    </div>
                </div>
                <div className={styles.homeContactLine} aria-hidden />
            </div>

            <footer
                suppressHydrationWarning
                style={{
                    background: COLORS.cardBg,
                    padding: "10px 20px 4px",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 4,
                        width: "100%",
                        maxWidth: 1400,
                        overflowX: "auto",
                        paddingBottom: 2,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            color: COLORS.dourado,
                            fontFamily: FONT_STACK,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            marginRight: 4,
                            flexShrink: 0,
                            ...screenSmooth,
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.dourado} aria-hidden>
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                        </svg>
                        Segurança
                    </span>
                    {securityModules.map((mod) => (
                        <span key={mod} className={styles.footerTag} style={screenSmooth}>
                            {mod}
                        </span>
                    ))}
                </div>

                <div
                    style={{
                        textAlign: "center",
                        color: "#F2F2F2",
                        fontSize: "0.62rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                        ...screenSmooth,
                    }}
                >
                    <span>© {new Date().getFullYear()} Recruta Indústria · Todos os direitos reservados</span>
                </div>
            </footer>
            </div>
        </main>
    );
}

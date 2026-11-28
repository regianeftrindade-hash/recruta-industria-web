import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
import HomeAuthProvider from "@/app/components/HomeAuthProvider";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { resolveInterfaceLocale } from "@/lib/i18n/resolve-interface-locale";
import { t } from "@/lib/i18n/translate";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { FONT_STACK } from "@/lib/theme";
import styles from "./home.module.css";
import commercial from "./home-commercial.module.css";

const taglineFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

function DiffIcon({ name }: { name: "industrial" | "profiles" | "connect" | "languages" | "international" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "industrial":
      return (
        <svg {...common}>
          <path d="M4 20V10l4 2V8l4 2V6l4 2v12" />
          <path d="M2 20h20" />
          <path d="M9 14h.01M13 16h.01M17 14h.01" />
        </svg>
      );
    case "profiles":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-2.8 2.7-5 6-5s6 2.2 6 5" />
          <circle cx="17" cy="9" r="2.2" />
          <path d="M15.5 19c.3-1.7 1.6-3 3.5-3.4" />
        </svg>
      );
    case "connect":
      return (
        <svg {...common}>
          <circle cx="7" cy="12" r="2.5" />
          <circle cx="17" cy="7" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
          <path d="M9.3 11.2 14.6 8.2M9.3 12.8l5.3 3" />
        </svg>
      );
    case "languages":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
        </svg>
      );
    case "international":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M2.5 9.5h19M2.5 14.5h19" />
          <path d="M12 3c2.2 2.4 3.5 5.4 3.5 9s-1.3 6.6-3.5 9c-2.2-2.4-3.5-5.4-3.5-9S9.8 5.4 12 3z" />
        </svg>
      );
    default:
      return null;
  }
}

export default async function Home() {
  const locale = await resolveInterfaceLocale();
  const text = (key: MessageKey) => t(key, locale);

  const diffs = [
    { key: "surface.home.diffIndustrial" as const, icon: "industrial" as const },
    { key: "surface.home.diffProfiles" as const, icon: "profiles" as const },
    { key: "surface.home.diffConnect" as const, icon: "connect" as const },
    { key: "surface.home.diffLanguages" as const, icon: "languages" as const },
    { key: "surface.home.diffInternational" as const, icon: "international" as const },
  ];

  return (
    <main className={`${styles.homePage} ${styles.homePageFlow}`} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />

      <HomeAuthProvider>
        <div className={styles.homeShell}>
          <div className={styles.localeSlot}>
            <LanguageSwitch current={locale} />
          </div>

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
                {text("surface.home.tagline")}
              </p>
              <span className={`${styles.heroTaglineStar} ${taglineFont.className}`} aria-hidden>
                ★
              </span>
              <span className={styles.heroLineSegment} aria-hidden />
            </div>
          </header>

          <section className={commercial.homeHeroVisual} aria-labelledby="home-pitch-title">
            <div className={commercial.homeHeroMedia}>
              <Image
                src="/profissional-equipe.jpg"
                alt={text("surface.home.photoAlt")}
                fill
                priority
                sizes="(max-width: 840px) 100vw, 52rem"
                quality={75}
              />
            </div>
            <div className={commercial.homeHeroScrim} aria-hidden />
            <div className={commercial.homeHeroContent}>
              <h1 id="home-pitch-title" className={commercial.homePitchTitle}>
                {text("surface.home.pitchTitle")}
              </h1>
              <p className={commercial.homePitchSubtitle}>{text("surface.home.pitchSubtitle")}</p>
            </div>
          </section>

          <section className={commercial.homePaths} aria-label={text("surface.home.pathsLabel")}>
            <article className={commercial.homePathCard}>
              <div className={commercial.homePathMedia}>
                <Image
                  src="/profissional.webp"
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 22rem"
                  quality={70}
                />
                <div className={commercial.homePathMediaScrim} aria-hidden />
              </div>
              <h2 className={commercial.homePathTitle}>{text("surface.home.pathProfessionalTitle")}</h2>
              <p className={commercial.homePathBody}>{text("surface.home.pathProfessionalBody")}</p>
              <Link
                href="/login?tipo=profissional"
                className={commercial.homePathCta}
                prefetch={false}
              >
                {text("surface.home.pathAccess")}
              </Link>
            </article>

            <article className={commercial.homePathCard}>
              <div className={commercial.homePathMedia}>
                <Image
                  src="/empresa.webp"
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 22rem"
                  quality={70}
                />
                <div className={commercial.homePathMediaScrim} aria-hidden />
              </div>
              <h2 className={commercial.homePathTitle}>{text("surface.home.pathCompanyTitle")}</h2>
              <p className={commercial.homePathBody}>{text("surface.home.pathCompanyBody")}</p>
              <Link href="/login?tipo=empresa" className={commercial.homePathCta} prefetch={false}>
                {text("surface.home.pathAccess")}
              </Link>
            </article>
          </section>

          <section className={commercial.homeDiffs} aria-label={text("surface.home.diffsLabel")}>
            <ul className={commercial.homeDiffList}>
              {diffs.map((item) => (
                <li key={item.key} className={commercial.homeDiffItem}>
                  <span className={commercial.homeDiffIcon}>
                    <DiffIcon name={item.icon} />
                  </span>
                  <span>{text(item.key)}</span>
                </li>
              ))}
            </ul>
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
              <p className={styles.footerTrust}>{text("surface.home.trust")}</p>
              <p className={styles.footerCopy} suppressHydrationWarning>
                © {new Date().getFullYear()} Recruta Indústria · {text("surface.home.rights")}
              </p>
              <p className={styles.footerPrivacy}>
                <Link href="/termos/uso" className="footer-privacy-link">
                  {text("surface.home.termsOfUse")}
                </Link>
                {" · "}
                <Link href="/termos/privacidade" className="footer-privacy-link">
                  {text("surface.home.privacy")}
                </Link>
                {" · "}
                <Link href="/termos/lgpd" className="footer-privacy-link">
                  LGPD
                </Link>
              </p>
              <style>{`.footer-privacy-link{color:#414141!important;font-size:0.58rem!important;font-weight:400!important;letter-spacing:0.01em!important;text-decoration:none!important}.footer-privacy-link:hover{color:#414141!important;text-decoration:underline!important}`}</style>
            </footer>
          </div>
        </div>
      </HomeAuthProvider>
    </main>
  );
}

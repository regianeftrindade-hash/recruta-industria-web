import React from "react";
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

const taglineFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export default async function Home() {
  const locale = await resolveInterfaceLocale();
  const text = (key: MessageKey) => t(key, locale);

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

          <section className={styles.homePitch} aria-labelledby="home-pitch-title">
            <h1 id="home-pitch-title" className={styles.homePitchTitle}>
              {text("surface.home.pitchTitle")}
            </h1>
            <p className={styles.homePitchSubtitle}>{text("surface.home.pitchSubtitle")}</p>
          </section>

          <section className={styles.homePaths} aria-label={text("surface.home.pathsLabel")}>
            <article className={styles.homePathCard}>
              <h2 className={styles.homePathTitle}>{text("surface.home.pathProfessionalTitle")}</h2>
              <p className={styles.homePathBody}>{text("surface.home.pathProfessionalBody")}</p>
              <Link
                href="/login?tipo=profissional"
                className={styles.homePathCta}
                prefetch={false}
              >
                {text("surface.home.pathAccess")}
              </Link>
            </article>

            <article className={styles.homePathCard}>
              <h2 className={styles.homePathTitle}>{text("surface.home.pathCompanyTitle")}</h2>
              <p className={styles.homePathBody}>{text("surface.home.pathCompanyBody")}</p>
              <Link href="/login?tipo=empresa" className={styles.homePathCta} prefetch={false}>
                {text("surface.home.pathAccess")}
              </Link>
            </article>
          </section>

          <section className={styles.homeDiffs} aria-label={text("surface.home.diffsLabel")}>
            <ul className={styles.homeDiffList}>
              <li>{text("surface.home.diffIndustrial")}</li>
              <li>{text("surface.home.diffProfiles")}</li>
              <li>{text("surface.home.diffConnect")}</li>
              <li>{text("surface.home.diffLanguages")}</li>
              <li>{text("surface.home.diffInternational")}</li>
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

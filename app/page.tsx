import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Dancing_Script } from "next/font/google";
import LogoRecruta from "@/app/components/LogoRecruta";
import HomeAccessForm from "@/app/components/HomeAccessForm";
import HomeAuthProvider from "@/app/components/HomeAuthProvider";
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

      <HomeAuthProvider>
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
          <style>{`
            .${styles.proHomeCard}{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;padding-top:0!important}
            .${styles.proHomeCard} .${styles.proMidRow}{display:grid!important;grid-template-columns:26% 1fr!important;column-gap:clamp(10px,1.4vw,16px)!important;align-items:stretch!important;width:100%!important;flex:0 0 auto!important}
            .${styles.proHomeCard} .${styles.proMediaCol}{display:flex!important;flex-direction:column!important;height:100%!important;min-height:100%!important;width:100%!important;max-width:none!important}
            .${styles.proHomeCard} .${styles.cardImageWrap}{flex:1 1 auto!important;width:100%!important;height:100%!important;max-height:none!important;min-height:100%!important;margin:0!important;align-self:stretch!important;position:relative!important}
            .${styles.proHomeCard} .${styles.cardSideBody}{display:flex!important;flex-direction:column!important;align-items:center!important;min-width:0!important;padding:0 4px 0 2px!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proLeadBlock}{width:100%!important;display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:baseline!important;justify-content:center!important;gap:0.55em!important;text-align:center!important;margin-top:10px!important}
            .${styles.proHomeCard} .${styles.proLeadTitle},
            .${styles.proHomeCard} .${styles.proLeadSubtitle}{width:auto!important;margin:0!important;text-align:center!important;white-space:nowrap!important;color:var(--ri-gold)!important;font-size:clamp(1.15rem,1.7vw,1.45rem)!important;font-weight:700!important;line-height:1.15!important}
            .${styles.proHomeCard} .${styles.proCopy}{width:100%!important;margin:0!important;padding:0!important}
            .${styles.proHomeCard} .${styles.proCopy} p,
            .${styles.proHomeCard} .${styles.proCopy} li{font-size:clamp(0.98rem,1.25vw,1.14rem)!important;line-height:1.4!important}
            .${styles.proHomeCard} .${styles.proHighlight}{font-size:clamp(1.05rem,1.35vw,1.22rem)!important}
            .${styles.proHomeCard} .${styles.proSectionTitle}{font-size:clamp(1.12rem,1.45vw,1.32rem)!important}
            .${styles.proHomeCard} .${styles.proSteps} li{font-size:clamp(0.95rem,1.18vw,1.08rem)!important;line-height:1.35!important}
            .${styles.proHomeCard} .${styles.proClosingRow}{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:baseline!important;gap:0.65em!important;width:100%!important}
            .${styles.proHomeCard} .${styles.proClosingRow} p:first-child{flex:1 1 auto!important;min-width:0!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proClosingRow} .${styles.proHighlight}{flex:0 0 auto!important;white-space:nowrap!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proLoginPanel}{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;max-width:none!important;align-self:stretch!important;margin:0!important;box-sizing:border-box!important;grid-column:auto!important;grid-row:auto!important}
            .${styles.proHomeCard} .${styles.proLoginForm}{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;width:100%!important;gap:8px!important}
            .${styles.proHomeCard} .${styles.proLoginRow}{display:flex!important;flex:1 1 auto!important;flex-wrap:nowrap!important;align-items:center!important;min-width:0!important;gap:8px!important;width:auto!important}
            .${styles.proHomeCard} .${styles.proLoginInputPill}{flex:1 1 0!important;min-width:0!important;width:auto!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly}{flex:0 0 auto!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly} button{width:auto!important;min-width:0!important;flex:0 0 auto!important;margin:0!important;padding:6px!important;font-size:0!important;line-height:0!important;color:transparent!important;gap:0!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly} button svg{width:22px!important;height:22px!important}
            .${styles.proHomeCard} .${styles.proLoginAcessarTag},
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}{flex:0 0 auto!important;margin:0!important;white-space:nowrap!important}
          `}</style>
          <article className={`${styles.actionCard} ${styles.actionCardSide} ${styles.proHomeCard}`}>
            <div className={styles.proMidRow}>
              <div className={styles.proMediaCol}>
                <div className={styles.cardImageWrap}>
                  <Image
                    src="/profissional-equipe.jpg"
                    alt="Equipe de profissionais da indústria com capacete de proteção"
                    fill
                    sizes="(max-width: 768px) 92vw, 380px"
                    quality={65}
                    priority
                    className={styles.cardImage}
                  />
                </div>
              </div>

              <div className={styles.cardSideBody}>
                <div className={styles.proLeadBlock}>
                  <h2 className={styles.proLeadTitle}>Pare de correr atrás de vagas.</h2>
                  <h3 className={styles.proLeadSubtitle}>Deixe as empresas encontrarem você.</h3>
                </div>
                <div className={styles.proCopy}>
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
                    perfil uma vez e mantém suas informações atualizadas. Deixe seu currículo trabalhar por
                    você.
                  </p>
                </div>
              </div>
            </div>
            <HomeAccessForm role="professional" registerHref="/professional/register" />
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
            <p className={styles.footerPrivacy}>
              <Link href="/termos/lgpd" className="footer-privacy-link">
                Política de privacidade
              </Link>
            </p>
            <style>{`.footer-privacy-link{color:rgba(242,242,242,0.4)!important;font-size:0.58rem!important;font-weight:400!important;letter-spacing:0.01em!important;text-decoration:none!important}.footer-privacy-link:hover{color:rgba(242,242,242,0.65)!important;text-decoration:underline!important}`}</style>
          </footer>
        </div>
      </div>
      </HomeAuthProvider>
    </main>
  );
}

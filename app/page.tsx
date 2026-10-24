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
            .${styles.homePageFlow} .${styles.hero}{margin-bottom:0!important}
            .${styles.homePageFlow} .${styles.actionCards}.${styles.proCardWrap}{flex:1 1 auto!important;justify-content:center!important;margin-top:0!important}
            .${styles.homePageFlow} .${styles.homeBottom}{margin-top:0!important}
            .${styles.proHomeCard}{display:flex!important;flex:0 0 auto!important;height:auto!important;flex-direction:column!important;align-items:stretch!important;gap:8px!important;padding-top:0!important}
            .${styles.proHomeCard} .${styles.proMidRow}{display:grid!important;grid-template-columns:26% 1fr!important;column-gap:clamp(10px,1.4vw,16px)!important;align-items:stretch!important;width:100%!important;flex:0 0 auto!important}
            .${styles.proHomeCard} .${styles.proMediaCol}{display:flex!important;flex-direction:column!important;height:100%!important;min-height:100%!important;width:100%!important;max-width:none!important}
            .${styles.proHomeCard} .${styles.cardImageWrap}{flex:1 1 auto!important;width:100%!important;height:100%!important;max-height:none!important;min-height:100%!important;margin:0!important;align-self:stretch!important;position:relative!important;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 14%,#000 86%,transparent 100%)!important;mask-image:linear-gradient(90deg,transparent 0%,#000 14%,#000 86%,transparent 100%)!important}
            .${styles.proHomeCard} .${styles.cardSideBody}{display:flex!important;flex-direction:column!important;align-items:center!important;min-width:0!important;padding:0 4px 0 2px!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proLeadBlock}{width:100%!important;display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:baseline!important;justify-content:center!important;gap:0.55em!important;text-align:center!important;margin-top:10px!important}
            .${styles.proHomeCard} .${styles.proLeadTitle},
            .${styles.proHomeCard} .${styles.proLeadSubtitle}{width:100%!important;margin:0!important;text-align:center!important;white-space:normal!important;color:#414141!important;font-size:clamp(1.55rem,2.4vw,2rem)!important;font-weight:700!important;line-height:1.2!important}
            .${styles.proHomeCard} .${styles.proCopy}{width:100%!important;margin:0!important;padding:0!important}
            .${styles.proHomeCard} .${styles.proCopy} p,
            .${styles.proHomeCard} .${styles.proCopy} li{font-size:clamp(1.08rem,1.4vw,1.28rem)!important;line-height:1.45!important}
            .${styles.proHomeCard} .${styles.proCopyGold}{color:#414141!important;font-weight:700!important;text-align:center!important}
            .${styles.proHomeCard} .${styles.proHighlight}{font-size:clamp(1.05rem,1.35vw,1.22rem)!important}
            .${styles.proHomeCard} .${styles.proSectionTitle}{font-size:clamp(1.12rem,1.45vw,1.32rem)!important}
            .${styles.proHomeCard} .${styles.proSteps} li{font-size:clamp(0.95rem,1.18vw,1.08rem)!important;line-height:1.35!important}
            .${styles.proHomeCard} .${styles.proClosingRow}{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:baseline!important;gap:0.65em!important;width:100%!important}
            .${styles.proHomeCard} .${styles.proClosingRow} p:first-child{flex:1 1 auto!important;min-width:0!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proClosingRow} .${styles.proHighlight}{flex:0 0 auto!important;white-space:nowrap!important;margin:0!important}
            .${styles.proHomeCard} .${styles.proLoginPanel}{display:flex!important;flex-direction:column!important;align-items:stretch!important;width:100%!important;max-width:none!important;align-self:stretch!important;margin:0!important;box-sizing:border-box!important;grid-column:auto!important;grid-row:auto!important}
            .${styles.proHomeCard} .${styles.proLoginTitle}{display:inline-flex!important;align-self:center!important;align-items:center!important;justify-content:center!important;width:auto!important;margin:0 0 4px!important;padding:6px 14px!important;border-radius:999px!important;border:2px solid #8D6B1F!important;background:#F3E6C8!important;color:#414141!important;font-size:0.68rem!important;font-weight:700!important;letter-spacing:0.06em!important;line-height:1.2!important;white-space:nowrap!important}
            .${styles.proHomeCard} .${styles.proLoginForm}{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;width:100%!important;gap:8px!important}
            .${styles.proHomeCard} .${styles.proLoginRow}{display:flex!important;flex:1 1 auto!important;flex-wrap:nowrap!important;align-items:flex-start!important;min-width:0!important;gap:8px!important;width:auto!important}
            .${styles.homeAccessFields}{align-items:flex-start!important}
            .home-password-stack{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:4px!important;min-width:0!important}
            .home-password-field{position:relative!important;display:inline-flex!important;align-items:center!important;flex:0 0 auto!important;min-width:0!important;width:100%!important;max-width:100%!important;height:auto!important;min-height:28px!important;overflow:visible!important}
            .home-password-field input{padding-right:28px!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important}
            .home-password-eye,.home-password-eye:active{position:absolute!important;top:50%!important;right:3px!important;transform:translateY(-50%)!important;width:22px!important;height:22px!important;padding:0!important;border:none!important;border-radius:999px!important;background:transparent!important;color:#414141!important;cursor:pointer!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;line-height:0!important;box-shadow:none!important}
            .home-forgot-btn,.home-forgot-btn:active{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:auto!important;max-width:100%!important;align-self:flex-end!important;flex:0 0 auto!important;box-sizing:border-box!important;margin:0!important;padding:3px 8px!important;border-radius:999px!important;border:2px solid #8D6B1F!important;background:#F3E6C8!important;color:#414141!important;font-size:0.6rem!important;font-weight:600!important;line-height:1.2!important;text-decoration:none!important;white-space:nowrap!important;box-shadow:var(--ri-btn-3d-gold-shadow)!important;transition:transform .12s ease,box-shadow .12s ease!important}
            .home-forgot-btn:active,
            .${styles.proHomeCard} .${styles.proLoginAcessarTag}:active,
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}:active,
            .${styles.homeAccessEmpresa} .${styles.cardCta}:active,
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister}:active{transform:translateY(3px)!important;box-shadow:var(--ri-btn-3d-gold-active)!important}
            .${styles.proLoginGoogleIconOnly} button:active{transform:translateY(2px)!important;box-shadow:none!important}
            .${styles.proHomeCard} .home-password-stack{flex:1 1 0!important}
            .${styles.homeAccessEmpresa} .${styles.homeAccessInput},
            .${styles.homeAccessEmpresa} .${styles.empresaAccessTag},
            .${styles.proHomeCard} .${styles.proLoginInputPill}{height:28px!important;box-sizing:border-box!important}
            .${styles.proHomeCard} .${styles.proLoginInputPill}{flex:1 1 0!important;width:auto!important;min-width:0!important}
            .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly},
            .${styles.homeAccessEmpresa} .${styles.cardCta},
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister},
            .${styles.homeAccessEmpresa} .${styles.empresaAccessTag},
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly},
            .${styles.proHomeCard} .${styles.proLoginAcessarTag},
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}{align-self:flex-start!important;margin:0!important;height:28px!important}
            .${styles.homeAccessEmpresa} .${styles.cardCta},
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister},
            .${styles.proHomeCard} .${styles.proLoginAcessarTag},
            .${styles.proHomeCard} .${styles.proLoginRegisterTag},
            .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly} button,
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly} button{box-sizing:border-box!important;height:28px!important;min-height:28px!important;margin:0!important;padding:0 12px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;border:2px solid #8D6B1F!important;background:#E8C56A!important;color:#414141!important;font-size:0.68rem!important;font-weight:700!important;line-height:1!important;text-decoration:none!important;text-transform:uppercase!important;white-space:nowrap!important;box-shadow:var(--ri-btn-3d-gold-shadow)!important;transition:transform .12s ease,box-shadow .12s ease!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly},
            .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly}{flex:0 0 auto!important;width:28px!important;min-width:28px!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly} button,
            .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly} button{width:28px!important;min-width:28px!important;max-width:28px!important;padding:0!important;font-size:0!important;line-height:0!important;color:transparent!important;gap:0!important;background:#FFFEFB!important;border:2px solid #8D6B1F!important;box-shadow:none!important}
            .${styles.homeAccessEmpresa} .${styles.cardCta}:hover,
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister}:hover,
            .${styles.proHomeCard} .${styles.proLoginAcessarTag}:hover,
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}:hover,
            .home-forgot-btn:hover{background:#F3E0A6!important;color:#414141!important;border-color:#8D6B1F!important}
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister},
            .${styles.homeAccessEmpresa} .${styles.homeAccessRegister}:active,
            .${styles.proHomeCard} .${styles.proLoginRegisterTag},
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}:active,
            .${styles.homeAccessEmpresa} .${styles.cardCta},
            .${styles.homeAccessEmpresa} .${styles.cardCta}:active,
            .${styles.proHomeCard} .${styles.proLoginAcessarTag},
            .${styles.proHomeCard} .${styles.proLoginAcessarTag}:active{width:auto!important;min-width:96px!important;max-width:none!important;flex:0 0 auto!important;height:28px!important;padding:0 14px!important;font-size:0.68rem!important;line-height:1!important;color:#414141!important;overflow:visible!important;border-radius:999px!important}
            .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly} button svg,
            .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly} button svg{width:16px!important;height:16px!important}
            .${styles.proHomeCard} .${styles.proLoginAcessarTag},
            .${styles.proHomeCard} .${styles.proLoginRegisterTag}{flex:0 0 auto!important}
            .${styles.proHomeCard} .home-password-field input,
            .${styles.homeAccessEmpresa} .home-password-field input{width:100%!important;min-width:0!important;max-width:100%!important}
            @media (max-width:768px){
              .${styles.proHomeCard} .${styles.proLoginForm},
              .${styles.proHomeCard} .${styles.proLoginRow},
              .${styles.homeAccessEmpresa} .${styles.homeAccessFields}{flex-wrap:wrap!important;row-gap:8px!important}
              .${styles.proHomeCard} .${styles.proLoginInputPill},
              .${styles.homeAccessEmpresa} .${styles.homeAccessInput}{flex:1 1 140px!important;min-width:120px!important;max-width:100%!important}
              .${styles.proHomeCard} .home-password-stack,
              .${styles.homeAccessEmpresa} .home-password-stack{flex:1 1 140px!important;min-width:120px!important;max-width:100%!important}
              .${styles.proHomeCard} .home-password-field input,
              .${styles.homeAccessEmpresa} .home-password-field input{width:100%!important;min-width:0!important;max-width:100%!important}
              .${styles.proHomeCard} .${styles.proLoginGoogleIconOnly},
              .${styles.homeAccessEmpresa} .${styles.proLoginGoogleIconOnly}{position:relative!important;z-index:2!important;flex:0 0 28px!important}
            }
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
                    quality={75}
                    priority
                    className={styles.cardImage}
                  />
                </div>
              </div>

              <div className={styles.cardSideBody}>
                <div className={styles.proLeadBlock}>
                  <h2 className={styles.proLeadTitle}>
                    Oportunidades de carreira feitas para quem é da indústria.
                  </h2>
                </div>
                <div className={styles.proCopy}>
                  <p>
                    Encontre vagas do setor industrial, apresente suas qualificações e destaque sua
                    experiência para empresas que buscam profissionais. No Recruta Indústria, você
                    encontra um ambiente especializado, com oportunidades e conexões voltadas
                    exclusivamente ao mercado industrial.
                  </p>
                  <p className={styles.proCopyGold}>
                    Cadastre-se gratuitamente, encontre vagas da sua área e dê o próximo passo na sua carreira!
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
            <style>{`.footer-privacy-link{color:#414141!important;font-size:0.58rem!important;font-weight:400!important;letter-spacing:0.01em!important;text-decoration:none!important}.footer-privacy-link:hover{color:#414141!important;text-decoration:underline!important}`}</style>
          </footer>
        </div>
      </div>
      </HomeAuthProvider>
    </main>
  );
}

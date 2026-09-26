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
                <h3>Pare de esperar currículos. Comece a encontrar profissionais.</h3>
                <p>
                  No Recruta Indústria, sua empresa não precisa depender somente da publicação de vagas para
                  encontrar candidatos.
                </p>
                <p>
                  Você pesquisa uma base de profissionais cadastrados e encontra pessoas de acordo com as
                  características que sua empresa procura.
                </p>
                <p>
                  Você define o que precisa. O Recruta ajuda você a encontrar quem combina com a oportunidade.
                </p>
              </div>

              <Link href="/company/register" className={styles.cardCta}>
                Cadastrar minha empresa
              </Link>

              <div className={styles.proCopy}>
                <h2>Como funciona?</h2>
                <ol>
                  <li>
                    <strong>Cadastre sua empresa</strong> — perfil da empresa, equipe de RH acessa conforme o
                    plano.
                  </li>
                  <li>
                    <strong>Pesquise profissionais</strong> — filtros: Função; Área de atuação; Experiência;
                    Formação; Cursos e qualificações; Localização; CNH; Habilidades; Experiências anteriores;
                    Outros critérios disponíveis no perfil.
                  </li>
                  <li>
                    <strong>Analise os perfis</strong> — experiência, formação, qualificações e outros dados do
                    profissional.
                  </li>
                  <li>
                    <strong>Encontre os profissionais que fazem sentido</strong> — busca pelos critérios que
                    importam para aquela contratação.
                  </li>
                  <li>
                    <strong>Entre em contato</strong> — recursos de contato conforme o plano.
                  </li>
                </ol>

                <h2>Sua empresa procurando profissionais, e não apenas vagas</h2>
                <p>
                  <strong>Modelo tradicional:</strong> A empresa publica uma vaga → os candidatos se candidatam →
                  o RH recebe currículos → começa a triagem.
                </p>
                <p>
                  <strong>Caminho inverso:</strong> A empresa precisa de um profissional → pesquisa → encontra
                  perfis → analisa → entra em contato.
                </p>

                <h2>Encontre profissionais antes mesmo de publicar uma vaga</h2>
                <p>
                  Nem sempre o profissional está procurando emprego. <strong>Busca ativa.</strong> Pesquisar a
                  base por características compatíveis.
                </p>

                <h2>Menos tempo procurando. Mais tempo selecionando.</h2>
                <p>Chega de:</p>
                <ul>
                  <li>procurar currículos em diferentes lugares;</li>
                  <li>analisar cadastros incompletos;</li>
                  <li>organizar informações espalhadas;</li>
                  <li>tentar descobrir se um candidato possui determinada experiência;</li>
                  <li>esperar novas candidaturas.</li>
                </ul>
                <p>
                  <strong>A busca começa pelo perfil que você precisa.</strong>
                </p>

                <h2>Filtros para encontrar profissionais com mais precisão</h2>
                <p>
                  Experiência, formação e localização. Quanto mais específica for sua busca, mais direcionada
                  poderá ser sua pesquisa.
                </p>

                <h2>Conheça o profissional antes de entrar em contato</h2>
                <ul>
                  <li>Dados profissionais;</li>
                  <li>Experiência;</li>
                  <li>Formação;</li>
                  <li>Habilidades;</li>
                  <li>CNH;</li>
                  <li>Localização;</li>
                  <li>Apresentação profissional em vídeo.</li>
                </ul>
                <p>Conforme o preenchimento do profissional.</p>

                <h2>Perfis mais completos ajudam sua empresa a tomar decisões</h2>
                <p>
                  Você não precisa analisar apenas um nome. Pode conhecer melhor o profissional por trás daquele
                  cadastro.
                </p>

                <h2>Sua empresa também ganha uma presença profissional</h2>
                <p>
                  O profissional também conhece a empresa. <strong>Recrutamento é via de mão dupla.</strong>
                </p>

                <h2>Organize seu processo de recrutamento</h2>
                <p>Da busca ao contato. Etapas do processo seletivo organizadas para a equipe.</p>

                <h2>Mais do que publicar vagas</h2>
                <p>
                  <strong>PUBLICAR:</strong> divulgue a oportunidade e receba candidatos.
                </p>
                <p>
                  <strong>PESQUISAR:</strong> procure profissionais que correspondam ao perfil desejado.
                </p>

                <h2>Feito para empresas que precisam contratar</h2>
                <p>
                  Você informa o que procura. A plataforma apresenta profissionais. A equipe analisa. A empresa
                  decide com quem entrar em contato.
                </p>

                <h2>Sua equipe de RH também pode participar</h2>
                <p>
                  Conforme o plano, outros integrantes do RH. Mais organização para equipes de recrutamento.
                </p>

                <h2>Quanto mais sua empresa usa, mais possibilidades de recrutamento</h2>
                <p>
                  Não substitui o recrutador. Ajuda a encontrar, pesquisar, comparar e organizar. A decisão
                  final continua sendo da empresa.
                </p>

                <h2>Encontre quem você ainda não encontrou.</h2>
                <p>Talvez o profissional:</p>
                <ul>
                  <li>ainda não tenha visto a vaga;</li>
                  <li>não esteja procurando emprego hoje;</li>
                  <li>esteja trabalhando em outra empresa;</li>
                  <li>esteja cadastrado em outro lugar;</li>
                  <li>ou ainda não tenha chegado ao processo.</li>
                </ul>
                <p>
                  <strong>Vá até os profissionais.</strong>
                </p>
              </div>

              <Link href="/company/register" className={styles.cardCta}>
                Começar agora
              </Link>

              <p className={styles.proBrand}>Recruta Indústria</p>
              <p className={styles.proClose}>
                A plataforma para empresas que querem encontrar profissionais de forma mais direta.
              </p>
              <p className={styles.proClose}>Pesquise. Encontre. Analise. Conecte-se.</p>
              <p className={styles.proClose}>
                Sua próxima contratação pode estar entre os profissionais que já estão cadastrados.
              </p>
              <p className={styles.proClose}>Cadastre sua empresa e comece a pesquisar.</p>
            </div>
          </article>
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

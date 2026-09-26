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
    <main className={`${styles.homePage} ${styles.homePageFlow}`} style={{ fontFamily: FONT_STACK }}>
      <div className={styles.atmosphere} aria-hidden />
      <div className={styles.atmosphereGlow} aria-hidden />

      <div className={styles.homeShell}>
        <div className={styles.empresaEntry}>
          <Link href="/empresa" className={styles.cardCta}>
            Entrar como empresa
          </Link>
          <div className={styles.empresaEntryLine} aria-hidden />
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
          <article className={`${styles.actionCard} ${styles.actionCardSide}`}>
            <div className={styles.cardImageWrap}>
              <Image
                src="/profissional.jpg"
                alt="Profissional da indústria com capacete de proteção"
                fill
                sizes="(max-width: 768px) 92vw, 380px"
                quality={65}
                priority
                className={styles.cardImage}
              />
            </div>
            <div className={styles.cardSideBody}>
              <div className={styles.proCopy}>
                <h2>Pare de correr atrás de vagas. Deixe as empresas encontrarem você.</h2>
                <h3>Seu próximo emprego pode começar antes mesmo de você encontrar uma vaga.</h3>
                <p>
                  No <strong>Recruta Indústria</strong>, você cria seu perfil profissional uma única vez e
                  reúne em um só lugar suas experiências, qualificações, localização, formação e habilidades.
                </p>
                <p>
                  Em vez de preencher o mesmo cadastro em vários sites e enviar o currículo repetidamente,
                  você deixa seu perfil disponível para{" "}
                  <strong>empresas que estão procurando profissionais com o seu perfil</strong>.
                </p>

                <h3>Você se cadastra. As empresas procuram.</h3>
                <p>O Recruta Indústria foi criado para mudar a forma como profissionais e empresas se encontram.</p>
                <p>
                  As empresas podem pesquisar profissionais de acordo com suas necessidades, utilizando
                  informações como:
                </p>
                <ul>
                  <li>Área e função de interesse;</li>
                  <li>Experiência profissional;</li>
                  <li>Formação e cursos;</li>
                  <li>Localização;</li>
                  <li>Habilidades e qualificações;</li>
                  <li>CNH e outros requisitos profissionais;</li>
                  <li>Disponibilidade e informações do perfil.</li>
                </ul>
                <p>
                  Quanto mais completo estiver o seu perfil, mais informações a empresa terá para avaliar se
                  você pode fazer parte de uma oportunidade.
                </p>

                <h2>Seu currículo trabalhando por você</h2>
                <p>Você não precisa criar um currículo diferente para cada empresa.</p>
                <p>Monte seu perfil profissional no Recruta Indústria e mantenha suas informações atualizadas.</p>
                <p>
                  <strong>Um cadastro. Um perfil profissional. Mais possibilidades de ser encontrado.</strong>
                </p>
                <p>
                  Você também pode apresentar sua experiência de uma forma mais completa, incluindo informações
                  que normalmente não cabem em um currículo tradicional.
                </p>
                <h3>Mostre quem você é profissionalmente</h3>
                <p>Seu perfil pode reunir:</p>
                <ul>
                  <li>
                    <strong>Experiência profissional.</strong> Conte onde trabalhou, quais funções exerceu e quais
                    experiências adquiriu.
                  </li>
                  <li>
                    <strong>Formação e cursos.</strong> Apresente sua escolaridade, cursos e qualificações.
                  </li>
                  <li>
                    <strong>Localização.</strong> Informe onde você está e quais regiões fazem sentido para sua
                    busca profissional.
                  </li>
                  <li>
                    <strong>Habilidades.</strong> Destaque conhecimentos e competências que podem interessar às
                    empresas.
                  </li>
                  <li>
                    <strong>Apresentação em vídeo.</strong> Tenha a possibilidade de fazer uma breve apresentação
                    e mostrar sua comunicação e perfil profissional.
                  </li>
                  <li>
                    <strong>Perfil completo e atualizado.</strong> Mantenha suas informações organizadas para
                    facilitar a análise dos recrutadores.
                  </li>
                </ul>

                <h2>Não procure apenas oportunidades. Seja encontrado por elas.</h2>
                <p>Todos os dias, profissionais procuram empresas.</p>
                <p>No Recruta Indústria, queremos facilitar o caminho inverso:</p>
                <h3>
                  A empresa precisa de um profissional. Ela pesquisa. Encontra seu perfil. E pode entrar em
                  contato.
                </h3>
                <p>Isso significa que você não precisa depender somente de anúncios de vagas.</p>
                <p>
                  Seu perfil pode ser encontrado quando uma empresa estiver procurando alguém com características
                  profissionais semelhantes às suas.
                </p>

                <h2>Feito para quem trabalha e não tem tempo a perder</h2>
                <p>Chega de:</p>
                <ul>
                  <li>Preencher o mesmo cadastro dezenas de vezes.</li>
                  <li>Enviar o currículo repetidamente.</li>
                  <li>Procurar vaga por vaga todos os dias.</li>
                  <li>Manter vários currículos diferentes.</li>
                  <li>Perder oportunidades porque a empresa não encontrou seu perfil.</li>
                </ul>
                <h3>No Recruta Indústria:</h3>
                <ul>
                  <li>Você cria seu perfil uma vez.</li>
                  <li>Organiza suas informações profissionais.</li>
                  <li>Mantém seu cadastro atualizado.</li>
                  <li>Fica disponível para pesquisas das empresas.</li>
                  <li>Pode receber contatos relacionados ao seu perfil.</li>
                </ul>

                <h2>Sua experiência tem valor. Faça ela ser encontrada.</h2>
                <p>Você não é apenas um currículo.</p>
                <p>
                  Sua experiência, seus cursos, suas habilidades e sua trajetória profissional ajudam a mostrar
                  para uma empresa <strong>quem é o profissional por trás do cadastro</strong>.
                </p>
                <p>
                  Por isso, quanto mais completo e atualizado estiver seu perfil, mais informações estarão
                  disponíveis para que uma empresa avalie sua compatibilidade com uma oportunidade.
                </p>

                <h2>Comece gratuitamente</h2>
                <p>Criar seu perfil profissional no Recruta Indústria é simples.</p>
                <h3>
                  Cadastre-se, complete suas informações e fique disponível para empresas que procuram
                  profissionais como você.
                </h3>
                <p>
                  <strong>
                    Não espere apenas uma vaga aparecer. Deixe seu perfil preparado para quando uma empresa
                    estiver procurando.
                  </strong>
                </p>
              </div>
              <Link href="/professional/register" className={styles.cardCta}>
                Criar meu perfil gratuitamente
              </Link>
              <p className={styles.proBrand}>Recruta Indústria</p>
              <p className={styles.proClose}>
                Profissionais encontrados. Empresas conectadas. Oportunidades que começam com um perfil.
              </p>
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

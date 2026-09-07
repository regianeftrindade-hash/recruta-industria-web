"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import styles from "./boas-vindas.module.css";

function BoasVindasEmpresaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview =
    process.env.NODE_ENV === "development" &&
    searchParams.get("preview") === "1";

  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (isPreview) {
      setNome("Indústria Exemplo");
      setCarregando(false);
      return;
    }

    let ativo = true;

    const carregar = async () => {
      try {
        const res = await fetch("/api/company/check-registration", {
          credentials: "include",
        });

        if (res.status === 401) {
          router.replace(
            "/login?tipo=empresa&redirect=/company/boas-vindas"
          );
          return;
        }

        if (!res.ok) {
          router.replace("/company/register");
          return;
        }

        const data = await res.json();

        if (!data.isCompany) {
          router.replace("/login?tipo=empresa");
          return;
        }

        if (!data.registrationComplete && !data.testBypass) {
          router.replace("/company/register");
          return;
        }

        if (!ativo) return;

        const razao = String(
          data.user?.razaoSocial || data.user?.nome || ""
        ).trim();

        if (razao) {
          setNome(razao.split(" ")[0]);
        }
      } catch {
        if (ativo) router.replace("/company/register");
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregar();

    return () => {
      ativo = false;
    };
  }, [router, isPreview]);

  if (carregando) {
    return <PageLoader message="Preparando sua boas-vindas..." />;
  }

  const saudacao = nome ? `, ${nome}` : "";

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <section
          className={styles.heroCard}
          aria-labelledby="boas-vindas-empresa-titulo"
        >
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" depth />
          </div>

          <div className={styles.emoji} aria-hidden="true">
            🏭
          </div>

          <h1
            id="boas-vindas-empresa-titulo"
            className={styles.title}
          >
            Bem-vindo{saudacao}!
          </h1>

          <p className={styles.subtitle}>
            Seu cadastro empresarial foi concluído com sucesso.
          </p>
        </section>

        <section className={styles.messageCard}>
          <h2 className={styles.messageTitle}>
            Sua empresa já pode recrutar na plataforma
          </h2>

          <p className={styles.messageText}>
            Use a vitrine para buscar profissionais industriais. Contatos e
            dados sensíveis liberam após confirmar o e-mail corporativo e a
            aprovação do cartão CNPJ.
          </p>
        </section>

        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              🔍
            </div>

            <h3 className={styles.stepTitle}>Busque talentos</h3>

            <p className={styles.stepText}>
              Filtre por região, área e experiência na vitrine industrial.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              ✅
            </div>

            <h3 className={styles.stepTitle}>Confirme e verifique</h3>

            <p className={styles.stepText}>
              Confirme o e-mail corporativo e envie o cartão CNPJ para liberar
              contatos.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              💬
            </div>

            <h3 className={styles.stepTitle}>Entre em contato</h3>

            <p className={styles.stepText}>
              Libere perfis e fale com candidatos pelo painel da empresa.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              📊
            </div>

            <h3 className={styles.stepTitle}>Acompanhe o funil</h3>

            <p className={styles.stepText}>
              Marque contatados, entrevistados e contratados no acompanhamento.
            </p>
          </article>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => router.push("/company/dashboard-empresa")}
          >
            Ir para o painel da empresa
          </button>
        </div>

        <p className={styles.note}>
          Você pode atualizar o cadastro a qualquer momento pelo painel
          empresarial.
        </p>
      </div>
    </div>
  );
}

export default function BoasVindasEmpresaPage() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <BoasVindasEmpresaContent />
    </Suspense>
  );
}
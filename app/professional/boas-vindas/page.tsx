"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import styles from "./boas-vindas.module.css";

export default function BoasVindasProfissionalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = process.env.NODE_ENV === "development" && searchParams.get("preview") === "1";
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (isPreview) {
      setNome("João");
      setCarregando(false);
      return;
    }

    let ativo = true;

    const carregar = async () => {
      try {
        const res = await fetch("/api/professional/profile", { credentials: "include" });

        if (res.status === 401) {
          router.replace("/login?tipo=profissional");
          return;
        }

        if (!res.ok) {
          router.replace("/professional/register");
          return;
        }

        const data = await res.json();

        if (!data.registrationComplete) {
          router.replace("/professional/register");
          return;
        }

        if (!ativo) return;

        const nomePerfil = String(data.nome || data.formEdit?.formData?.nome || "").trim();
        if (nomePerfil && nomePerfil !== "Usuário") {
          setNome(nomePerfil.split(" ")[0]);
        }
      } catch {
        if (ativo) router.replace("/professional/register");
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
        <section className={styles.heroCard} aria-labelledby="boas-vindas-titulo">
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" depth />
          </div>
          <div className={styles.emoji} aria-hidden="true">🎉</div>
          <h1 id="boas-vindas-titulo" className={styles.title}>
            Bem-vindo{saudacao}!
          </h1>
          <p className={styles.subtitle}>
            Seu cadastro foi concluído com sucesso.
          </p>
        </section>

        <section className={styles.messageCard}>
          <h2 className={styles.messageTitle}>Você já está na vitrine industrial</h2>
          <p className={styles.messageText}>
            Agora as empresas da região podem encontrar seu perfil. Mantenha seus dados atualizados,
            destaque suas qualificações e acompanhe as oportunidades pelo seu painel profissional.
          </p>
        </section>

        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">📋</div>
            <h3 className={styles.stepTitle}>Revise seu perfil</h3>
            <p className={styles.stepText}>
              Confira se foto, formação e experiências estão completas.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">🧠</div>
            <h3 className={styles.stepTitle}>Perfil pessoal</h3>
            <p className={styles.stepText}>
              Faça o teste pessoal no painel para mostrar como você age no dia a dia.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">🏭</div>
            <h3 className={styles.stepTitle}>Aguarde o contato</h3>
            <p className={styles.stepText}>
              Empresas interessadas podem visualizar seu perfil e falar com você.
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">📱</div>
            <h3 className={styles.stepTitle}>Acompanhe o painel</h3>
            <p className={styles.stepText}>
              Veja mensagens, atualize dados e mantenha o perfil sempre ativo.
            </p>
          </article>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => router.push("/professional/dashboard")}
          >
            Ir para meu painel
          </button>
        </div>

        <p className={styles.note}>
          Você pode atualizar seu cadastro a qualquer momento pelo painel profissional.
        </p>
      </div>
    </div>
  );
}

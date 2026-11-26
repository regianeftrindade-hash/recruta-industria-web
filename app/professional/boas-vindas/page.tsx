"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
import { flushProfessionalSignupConversionIfPending } from "@/lib/analytics/google-ads";
import { fillMessage } from "@/lib/i18n/fill";
import { t } from "@/lib/i18n/translate";
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
          router.replace("/professional/dashboard");
          return;
        }

        const data = await res.json();

        if (!data.registrationComplete) {
          router.replace("/professional/dashboard");
          return;
        }

        if (!ativo) return;

        flushProfessionalSignupConversionIfPending();

        const nomePerfil = String(data.nome || data.formEdit?.formData?.nome || "").trim();
        if (nomePerfil && nomePerfil !== "Usuário") {
          setNome(nomePerfil.split(" ")[0]);
        }
      } catch {
        if (ativo) router.replace("/professional/dashboard");
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
    return <PageLoader message={t("welcome.loading")} />;
  }

  const saudacao = nome ? `, ${nome}` : "";

  return (
    <div className={styles.container}>
      <AuthAtmosphere intensity="strong" />
      <div className={styles.inner}>
        <section className={styles.heroCard} aria-labelledby="boas-vindas-titulo">
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" depth />
          </div>
          <div className={styles.emoji} aria-hidden="true">🎉</div>
          <h1 id="boas-vindas-titulo" className={styles.title}>
            {fillMessage(t("welcome.pro.title"), { name: saudacao })}
          </h1>
          <p className={styles.subtitle}>{t("welcome.pro.subtitle")}</p>
        </section>

        <section className={styles.messageCard}>
          <h2 className={styles.messageTitle}>{t("welcome.pro.messageTitle")}</h2>
          <p className={styles.messageText}>{t("welcome.pro.messageBody")}</p>
        </section>

        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">📋</div>
            <h3 className={styles.stepTitle}>{t("welcome.pro.step1Title")}</h3>
            <p className={styles.stepText}>{t("welcome.pro.step1Body")}</p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">🧠</div>
            <h3 className={styles.stepTitle}>{t("welcome.pro.step2Title")}</h3>
            <p className={styles.stepText}>{t("welcome.pro.step2Body")}</p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">🏭</div>
            <h3 className={styles.stepTitle}>{t("welcome.pro.step3Title")}</h3>
            <p className={styles.stepText}>{t("welcome.pro.step3Body")}</p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">📱</div>
            <h3 className={styles.stepTitle}>{t("welcome.pro.step4Title")}</h3>
            <p className={styles.stepText}>{t("welcome.pro.step4Body")}</p>
          </article>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => router.push("/professional/dashboard")}
          >
            {t("welcome.pro.cta")}
          </button>
        </div>

        <p className={styles.note}>{t("welcome.pro.note")}</p>
      </div>
    </div>
  );
}

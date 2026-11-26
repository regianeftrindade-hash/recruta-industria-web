"use client";
import { exactUi } from "@/lib/i18n/exact-ui";
import { t } from "@/lib/i18n/translate";
import { fillMessage } from "@/lib/i18n/fill";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
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
          router.replace("/company/dashboard-empresa");
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
        if (ativo) router.replace("/company/dashboard-empresa");
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
            {fillMessage(t("welcome.company.title"), { name: saudacao })}
          </h1>

          <p className={styles.subtitle}>
            {t("welcome.company.subtitle")}
          </p>
        </section>

        <section className={styles.messageCard}>
          <h2 className={styles.messageTitle}>
            {t("welcome.company.messageTitle")}
          </h2>

          <p className={styles.messageText}>
            {t("welcome.company.messageBody")}
          </p>
        </section>

        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              🔍
            </div>

            <h3 className={styles.stepTitle}>{t("welcome.company.step1Title")}</h3>

            <p className={styles.stepText}>
              {t("welcome.company.step1Body")}
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              ✅
            </div>

            <h3 className={styles.stepTitle}>{t("welcome.company.step2Title")}</h3>

            <p className={styles.stepText}>
              {t("welcome.company.step2Body")}
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              💬
            </div>

            <h3 className={styles.stepTitle}>{t("welcome.company.step3Title")}</h3>

            <p className={styles.stepText}>
              {t("welcome.company.step3Body")}
            </p>
          </article>

          <article className={styles.stepCard}>
            <div className={styles.stepEmoji} aria-hidden="true">
              📊
            </div>

            <h3 className={styles.stepTitle}>{t("welcome.company.step4Title")}</h3>

            <p className={styles.stepText}>
              {t("welcome.company.step4Body")}
            </p>
          </article>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push("/company/register")}
          >{exactUi("Completar verificação")}</button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => router.push("/company/pagamento?plan=BASIC")}
          >{exactUi("Escolher plano")}</button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => router.push("/company/dashboard-empresa")}
          >
            {t("welcome.company.cta")}
          </button>
        </div>

        <p className={styles.note}>
          {t("welcome.company.note")}
        </p>
      </div>
    </div>
  );
}

export default function BoasVindasEmpresaPage() {
  return (
    <Suspense fallback={<PageLoader message={t("welcome.company.loadingFallback")} />}>
      <BoasVindasEmpresaContent />
    </Suspense>
  );
}
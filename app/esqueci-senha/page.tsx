"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
import { t } from "@/lib/i18n/translate";
import { publicLoginHomeHref } from "@/lib/auth/public-login-home";
import styles from "@/app/login/login.module.css";

function EsqueciSenhaContent() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo");
  const loginHref = publicLoginHomeHref({ tipo });

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devToken, setDevToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setDevToken(null);

    if (!email.trim()) {
      setErrorMessage(t("surface.reset.emailRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        token?: string;
      };

      if (!res.ok) {
        setErrorMessage(data.error || t("surface.reset.sendFailed"));
        return;
      }

      setSuccessMessage(
        data.message || t("surface.reset.sent"),
      );
      if (data.token) setDevToken(data.token);
    } catch {
      setErrorMessage(t("surface.reset.requestError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <AuthAtmosphere />
      {loading && <PageLoader message={t("surface.reset.sending")} mode="overlay" />}

      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>
          <p className={styles.subtitle}>
            <span className={styles.accessTag}>{t("surface.reset.title")}</span>
          </p>
          <p className={styles.supportLine}>
            {t("surface.reset.help")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          {successMessage && (
            <p className={styles.error} style={{ color: "#86efac", borderColor: "#166534" }}>
              {successMessage}
            </p>
          )}

          <input
            type="email"
            placeholder={t("surface.auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
          />

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? t("surface.reset.sending") : t("surface.reset.send")}
          </button>

          {devToken && (
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: "#c89b3c" }}>
              {t("surface.reset.dev")}{" "}
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className={styles.forgotLink}>
                {t("surface.reset.openLink")}
              </Link>
            </p>
          )}
        </form>

        <div className={styles.footer}>
          <Link href={loginHref} className={styles.footerLink}>
            {t("surface.reset.backLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<PageLoader message={t("surface.auth.loading")} />}>
      <EsqueciSenhaContent />
    </Suspense>
  );
}

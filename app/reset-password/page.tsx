"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
import { t } from "@/lib/i18n/translate";
import styles from "@/app/login/login.module.css";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      setErrorMessage(t("surface.reset.badLink"));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset?token=${encodeURIComponent(token)}`,
        );
        const data = (await res.json()) as { email?: string; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.email) {
          setTokenValid(false);
          setErrorMessage(data.error || t("surface.reset.badToken"));
        } else {
          setTokenValid(true);
          setEmail(data.email);
        }
      } catch {
        if (!cancelled) {
          setTokenValid(false);
          setErrorMessage(t("surface.reset.cannotValidate"));
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (novaSenha.length < 8) {
      setErrorMessage(t("surface.reset.minLength"));
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErrorMessage(t("surface.reset.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: novaSenha,
          confirmPassword: confirmarSenha,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setErrorMessage(data.error || t("surface.reset.cannotChange"));
        return;
      }
      setSuccessMessage(data.message || t("surface.reset.changed"));
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setErrorMessage(t("surface.reset.changeError"));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <PageLoader message={t("surface.reset.validating")} />;
  }

  return (
    <div className={styles.page}>
      <AuthAtmosphere />
      {loading && <PageLoader message={t("surface.reset.saving")} mode="overlay" />}

      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>
          <p className={styles.subtitle}>
            <span className={styles.accessTag}>{t("surface.reset.newTitle")}</span>
          </p>
          {tokenValid && (
            <p className={styles.supportLine}>{t("surface.reset.newHelp")}</p>
          )}
        </div>

        {!tokenValid ? (
          <div className={styles.form}>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <Link href="/esqueci-senha" className={styles.btnPrimary} style={{ textAlign: "center", textDecoration: "none" }}>
              {t("surface.reset.requestNew")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {email && (
              <p style={{ margin: 0, fontSize: 13, color: "#c89b3c" }}>
                {t("surface.reset.account")} {email}
              </p>
            )}
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            {successMessage && (
              <p className={styles.error} style={{ color: "#86efac" }}>
                {successMessage}
              </p>
            )}

            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("surface.reset.newPassword")}
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={styles.input}
              autoComplete="new-password"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder={t("surface.reset.confirm")}
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className={styles.input}
              autoComplete="new-password"
            />

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              {t("surface.auth.showPassword")}
            </label>

            <button type="submit" disabled={loading || !!successMessage} className={styles.btnPrimary}>
              {loading ? t("surface.reset.saving") : t("surface.reset.redefine")}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>
            {t("surface.reset.backLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader message={t("surface.auth.loading")} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

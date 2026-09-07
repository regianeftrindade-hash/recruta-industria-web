"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
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
      setErrorMessage("Link inválido. Solicite um novo reset de senha.");
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
          setErrorMessage(data.error || "Token inválido ou expirado.");
        } else {
          setTokenValid(true);
          setEmail(data.email);
        }
      } catch {
        if (!cancelled) {
          setTokenValid(false);
          setErrorMessage("Não foi possível validar o link.");
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
      setErrorMessage("A senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErrorMessage("As senhas não conferem.");
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
        setErrorMessage(data.error || "Não foi possível alterar a senha.");
        return;
      }
      setSuccessMessage(data.message || "Senha alterada com sucesso.");
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setErrorMessage("Erro ao alterar a senha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return <PageLoader message="Validando link..." />;
  }

  return (
    <div className={styles.page}>
      {loading && <PageLoader message="Salvando..." mode="overlay" />}

      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>
          <p className={styles.subtitle}>
            <span className={styles.accessTag}>Nova senha</span>
          </p>
        </div>

        {!tokenValid ? (
          <div className={styles.form}>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <Link href="/esqueci-senha" className={styles.btnPrimary} style={{ textAlign: "center", textDecoration: "none" }}>
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {email && (
              <p style={{ margin: 0, fontSize: 13, color: "#c89b3c" }}>
                Conta: {email}
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
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className={styles.input}
              autoComplete="new-password"
            />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar nova senha"
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
              Mostrar senha
            </label>

            <button type="submit" disabled={loading || !!successMessage} className={styles.btnPrimary}>
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <Link href="/login" className={styles.footerLink}>
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

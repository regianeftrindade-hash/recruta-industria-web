"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import styles from "@/app/login/login.module.css";

function EsqueciSenhaContent() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo");
  const loginHref =
    tipo === "empresa"
      ? "/login?tipo=empresa"
      : tipo === "profissional"
        ? "/login?tipo=profissional"
        : "/login";

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
      setErrorMessage("Informe o e-mail da conta.");
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
        setErrorMessage(data.error || "Não foi possível enviar o link.");
        return;
      }

      setSuccessMessage(
        data.message ||
          "Se o e-mail existir, você receberá um link para redefinir a senha.",
      );
      if (data.token) setDevToken(data.token);
    } catch {
      setErrorMessage("Erro ao processar a solicitação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {loading && <PageLoader message="Enviando..." mode="overlay" />}

      <div className={styles.card}>
        <div className={styles.loginHeader}>
          <div className={styles.logoWrap}>
            <LogoRecruta size="sm" as="h1" depth />
          </div>
          <p className={styles.subtitle}>
            <span className={styles.accessTag}>Esqueci a senha</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#f2f2f2" }}>
            Digite o e-mail da sua conta. Enviaremos um link para criar uma nova senha.
          </p>

          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          {successMessage && (
            <p className={styles.error} style={{ color: "#86efac", borderColor: "#166534" }}>
              {successMessage}
            </p>
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            autoComplete="email"
          />

          <button type="submit" disabled={loading} className={styles.btnPrimary}>
            {loading ? "Enviando..." : "Enviar link"}
          </button>

          {devToken && (
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, color: "#c89b3c" }}>
              Ambiente de desenvolvimento —{" "}
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className={styles.forgotLink}>
                abrir link de redefinição
              </Link>
            </p>
          )}
        </form>

        <div className={styles.footer}>
          <Link href={loginHref} className={styles.footerLink}>
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EsqueciSenhaPage() {
  return (
    <Suspense fallback={<PageLoader message="Carregando..." />}>
      <EsqueciSenhaContent />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import styles from "@/app/home.module.css";

type HomeAccessRole = "company" | "professional";

type HomeAccessFormProps = {
  role: HomeAccessRole;
  registerHref: string;
  compact?: boolean;
};

export default function HomeAccessForm({
  role,
  registerHref,
  compact = false,
}: HomeAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isCompany = role === "company";
  const expectedType = isCompany ? "company" : "professional";
  const dashboardPath = isCompany
    ? "/company/dashboard-empresa"
    : "/professional/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !senha) {
      setErrorMessage("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    try {
      // Rate limit e validação de senha ficam no servidor (authorize do NextAuth).
      const result = await signIn("credentials", {
        email,
        password: senha,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        setErrorMessage("Não foi possível entrar.");
        setLoading(false);
        return;
      }

      const typeRes = await fetch("/api/auth/get-user-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await typeRes.json().catch(() => ({}));
      const userType = String(data.userType || "").toLowerCase();

      if (expectedType === "company") {
        if (userType === "company") {
          router.push(dashboardPath);
          return;
        }
        setErrorMessage("Esta conta não é de empresa.");
        setLoading(false);
        return;
      }

      if (userType === "company") {
        setErrorMessage("Esta conta é de empresa.");
        setLoading(false);
        return;
      }

      router.push(dashboardPath);
    } catch {
      setErrorMessage("Erro ao processar login.");
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    setErrorMessage("");

    // Igual ao login: cookie de intenção + signIn("google") do NextAuth.
    if (typeof document !== "undefined") {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `login_intent=${isCompany ? "company" : "professional"}; path=/; max-age=600; SameSite=Lax${secure}`;
    }

    const callbackUrl = `${window.location.origin}${dashboardPath}`;
    void signIn("google", { callbackUrl });
  };

  if (!isCompany) {
    return (
      <div className={`${styles.homeAccess} ${styles.homeAccessPro} ${styles.proLoginPanel}`}>
        <h4 className={styles.proLoginTitle}>LOGIN</h4>
        <form onSubmit={handleSubmit} className={styles.proLoginForm} noValidate>
          <div className={styles.proLoginRow}>
            <input
              id="pro-home-email"
              type="email"
              name="professional-email"
              autoComplete="username"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.proLoginInputPill}
              aria-label="E-mail"
              disabled={loading}
            />
            <input
              id="pro-home-senha"
              type="password"
              name="professional-senha"
              autoComplete="current-password"
              placeholder="SENHA"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={styles.proLoginInputPill}
              aria-label="Senha"
              disabled={loading}
            />
            <div className={styles.proLoginGoogleIconOnly}>
              <GoogleSignInButton onClick={handleGoogle} disabled={loading} />
            </div>
            <button type="submit" className={styles.proLoginAcessarTag} disabled={loading}>
              {loading ? "..." : "Acessar"}
            </button>
            <Link href={registerHref} className={styles.proLoginRegisterTag}>
              Cadastre-se
            </Link>
          </div>

          {errorMessage ? (
            <p className={styles.homeAccessError} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div className={styles.empresaAccessBlock}>
      <div
        className={`${styles.homeAccess} ${compact ? styles.homeAccessCompact : ""} ${styles.homeAccessEmpresa}`}
      >
        <form onSubmit={handleSubmit} className={styles.homeAccessForm} noValidate>
          <div className={styles.homeAccessFields}>
            <span className={styles.empresaAccessTag}>Empresas</span>
            <input
              type="email"
              name={`${role}-email`}
              autoComplete="username"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.homeAccessInput}
              aria-label="E-mail"
              disabled={loading}
            />
            <input
              type="password"
              name={`${role}-senha`}
              autoComplete="current-password"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={styles.homeAccessInput}
              aria-label="Senha"
              disabled={loading}
            />
            <div className={styles.proLoginGoogleIconOnly}>
              <GoogleSignInButton onClick={handleGoogle} disabled={loading} />
            </div>
            <button type="submit" className={styles.cardCta} disabled={loading}>
              {loading ? "..." : "Acessar"}
            </button>
            <Link href={registerHref} className={styles.homeAccessRegister}>
              Cadastre-se
            </Link>
          </div>
          {errorMessage ? (
            <p className={styles.homeAccessError} role="alert">
              {errorMessage}
            </p>
          ) : null}
        </form>
      </div>
      <div className={styles.empresaAccessLine} aria-hidden />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleSignInButton from "@/app/components/GoogleSignInButton";
import HomePasswordEye from "@/app/components/HomePasswordEye";
import { safePostLoginPath } from "@/lib/auth/public-login-home";
import { t } from "@/lib/i18n/translate";
import styles from "@/app/home.module.css";

type HomeAccessRole = "company" | "professional";

type HomeAccessFormProps = {
  role: HomeAccessRole;
  registerHref: string;
  compact?: boolean;
};

function readHomeQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export default function HomeAccessForm({
  role,
  registerHref,
  compact = false,
}: HomeAccessFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isCompany = role === "company";
  const expectedType = isCompany ? "company" : "professional";
  const dashboardPath = isCompany
    ? "/company/dashboard-empresa"
    : "/professional/dashboard";

  useEffect(() => {
    const acesso = readHomeQuery().get("acesso");
    if (!acesso) return;
    const targetId =
      acesso === "empresa"
        ? "acesso-empresa"
        : acesso === "profissional"
          ? "acesso-profissional"
          : null;
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !senha) {
      setErrorMessage(t("surface.home.fillBoth"));
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
        setErrorMessage(t("surface.home.badCredentials"));
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        setErrorMessage(t("surface.home.cannotEnter"));
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

      const postLoginRedirect = safePostLoginPath(readHomeQuery().get("redirect"));

      if (expectedType === "company") {
        if (userType === "company") {
          router.push(postLoginRedirect || dashboardPath);
          return;
        }
        setErrorMessage(t("surface.home.notCompany"));
        setLoading(false);
        return;
      }

      if (userType === "company") {
        setErrorMessage(t("surface.home.isCompany"));
        setLoading(false);
        return;
      }

      router.push(postLoginRedirect || dashboardPath);
    } catch {
      setErrorMessage(t("surface.home.loginError"));
      setLoading(false);
    }
  };

  const forgotHref = isCompany
    ? "/esqueci-senha?tipo=empresa"
    : "/esqueci-senha?tipo=profissional";

  const passwordEye = (
    <HomePasswordEye
      visible={showPassword}
      disabled={loading}
      onToggle={() => setShowPassword((v) => !v)}
      className={`${styles.homePasswordEye} home-password-eye`}
    />
  );

  const handleGoogle = () => {
    setErrorMessage("");

    // Igual ao login: cookie de intenção + signIn("google") do NextAuth.
    if (typeof document !== "undefined") {
      const secure = window.location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `login_intent=${isCompany ? "company" : "professional"}; path=/; max-age=600; SameSite=Lax${secure}`;
    }

    const postLoginRedirect = safePostLoginPath(readHomeQuery().get("redirect"));
    const callbackUrl = `${window.location.origin}${postLoginRedirect || dashboardPath}`;
    void signIn("google", { callbackUrl });
  };

  if (!isCompany) {
    return (
      <div
        id="acesso-profissional"
        className={`${styles.homeAccess} ${styles.homeAccessPro} ${styles.proLoginPanel}`}
      >
        <h4 className={styles.proLoginTitle}>{t("surface.home.login")}</h4>
        <form onSubmit={handleSubmit} className={styles.proLoginForm} noValidate suppressHydrationWarning>
          <div className={styles.proLoginRow}>
            <input
              id="pro-home-email"
              type="email"
              name="professional-email"
              autoComplete="username"
              placeholder={t("surface.home.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.proLoginInputPill}
              aria-label={t("surface.home.emailLabel")}
              disabled={loading}
              suppressHydrationWarning
            />
            <div className={`${styles.homePasswordStack} home-password-stack`}>
              <div className={`${styles.homePasswordField} home-password-field`}>
                <input
                  id="pro-home-senha"
                  type={showPassword ? "text" : "password"}
                  name="professional-senha"
                  autoComplete="current-password"
                  placeholder={t("surface.home.password")}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.proLoginInputPill}
                  aria-label={t("surface.home.passwordLabel")}
                  disabled={loading}
                  suppressHydrationWarning
                />
                {passwordEye}
              </div>
              <Link href={forgotHref} className={`${styles.homeForgotLink} home-forgot-btn`}>
                {t("surface.home.forgot")}
              </Link>
            </div>
            <div className={styles.proLoginGoogleIconOnly}>
              <GoogleSignInButton onClick={handleGoogle} disabled={loading} />
            </div>
            <button type="submit" className={styles.proLoginAcessarTag} disabled={loading}>
              {t("surface.home.enter")}
            </button>
            <Link href={registerHref} className={styles.proLoginRegisterTag}>
              {t("surface.home.register")}
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
    <div id="acesso-empresa" className={styles.empresaAccessBlock}>
      <div
        className={`${styles.homeAccess} ${compact ? styles.homeAccessCompact : ""} ${styles.homeAccessEmpresa}`}
      >
        <form onSubmit={handleSubmit} className={styles.homeAccessForm} noValidate suppressHydrationWarning>
          <div className={styles.homeAccessFields}>
            <span className={styles.empresaAccessTag}>{t("surface.home.companies")}</span>
            <input
              type="email"
              name={`${role}-email`}
              autoComplete="username"
              placeholder={t("surface.home.emailLabel")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.homeAccessInput}
              aria-label={t("surface.home.emailLabel")}
              disabled={loading}
              suppressHydrationWarning
            />
            <div className={`${styles.homePasswordStack} home-password-stack`}>
              <div className={`${styles.homePasswordField} home-password-field`}>
                <input
                  type={showPassword ? "text" : "password"}
                  name={`${role}-senha`}
                  autoComplete="current-password"
                  placeholder={t("surface.home.passwordLabel")}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={styles.homeAccessInput}
                  aria-label={t("surface.home.passwordLabel")}
                  disabled={loading}
                  suppressHydrationWarning
                />
                {passwordEye}
              </div>
              <Link href={forgotHref} className={`${styles.homeForgotLink} home-forgot-btn`}>
                {t("surface.home.forgot")}
              </Link>
            </div>
            <div className={styles.proLoginGoogleIconOnly}>
              <GoogleSignInButton onClick={handleGoogle} disabled={loading} />
            </div>
            <button type="submit" className={styles.cardCta} disabled={loading}>
              {t("surface.home.enter")}
            </button>
            <Link href={registerHref} className={styles.homeAccessRegister}>
              {t("surface.home.register")}
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

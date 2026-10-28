"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import ProfessionalVitrinePitch from "@/components/auth/ProfessionalVitrinePitch";
import loginStyles from "@/app/login/login.module.css";
import { validatePasswordStrength } from "@/lib/password-strength";
import { safeJobReturnPath } from "@/lib/jobs/public-job-link";
import { isValidCPF, isValidPhoneBR } from "@/lib/security";

const SIMPLE_STORAGE_KEY = "dadosCadastroSimples";

function chavePorEmail(base: string, email: string): string {
  const slug = email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
  return `${base}__${slug}`;
}

function mascaraCpf(value: string): string {
  const digitos = value.replace(/\D/g, "").slice(0, 11);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

function mascaraTelefone(value: string): string {
  const digitos = value.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function IconeOlho({ aberto }: { aberto: boolean }) {
  if (aberto) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function CadastroRapidoProfissionalPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const nomeTrim = nome.trim();
    const emailTrim = email.toLowerCase().trim();
    const cpfLimpo = cpf.replace(/\D/g, "");

    if (nomeTrim.length < 2) {
      setErrorMessage("Informe seu nome completo.");
      return;
    }
    if (!isValidCPF(cpfLimpo)) {
      setErrorMessage("CPF inválido.");
      return;
    }
    if (!emailTrim.includes("@")) {
      setErrorMessage("Informe um e-mail válido.");
      return;
    }
    if (!isValidPhoneBR(telefone)) {
      setErrorMessage("Telefone inválido. Informe DDD + número.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Senhas não conferem.");
      return;
    }
    const strength = validatePasswordStrength(password);
    if (!strength.isStrong) {
      setErrorMessage(
        strength.feedback?.[0] || "Senha não atende aos requisitos de segurança.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nomeTrim,
          cpf: cpfLimpo,
          email: emailTrim,
          telefone,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data.error || "Não foi possível criar a conta.");
        setLoading(false);
        return;
      }

      try {
        localStorage.setItem(
          chavePorEmail(SIMPLE_STORAGE_KEY, emailTrim),
          JSON.stringify({
            nome: nomeTrim,
            cpf,
            email: emailTrim,
            telefone,
            password,
            _ownerEmail: emailTrim,
          }),
        );
      } catch {
        /* ignore */
      }

      const sign = await signIn("credentials", {
        email: emailTrim,
        password,
        redirect: false,
      });

      if (sign?.error) {
        setErrorMessage(
          "Conta criada, mas o login automático falhou. Entre com seu e-mail e senha.",
        );
        setLoading(false);
        const back = safeJobReturnPath(new URLSearchParams(window.location.search).get("redirect"));
        router.push(back
          ? `/login?tipo=profissional&redirect=${encodeURIComponent(back)}`
          : "/login?tipo=profissional");
        return;
      }

      const back = safeJobReturnPath(new URLSearchParams(window.location.search).get("redirect"));
      router.replace(back ?? "/professional/dashboard");
    } catch {
      setErrorMessage("Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className={loginStyles.page}>
      <div className={loginStyles.atmosphere} aria-hidden />
      <div className={loginStyles.atmosphereGlow} aria-hidden />
      {loading && <PageLoader message="Criando sua conta..." mode="overlay" />}

      <div className={loginStyles.authShell}>
        <ProfessionalVitrinePitch />

        <div className={loginStyles.card}>
          <div className={loginStyles.loginHeader}>
            <div className={loginStyles.logoWrap}>
              <LogoRecruta size="sm" as="h1" depth />
            </div>
            <p className={loginStyles.subtitle}>
              <span className={loginStyles.accessTag}>Cadastro rápido</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className={loginStyles.form}>
            {errorMessage ? (
              <p className={loginStyles.error} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-nome">
                Nome completo
              </label>
              <input
                id="cadastro-nome"
                className={loginStyles.input}
                type="text"
                autoComplete="name"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-cpf">
                CPF
              </label>
              <input
                id="cadastro-cpf"
                className={loginStyles.input}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(mascaraCpf(e.target.value))}
                required
              />
            </div>

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-email">
                E-mail
              </label>
              <input
                id="cadastro-email"
                className={loginStyles.input}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-telefone">
                Telefone
              </label>
              <input
                id="cadastro-telefone"
                className={loginStyles.input}
                type="tel"
                autoComplete="tel"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                required
              />
            </div>

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-senha">
                Senha
              </label>
              <div className={loginStyles.passwordField}>
                <input
                  id="cadastro-senha"
                  className={loginStyles.input}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={loginStyles.passwordEyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <IconeOlho aberto={showPassword} />
                </button>
              </div>
            </div>

            <div className={loginStyles.fieldGroup}>
              <label className={loginStyles.fieldLabel} htmlFor="cadastro-confirma">
                Confirmar senha
              </label>
              <div className={loginStyles.passwordField}>
                <input
                  id="cadastro-confirma"
                  className={loginStyles.input}
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className={loginStyles.passwordEyeBtn}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                  title={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  <IconeOlho aberto={showConfirmPassword} />
                </button>
              </div>
            </div>

            <button type="submit" className={loginStyles.btnPrimary} disabled={loading}>
              Criar conta
            </button>
          </form>

          <div className={loginStyles.footer}>
            <Link href="/" className={loginStyles.footerLink}>
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

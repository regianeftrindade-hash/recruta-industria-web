"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LogoRecruta from "@/app/components/LogoRecruta";
import PageLoader from "@/app/components/PageLoader";
import ProfessionalVitrinePitch from "@/components/auth/ProfessionalVitrinePitch";
import loginStyles from "@/app/login/login.module.css";
import { validatePasswordStrength } from "@/lib/password-strength";
import { safeJobReturnPath } from "@/lib/jobs/public-job-link";
import ResumeToolkit from "@/components/curriculum/ResumeToolkit";
import { sanitizeResumeDraft, type ResumeDraft } from "@/lib/curriculum/resume-draft";

const SIMPLE_STORAGE_KEY = "dadosCadastroSimples";
const AVISO_CURRICULO_PENDENTE = "O currículo ainda não foi salvo no perfil. Conclua o cadastro nesta página. Se você sair agora, o arquivo será perdido.";

function chavePorEmail(base: string, email: string): string {
  const slug = email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
  return `${base}__${slug}`;
}

export default function CadastroSimplesProfissionalPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const pendingResumeRef = useRef<File | null>(null);
  const pendingDraftRef = useRef<ResumeDraft | null>(null);
  const [curriculoNaMemoria, setCurriculoNaMemoria] = useState(false);

  useEffect(() => {
    if (!curriculoNaMemoria || loading || contaCriada) return;
    const avisarSaida = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const avisarLink = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("blob:") || href.startsWith("data:")) return;
      if (window.confirm(AVISO_CURRICULO_PENDENTE)) return;
      event.preventDefault();
      event.stopPropagation();
    };
    window.addEventListener("beforeunload", avisarSaida);
    document.addEventListener("click", avisarLink, true);
    return () => {
      window.removeEventListener("beforeunload", avisarSaida);
      document.removeEventListener("click", avisarLink, true);
    };
  }, [curriculoNaMemoria, loading, contaCriada]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const nomeTrim = nome.trim();
    const emailTrim = email.toLowerCase().trim();

    if (nomeTrim.length < 2) {
      setErrorMessage("Informe seu nome completo.");
      return;
    }
    if (!emailTrim.includes("@")) {
      setErrorMessage("Informe um e-mail válido.");
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
          email: emailTrim,
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
            email: emailTrim,
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

      const falhaCurriculo = await associarCurriculoPendente();
      if (falhaCurriculo) {
        setContaCriada(true);
        setErrorMessage(falhaCurriculo);
        setLoading(false);
        return;
      }

      const back = safeJobReturnPath(new URLSearchParams(window.location.search).get("redirect"));
      router.replace(back ?? "/professional/dashboard");
    } catch {
      setErrorMessage("Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  async function associarCurriculoPendente(): Promise<string | null> {
    const draft = pendingDraftRef.current;
    if (draft?.nome) {
      const savedFields = await fetch("/api/professional/curriculo/gerar", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, saveAsMain: false }),
      });
      if (!savedFields.ok) {
        const data = await savedFields.json().catch(() => ({}));
        return data.error || "A conta foi criada, mas os dados do currículo não foram salvos no perfil.";
      }
    }

    const file = pendingResumeRef.current;
    if (!file) return null;
    const body = new FormData();
    body.set("file", file);
    body.set("type", "curriculos");
    const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
    const uploadData = await uploaded.json().catch(() => ({}));
    if (!uploaded.ok || !uploadData?.file?.path) {
      return uploadData?.error || "A conta foi criada, mas o arquivo do currículo não foi salvo.";
    }
    const saved = await fetch("/api/professional/curriculo", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: uploadData.file.path }),
    });
    if (!saved.ok) {
      const data = await saved.json().catch(() => ({}));
      return data.error || "A conta foi criada, mas o currículo não foi associado ao perfil.";
    }
    pendingResumeRef.current = null;
    return null;
  }

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
            <span className={loginStyles.accessTag}>Cadastro Profissional</span>
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
            <label className={loginStyles.fieldLabel} htmlFor="cadastro-senha">
              Criar senha
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
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
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
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {contaCriada ? (
            <Link href="/professional/dashboard" className={loginStyles.btnPrimary}>
              Ir ao painel
            </Link>
          ) : (
            <button type="submit" className={loginStyles.btnPrimary} disabled={loading}>
              Criar conta
            </button>
          )}
        </form>

        <ResumeToolkit
          variant="register"
          authenticated={false}
          getLocalDraft={() => sanitizeResumeDraft({ nome, email })}
          onDraftApplied={(draft) => {
            pendingDraftRef.current = draft;
            if (draft.nome) setNome(draft.nome);
            if (draft.email) setEmail(draft.email);
          }}
          onHoldFile={(file) => {
            pendingResumeRef.current = file;
            setCurriculoNaMemoria(Boolean(file));
          }}
        />

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

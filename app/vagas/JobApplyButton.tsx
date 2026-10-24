"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ResumeToolkit from "@/components/curriculum/ResumeToolkit";
import { describeApplyPanel, type ApplicantContact, type ProfessionalPlan } from "@/lib/jobs/application-access";
import type { ApplicationMode } from "@/lib/jobs/job-posting";
import CopyTextButton from "./CopyTextButton";
import styles from "./vagas.module.css";

type ApplyState = {
  authenticated: boolean;
  applied: boolean;
  canApply: boolean;
  blockReason: string | null;
  plan: ProfessionalPlan | null;
  applicationMode: ApplicationMode;
  contact: ApplicantContact | null;
  hasResume: boolean;
  resumeName: string | null;
};

export default function JobApplyButton({
  jobId,
  mode,
  externalApplyUrl,
  autoOpen,
}: {
  jobId: string;
  mode: ApplicationMode;
  externalApplyUrl: string | null;
  autoOpen: boolean;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [open, setOpen] = useState(false);
  const [convidarConta, setConvidarConta] = useState(false);

  async function loadState(verify = false) {
    const response = await fetch(`/api/vagas/${jobId}/candidatura${verify ? "?verificar=1" : ""}`, { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Não foi possível consultar a candidatura.");
    }
    const next = data as ApplyState;
    setState(next);
    return next;
  }

  async function sendAutomatic() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/vagas/${jobId}/candidatar`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        const text = data.error || "A candidatura é feita com uma conta de profissional.";
        setError(text);
        setOutcome(text);
        return;
      }

      if (data.code === "RESUME_REQUIRED" || data.code === "PREMIUM_REQUIRED" || data.code === "MANUAL_CHANNEL" || data.code === "EMAIL_BUSY") {
        const text = data.error || "Não foi possível concluir a candidatura.";
        setError(text);
        setOutcome(text);
        return;
      }

      if (response.status === 409 || data.alreadyApplied) {
        const text = mode === "EMAIL"
          ? "Você já enviou sua candidatura para esta vaga."
          : "Você já registrou candidatura nesta vaga.";
        setMessage(text);
        setOutcome(text);
        setOpen(false);
        setState((current) => current ? {
          ...current,
          authenticated: true,
          applied: true,
          canApply: false,
          contact: null,
        } : current);
        return;
      }

      if (!response.ok) {
        const text = data.error || "Não foi possível registrar a candidatura.";
        setError(text);
        setOutcome(text);
        return;
      }

      const text = data.message || (mode === "EMAIL"
        ? "Candidatura enviada com sucesso! Seu currículo foi encaminhado para o processo seletivo desta vaga."
        : "Candidatura registrada.");
      setMessage(text);
      setOutcome(text);
      setOpen(false);
      setState((current) => current ? {
        ...current,
        authenticated: true,
        applied: true,
        canApply: false,
        contact: null,
      } : current);
    } catch {
      const text = "Não foi possível registrar a candidatura.";
      setError(text);
      setOutcome(text);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const current = await loadState(autoOpen);
        if (cancelled || !autoOpen || current.applied) return;
        if (!current.authenticated) {
          setConvidarConta(true);
          return;
        }
        const currentMode = current.applicationMode || mode;
        if (currentMode === "INTERNAL" && current.authenticated && current.canApply) {
          await sendAutomatic();
          return;
        }
        if (current.authenticated) setOpen(true);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível consultar a candidatura.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // A candidatura interna automática acontece uma vez, ao voltar do cadastro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, autoOpen]);

  const currentMode = state?.applicationMode || mode;
  const panel = describeApplyPanel({
    mode: currentMode,
    plan: state?.plan ?? null,
    contact: state?.contact || (currentMode === "EXTERNAL" && externalApplyUrl
      ? { kind: "url", value: externalApplyUrl }
      : null),
    hasResume: state?.hasResume === true,
  });
  const applied = state?.applied === true;
  const blocked = state?.canApply === false && !applied && !panel.contact && !panel.automatic;

  async function onApply() {
    setError("");
    let current = state;
    try {
      current = await loadState(true);
    } catch (loadError) {
      const text = loadError instanceof Error ? loadError.message : "Não foi possível consultar a candidatura.";
      setError(text);
      setOutcome(text);
      return;
    }

    if (!current.authenticated) {
      setConvidarConta(true);
      setOpen(false);
      setError("");
      setOutcome("");
      return;
    }
    setConvidarConta(false);

    if (current.blockReason && current.canApply === false && !current.applied) {
      setError(current.blockReason);
      setOutcome(current.blockReason);
      return;
    }

    if (current.applied) {
      const text = (current.applicationMode || mode) === "EMAIL"
        ? "Você já enviou sua candidatura para esta vaga."
        : "Você já registrou candidatura nesta vaga.";
      setMessage(text);
      setOutcome(text);
      return;
    }

    const activeMode = current.applicationMode || mode;
    if (activeMode === "INTERNAL") {
      await sendAutomatic();
      return;
    }

    setOpen(true);
    setOutcome("");
  }

  const retornoCandidatura = `/vagas/${jobId}?candidatar=1`;
  const cadastroHref = `/professional/cadastro?redirect=${encodeURIComponent(retornoCandidatura)}`;
  const loginHref = `/login?tipo=profissional&redirect=${encodeURIComponent(retornoCandidatura)}`;

  const buttonLabel = busy
    ? (currentMode === "EMAIL" && panel.automatic ? "Enviando..." : currentMode === "INTERNAL" ? "Registrando..." : "Candidatar-se")
    : outcome
      ? outcome
      : applied
        ? (currentMode === "EMAIL" ? "Candidatura enviada" : "Candidatura registrada")
        : "Candidatar-se";

  return (
    <div className={styles.apply}>
      <button
        type="button"
        className="ri-btn-3d-gold"
        onClick={() => {
          void onApply();
        }}
        disabled={busy || applied || blocked}
      >
        {buttonLabel}
      </button>
      {convidarConta && !state?.authenticated && !applied ? (
        <div className={styles.contactBox}>
          <p className={styles.method}>Você ainda não tem cadastro?</p>
          <p className={styles.note}>
            A vaga que você acessou continua disponível. Crie sua conta gratuita para continuar sua candidatura e começar seu perfil profissional. A contratação do Premium é opcional e não é necessária para se candidatar.
          </p>
          <div className={styles.contactActions}>
            <Link className="ri-btn-3d-gold" href={cadastroHref}>
              Criar conta gratuita
            </Link>
            <Link className={styles.externalLink} href={loginHref}>
              Entrar ou usar Google
            </Link>
          </div>
        </div>
      ) : null}
      {open && !applied && state?.authenticated ? (
        <div className={styles.contactBox}>
          <p className={styles.method}>{panel.methodLabel}</p>
          {panel.automatic && panel.needsResume ? (
            <ResumeToolkit
              variant="apply"
              missing
              onSaved={() => {
                setMessage("Currículo salvo no perfil. A candidatura ainda não foi enviada.");
                setError("");
                void loadState(true);
              }}
              onCancel={() => {
                setOpen(false);
                setMessage("");
                setError("");
              }}
            />
          ) : (
            <>
              {panel.contact ? (
                <p className={styles.contactValue}>{panel.contact.value}</p>
              ) : panel.automatic ? null : (
                <p className={styles.error}>A empresa ainda não informou o dado deste método de candidatura.</p>
              )}
              <div className={styles.contactActions}>
                {panel.contact && panel.copyLabel ? (
                  <CopyTextButton value={panel.contact.value} label={panel.copyLabel} />
                ) : null}
                {panel.externalLink ? (
                  <a className={styles.externalLink} href={panel.externalLink} target="_blank" rel="noopener noreferrer">
                    Acessar site
                  </a>
                ) : null}
                {panel.automatic ? (
                  <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => void sendAutomatic()}>
                    {busy ? "Enviando..." : "Enviar candidatura"}
                  </button>
                ) : null}
              </div>
              {panel.automatic ? (
                <ResumeToolkit
                  variant="apply"
                  missing={false}
                  resumeName={state?.resumeName}
                  onSaved={() => {
                    setMessage("Currículo salvo no perfil. A candidatura ainda não foi enviada.");
                    setError("");
                    void loadState(true);
                  }}
                />
              ) : null}
              <p className={styles.note}>{panel.detail}</p>
            </>
          )}
        </div>
      ) : null}
      {!open && currentMode === "INTERNAL" ? (
        <p className={styles.note}>{panel.detail}</p>
      ) : null}
      {blocked && state?.blockReason ? <p className={styles.error}>{state.blockReason}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

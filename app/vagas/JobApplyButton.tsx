"use client";

import { useEffect, useState } from "react";
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

  async function loadState() {
    const response = await fetch(`/api/vagas/${jobId}/candidatura`, { credentials: "include" });
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
        const current = await loadState();
        if (cancelled || !autoOpen || current.applied) return;
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
      current = await loadState();
    } catch (loadError) {
      const text = loadError instanceof Error ? loadError.message : "Não foi possível consultar a candidatura.";
      setError(text);
      setOutcome(text);
      return;
    }

    if (!current.authenticated) {
      if ((current.applicationMode || mode) === "EXTERNAL" && externalApplyUrl) {
        setOpen(true);
        return;
      }
      const text = "Entre com uma conta de profissional para se candidatar.";
      setError(text);
      setOutcome(text);
      return;
    }

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
      {open && !applied ? (
        <div className={styles.contactBox}>
          <p className={styles.method}>{panel.methodLabel}</p>
          {panel.contact ? (
            <p className={styles.contactValue}>{panel.contact.value}</p>
          ) : (
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
            {panel.automatic && !panel.needsResume ? (
              <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => void sendAutomatic()}>
                {busy ? "Enviando..." : "Enviar candidatura"}
              </button>
            ) : null}
            {panel.automatic ? (
              <a className={styles.resumeLink} href={`/vagas/${jobId}/curriculo`}>
                {panel.needsResume ? "Anexar currículo em PDF ou DOCX" : "Substituir currículo"}
              </a>
            ) : null}
          </div>
          {panel.automatic && !panel.needsResume && state?.resumeName ? (
            <p className={styles.note}>{state.resumeName} salvo no perfil. Você pode substituir antes de enviar.</p>
          ) : null}
          <p className={styles.note}>{panel.detail}</p>
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

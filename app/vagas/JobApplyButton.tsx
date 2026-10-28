"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeToolkit from "@/components/curriculum/ResumeToolkit";
import { describeApplyPanel, type ApplicantContact, type ProfessionalPlan } from "@/lib/jobs/application-access";
import { hrefForShownContact } from "@/lib/jobs/job-text-links";
import type { ApplicationMode } from "@/lib/jobs/job-posting";
import CopyTextButton from "./CopyTextButton";
import JobText from "./JobText";
import styles from "./vagas.module.css";

function ContactLink({ contact }: { contact: ApplicantContact }) {
  const href = hrefForShownContact(contact.kind, contact.value);
  if (!href) return contact.value;
  const external = href.startsWith("http");
  return (
    <a
      className={styles.contactValueLink}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {contact.value}
    </a>
  );
}

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
  howToApply,
}: {
  jobId: string;
  mode: ApplicationMode;
  externalApplyUrl: string | null;
  autoOpen: boolean;
  howToApply: string | null;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [open, setOpen] = useState(false);
  const [showHow, setShowHow] = useState(autoOpen && Boolean(howToApply));
  const router = useRouter();

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
          router.replace(`/professional/cadastro?redirect=${encodeURIComponent(`/vagas/${jobId}?candidatar=1`)}`);
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
    setShowHow(Boolean(howToApply));
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
      router.push(`/professional/cadastro?redirect=${encodeURIComponent(retornoCandidatura)}`);
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

  const retornoCandidatura = `/vagas/${jobId}?candidatar=1`;

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
      {showHow && howToApply ? (
        <section className={styles.section}>
          <h2>Como se candidatar</h2>
          <JobText text={howToApply} />
        </section>
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
                <p className={styles.contactValue}>
                  <ContactLink contact={panel.contact} />
                </p>
              ) : panel.automatic ? null : (
                <p className={styles.error}>A empresa ainda não informou o dado deste método de candidatura.</p>
              )}
              <div className={styles.contactActions}>
                {panel.contact && panel.copyLabel ? (
                  <CopyTextButton value={panel.contact.value} label={panel.copyLabel} />
                ) : null}
                {panel.externalLink ? (
                  <a className={`${styles.externalLink} ri-btn-3d-gold`} href={panel.externalLink} target="_blank" rel="noopener noreferrer">
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

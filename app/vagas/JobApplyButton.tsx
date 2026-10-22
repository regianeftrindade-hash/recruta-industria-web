"use client";

import { useEffect, useState } from "react";
import { publicSignupPath } from "@/lib/jobs/public-job-link";
import styles from "./vagas.module.css";

type ApplyState = {
  authenticated: boolean;
  applied: boolean;
  canApply: boolean;
  blockReason: string | null;
};

export default function JobApplyButton({
  jobId,
  autoApply,
}: {
  jobId: string;
  autoApply: boolean;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [error, setError] = useState("");
  const [needsResume, setNeedsResume] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState("");

  async function loadState() {
    const response = await fetch(`/api/vagas/${jobId}/candidatura`, { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Não foi possível consultar a candidatura.");
    }
    setState(data as ApplyState);
    return data as ApplyState;
  }

  async function apply() {
    setBusy(true);
    setError("");
    setNeedsResume(false);
    try {
      const response = await fetch(`/api/vagas/${jobId}/candidatar`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = publicSignupPath(jobId);
        return;
      }

      if (response.ok && typeof data.whatsappUrl === "string" && data.whatsappUrl.startsWith("https://wa.me/")) {
        window.location.href = data.whatsappUrl;
        return;
      }

      if (response.status === 403) {
        setError(data.error || "A candidatura é feita com uma conta de profissional.");
        return;
      }

      if (data.code === "RESUME_REQUIRED") {
        setNeedsResume(true);
        setError("Anexe seu currículo em PDF ao perfil para se candidatar.");
        return;
      }

      if (data.code === "EMAIL_BUSY") {
        setError("O envio desta candidatura já está em andamento.");
        return;
      }

      if (response.status === 409 || data.alreadyApplied) {
        setOutcome("Candidatura enviada");
        setState({
          authenticated: true,
          applied: true,
          canApply: false,
          blockReason: null,
        });
        return;
      }

      if (!response.ok) {
        setError("Não foi possível registrar a candidatura.");
        return;
      }

      setOutcome("Candidatura enviada");
      setState({
        authenticated: true,
        applied: true,
        canApply: false,
        blockReason: null,
      });
    } catch {
      setError("Não foi possível registrar a candidatura.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const current = await loadState();
        if (cancelled || !autoApply || current.applied || current.canApply === false) return;
        await apply();
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Não foi possível consultar a candidatura.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // A candidatura automática acontece uma vez, ao voltar do login.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, autoApply]);

  const applied = state?.applied === true;
  const blocked = state?.canApply === false && !applied;

  return (
    <div className={styles.apply}>
      <button
        type="button"
        onClick={() => {
          void apply();
        }}
        disabled={busy || applied}
      >
        {busy ? "Enviando..." : outcome || (applied ? "Candidatura enviada" : "Candidatar-se")}
      </button>
      {needsResume ? (
        <p className={styles.note}>
          <a className={styles.resumeLink} href={`/vagas/${jobId}/curriculo`}>Anexar currículo em PDF</a>
        </p>
      ) : null}
      {blocked && state?.blockReason ? <p className={styles.error}>{state.blockReason}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import styles from "./vagas.module.css";

type ApplyState = {
  authenticated: boolean;
  applied: boolean;
  canApply: boolean;
  blockReason: string | null;
};

export default function JobApplyButton({
  jobId,
  mode,
  autoApply,
}: {
  jobId: string;
  mode: "INTERNAL" | "EMAIL";
  autoApply: boolean;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsResume, setNeedsResume] = useState(false);
  const [busy, setBusy] = useState(false);

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

      if (response.status === 401 || response.status === 403) {
        setError(data.error || "A candidatura é feita com a conta de profissional que já está aberta.");
        return;
      }

      if (data.code === "RESUME_REQUIRED") {
        setNeedsResume(true);
        setError(data.error || "Para se candidatar a esta vaga por e-mail, anexe seu currículo em PDF ao seu perfil.");
        return;
      }

      if (data.code === "EMAIL_BUSY") {
        setError(data.error || "O envio desta candidatura já está em andamento.");
        return;
      }

      if (response.status === 409 || data.alreadyApplied) {
        setMessage(mode === "EMAIL"
          ? "Você já enviou sua candidatura para esta vaga."
          : "Você já registrou candidatura nesta vaga.");
        setState({
          authenticated: true,
          applied: true,
          canApply: false,
          blockReason: null,
        });
        return;
      }

      if (!response.ok) {
        setError(data.error || "Não foi possível registrar a candidatura.");
        return;
      }

      setMessage(data.message || "Candidatura registrada.");
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
        {busy
          ? (mode === "EMAIL" ? "Enviando..." : "Registrando...")
          : applied
            ? (mode === "EMAIL" ? "Candidatura enviada" : "Candidatura registrada")
            : "Candidatar-se"}
      </button>
      <p className={styles.note}>
        {mode === "EMAIL"
          ? "Ao clicar, o currículo em PDF é enviado para o processo seletivo. Se não houver PDF salvo, o perfil do site é enviado por e-mail. O e-mail da empresa não aparece aqui."
          : "A candidatura fica registrada aqui no Recruta Indústria."}
      </p>
      {needsResume ? (
        <p className={styles.note}>
          <a className={styles.resumeLink} href={`/vagas/${jobId}/curriculo`}>Anexar currículo em PDF</a>
        </p>
      ) : null}
      {blocked && state?.blockReason ? <p className={styles.error}>{state.blockReason}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

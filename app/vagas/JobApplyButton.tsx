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
  autoApply,
}: {
  jobId: string;
  autoApply: boolean;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loginHref = `/login?tipo=profissional&redirect=${encodeURIComponent(`/vagas/${jobId}?candidatar=1`)}`;

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
    try {
      const response = await fetch(`/api/vagas/${jobId}/candidatar`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = loginHref;
        return;
      }

      if (response.status === 409 || data.alreadyApplied) {
        setMessage("Você já registrou candidatura nesta vaga.");
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
      <button type="button" onClick={() => void apply()} disabled={busy || applied || blocked}>
        {busy ? "Registrando..." : applied ? "Candidatura registrada" : "Candidatar-se"}
      </button>
      <p className={styles.note}>
        O botão registra sua candidatura no Recruta Indústria. Se as instruções pedirem o currículo por e-mail, esse envio é feito por você, à parte.
      </p>
      {blocked && state?.blockReason ? <p className={styles.error}>{state.blockReason}</p> : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!state?.authenticated && !applied ? (
        <p className={styles.note}>
          Sem conta? O login também leva ao cadastro de profissional já existente.
        </p>
      ) : null}
    </div>
  );
}

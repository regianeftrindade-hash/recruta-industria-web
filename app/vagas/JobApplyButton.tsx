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
  mode,
  autoApply,
}: {
  jobId: string;
  mode: "INTERNAL" | "EMAIL" | "WHATSAPP";
  autoApply: boolean;
}) {
  const [state, setState] = useState<ApplyState | null>(null);
  const [message, setMessage] = useState("");
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
        const text = data.message || "Abra o WhatsApp para enviar seu currículo.";
        setMessage(text);
        setOutcome(text);
        window.location.href = data.whatsappUrl;
        return;
      }

      if (response.status === 403) {
        const text = data.error || "A candidatura é feita com uma conta de profissional.";
        setError(text);
        setOutcome(text);
        return;
      }

      if (data.code === "RESUME_REQUIRED") {
        const text = data.error || "Para se candidatar a esta vaga por e-mail, anexe seu currículo em PDF ao seu perfil.";
        setNeedsResume(true);
        setError(text);
        setOutcome(text);
        return;
      }

      if (data.code === "EMAIL_BUSY") {
        const text = data.error || "O envio desta candidatura já está em andamento.";
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
        setState({
          authenticated: true,
          applied: true,
          canApply: false,
          blockReason: null,
        });
        return;
      }

      if (!response.ok) {
        const text = data.error || "Não foi possível registrar a candidatura.";
        setError(text);
        setOutcome(text);
        return;
      }

      const text = data.message || "Candidatura registrada.";
      setMessage(text);
      setOutcome(text);
      setState({
        authenticated: true,
        applied: true,
        canApply: false,
        blockReason: null,
      });
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
          ? (mode === "EMAIL" ? "Enviando..." : mode === "WHATSAPP" ? "Abrindo WhatsApp..." : "Registrando...")
          : outcome
            ? outcome
            : applied
              ? (mode === "EMAIL" ? "Candidatura enviada" : mode === "WHATSAPP" ? "Currículo pronto para o WhatsApp" : "Candidatura registrada")
              : "Candidatar-se"}
      </button>
      <p className={styles.note}>
        {mode === "EMAIL"
          ? "Ao clicar, o currículo em PDF é enviado por e-mail. Se não houver PDF, o cadastro do site é enviado. O e-mail da empresa não aparece aqui."
          : mode === "WHATSAPP"
            ? "Ao clicar, o currículo do site abre no WhatsApp da empresa. O número não aparece nesta página."
            : "A candidatura fica somente na página da empresa."}
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

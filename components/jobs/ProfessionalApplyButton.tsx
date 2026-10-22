"use client";

import { useState } from "react";
import type { ApplicationMode } from "@/lib/jobs/job-posting";

/** Candidatura por e-mail ou pelo site, só quando o profissional clica. */
export default function ProfessionalApplyButton({
  jobId,
  mode,
}: {
  jobId: string;
  mode: Extract<ApplicationMode, "EMAIL" | "INTERNAL">;
}) {
  const [label, setLabel] = useState("Candidatar-se");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function apply() {
    if (busy || done) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/vagas/${jobId}/candidatar`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      const text = String(data.message || data.error || "");
      if (response.ok || response.status === 409) {
        setDone(true);
        setLabel(text || (mode === "EMAIL" ? "Candidatura enviada." : "Candidatura registrada."));
        return;
      }
      setLabel(text || "Não foi possível candidatar.");
    } catch {
      setLabel("Não foi possível candidatar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={() => void apply()} disabled={busy || done}>
      {busy ? (mode === "EMAIL" ? "Enviando..." : "Registrando...") : label}
    </button>
  );
}

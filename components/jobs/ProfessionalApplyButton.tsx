"use client";

import { useState } from "react";

/** O destino fica no servidor, conforme a vaga. O botão não mostra e-mail nem WhatsApp. */
export default function ProfessionalApplyButton({
  jobId,
}: {
  jobId: string;
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
      if (response.ok && typeof data.whatsappUrl === "string" && data.whatsappUrl.startsWith("https://wa.me/")) {
        window.location.href = data.whatsappUrl;
        return;
      }
      if (response.ok || response.status === 409) {
        setDone(true);
        setLabel("Candidatura enviada");
        return;
      }
      setLabel("Não foi possível candidatar.");
    } catch {
      setLabel("Não foi possível candidatar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={() => void apply()} disabled={busy || done}>
      {busy ? "Enviando..." : label}
    </button>
  );
}

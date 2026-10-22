"use client";

import { useState } from "react";
import WhatsAppApplyHandoff from "@/components/jobs/WhatsAppApplyHandoff";
import { isWhatsAppApplyUrl } from "@/lib/jobs/public-job-link";

/** O destino fica no servidor, conforme a vaga. O botão não mostra e-mail nem WhatsApp. */
export default function ProfessionalApplyButton({
  jobId,
}: {
  jobId: string;
}) {
  const [label, setLabel] = useState("Candidatar-se");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [whatsapp, setWhatsapp] = useState<{ url: string; hasResume: boolean } | null>(null);

  async function apply() {
    if (busy || done) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/vagas/${jobId}/candidatar`, {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && isWhatsAppApplyUrl(data.whatsappUrl)) {
        setWhatsapp({ url: data.whatsappUrl, hasResume: data.hasResume === true });
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

  if (whatsapp) {
    return (
      <WhatsAppApplyHandoff
        jobId={jobId}
        url={whatsapp.url}
        hasResume={whatsapp.hasResume}
        onClose={() => setWhatsapp(null)}
      />
    );
  }

  return (
    <button type="button" onClick={() => void apply()} disabled={busy || done}>
      {busy ? "Enviando..." : label}
    </button>
  );
}

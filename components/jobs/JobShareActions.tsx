"use client";

import { useState } from "react";
import { facebookShareUrl, publicJobUrl, whatsAppShareUrl } from "@/lib/jobs/public-job-link";

export default function JobShareActions({
  jobId,
  title,
  className,
}: {
  jobId: string;
  title: string;
  className?: string;
}) {
  const [message, setMessage] = useState("");

  async function copyLink() {
    const url = publicJobUrl(jobId);
    try {
      if (!navigator.clipboard?.writeText) {
        setMessage("Não foi possível copiar o link.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Link da vaga copiado.");
    } catch {
      setMessage("Não foi possível copiar o link.");
    }
  }

  return (
    <div className={className}>
      <button type="button" onClick={() => void copyLink()}>
        Copiar link
      </button>
      <a href={whatsAppShareUrl(title, jobId)} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a href={facebookShareUrl(jobId)} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      {message ? <span>{message}</span> : null}
    </div>
  );
}

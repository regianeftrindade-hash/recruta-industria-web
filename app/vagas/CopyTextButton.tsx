"use client";

import { useState } from "react";
import styles from "./vagas.module.css";

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* tenta o caminho compatível com navegadores antigos */
  }

  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export default function CopyTextButton({
  value,
  label,
  copiedLabel = "Copiado",
  className,
}: {
  value: string;
  label: string;
  copiedLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className={styles.copyWrap}>
      <button
        type="button"
        className={className || styles.copyButton}
        onClick={() => {
          const absolute = value.startsWith("/") ? `${window.location.origin}${value}` : value;
          void (async () => {
            const ok = await copyText(absolute);
            setCopied(ok);
            setFailed(!ok);
            if (ok) {
              window.setTimeout(() => setCopied(false), 2500);
            }
          })();
        }}
      >
        {copied ? copiedLabel : label}
      </button>
      <span className={styles.live} aria-live="polite">
        {copied ? copiedLabel : failed ? "Não foi possível copiar. Selecione o texto e copie." : ""}
      </span>
    </span>
  );
}

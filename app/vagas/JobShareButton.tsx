"use client";

import { useState } from "react";
import Link from "next/link";
import {
  INSTAGRAM_SHARE_URL,
  facebookShareUrl,
  publicJobUrl,
  whatsAppShareUrl,
} from "@/lib/jobs/public-job-link";
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

export default function JobShareButton({ jobId, title }: { jobId: string; title: string }) {
  const [notice, setNotice] = useState("");
  const url = publicJobUrl(jobId);

  async function copyLink(message: string) {
    const ok = await copyText(url);
    setNotice(ok ? message : "Não foi possível copiar o link.");
  }

  return (
    <div className={styles.shareRow}>
      <a className={styles.shareButton} href={whatsAppShareUrl(title, jobId)} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className={styles.shareButton} href={facebookShareUrl(jobId)} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <button
        type="button"
        className={styles.shareButton}
        onClick={() => {
          void copyLink("Link copiado. Cole no Instagram.");
          window.open(INSTAGRAM_SHARE_URL, "_blank", "noopener,noreferrer");
        }}
      >
        Instagram
      </button>
      <button type="button" className={styles.shareButton} onClick={() => void copyLink("Link copiado")}>
        Copiar link
      </button>
      <Link className={styles.shareButton} href="/vagas">
        Visualizar vagas
      </Link>
      <span className={styles.live} aria-live="polite">{notice}</span>
    </div>
  );
}

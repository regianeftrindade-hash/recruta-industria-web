"use client";
import { exactUi } from "@/lib/i18n/exact-ui";
import { t } from "@/lib/i18n/translate";

import { useState } from "react";
import Link from "next/link";
import { INSTAGRAM_SHARE_URL, facebookShareUrl } from "@/lib/jobs/public-job-link";
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

export default function JobShareButton({ jobId, shareText }: { jobId: string; shareText: string }) {
  const [notice, setNotice] = useState("");

  async function copyLink(message: string) {
    const ok = await copyText(shareText);
    setNotice(ok ? message : t("rest.share.copyFailed"));
  }

  const shareClass = `${styles.shareButton} ri-btn-3d-gold`;

  return (
    <div className={styles.shareRow}>
      <a className={shareClass} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
        WhatsApp
      </a>
      <a className={shareClass} href={facebookShareUrl(jobId)} target="_blank" rel="noopener noreferrer">
        Facebook
      </a>
      <button
        type="button"
        className={shareClass}
        onClick={() => {
          void copyLink(t("rest.share.copiedInstagram"));
          window.open(INSTAGRAM_SHARE_URL, "_blank", "noopener,noreferrer");
        }}
      >
        Instagram
      </button>
      <button type="button" className={shareClass} onClick={() => void copyLink(t("rest.share.copiedLink"))}>{exactUi("Copiar link")}</button>
      <Link className={shareClass} href="/vagas">
        {t("rest.share.viewJobs")}
      </Link>
      <span className={styles.live} aria-live="polite">{notice}</span>
    </div>
  );
}

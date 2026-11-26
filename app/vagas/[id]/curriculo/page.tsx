"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
import { exactUi } from "@/lib/i18n/exact-ui";
import { t } from "@/lib/i18n/translate";
import { safeJobReturnPath } from "@/lib/jobs/public-job-link";
import styles from "../../vagas.module.css";

export default function AnexarCurriculoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = String(params.id || "");
  const back = safeJobReturnPath(`/vagas/${jobId}`)?.replace("?candidatar=1", "") || `/vagas/${jobId}`;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("curriculo");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : null;
    if (!file) {
      setError(t("rest.jobs.resume.selectFile"));
      return;
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError(t("rest.jobs.resume.pdfDocxOnly"));
      return;
    }

    setBusy(true);
    setError("");
    try {
      const session = await fetch("/api/auth/session", { credentials: "include" }).then((response) => response.json()).catch(() => null);
      if (!session?.user?.email) {
        window.location.href = `/login?tipo=profissional&redirect=${encodeURIComponent(`/vagas/${jobId}/curriculo`)}`;
        return;
      }

      const body = new FormData();
      body.set("file", file);
      body.set("type", "curriculos");
      const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
      const uploadData = await uploaded.json().catch(() => ({}));
      if (uploaded.status === 401) {
        window.location.href = `/login?tipo=profissional&redirect=${encodeURIComponent(`/vagas/${jobId}/curriculo`)}`;
        return;
      }
      if (!uploaded.ok || !uploadData.file?.path) {
        setError(exactUi(uploadData.error || t("rest.jobs.resume.uploadFailed")));
        return;
      }

      const saved = await fetch("/api/professional/curriculo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: uploadData.file.path }),
      });
      const savedData = await saved.json().catch(() => ({}));
      if (saved.status === 401) {
        window.location.href = `/login?tipo=profissional&redirect=${encodeURIComponent(`/vagas/${jobId}/curriculo`)}`;
        return;
      }
      if (!saved.ok) {
        setError(exactUi(savedData.error || t("rest.jobs.resume.attachFailed")));
        return;
      }

      router.replace(back);
    } catch {
      setError(t("rest.jobs.resume.retry"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label={t("rest.jobs.resume.homeAria")}>
          <LogoRecruta size="sm" as="div" />
        </Link>
        <Link href={back} className={styles.backLink}>{t("rest.jobs.resume.backToJob")}</Link>
      </div>
      <article className={styles.article}>
        <h1 className={styles.title}>{t("rest.jobs.resume.title")}</h1>
        <p className={styles.note}>{t("rest.jobs.resume.note")}</p>
        <form className={styles.resumeForm} onSubmit={(event) => void onSubmit(event)}>
          <input
            className={styles.file}
            name="curriculo"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            aria-label={t("rest.jobs.resume.title")}
          />
          <button type="submit" className="ri-btn-3d-gold" disabled={busy}>
            {busy ? t("rest.jobs.resume.sending") : t("rest.jobs.resume.submit")}
          </button>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </form>
      </article>
    </main>
  );
}

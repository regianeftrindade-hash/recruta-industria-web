"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LogoRecruta from "@/app/components/LogoRecruta";
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
      setError("Selecione o currículo em PDF ou DOCX.");
      return;
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      setError("Envie um arquivo PDF ou DOCX.");
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
        setError(uploadData.error || "Não foi possível enviar o currículo.");
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
        setError(savedData.error || "Não foi possível anexar o currículo ao seu perfil.");
        return;
      }

      router.replace(back);
    } catch {
      setError("Não foi possível anexar o currículo. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/" className={styles.brandLink} aria-label="Página inicial">
          <LogoRecruta size="sm" as="div" />
        </Link>
        <Link href={back} className={styles.backLink}>Voltar à vaga</Link>
      </div>
      <article className={styles.article}>
        <h1 className={styles.title}>Anexar currículo</h1>
        <p className={styles.note}>
          Envie o currículo em PDF ou DOCX. O arquivo fica no seu perfil e substitui o anterior somente quando você confirma o envio. Depois você volta para a vaga.
        </p>
        <form className={styles.resumeForm} onSubmit={(event) => void onSubmit(event)}>
          <input
            className={styles.file}
            name="curriculo"
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <button type="submit" className="ri-btn-3d-gold" disabled={busy}>
            {busy ? "Enviando..." : "Anexar currículo e voltar à vaga"}
          </button>
          {error ? <p className={styles.error}>{error}</p> : null}
        </form>
      </article>
    </main>
  );
}

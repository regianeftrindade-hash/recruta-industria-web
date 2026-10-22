"use client";

import { useEffect, useRef, useState } from "react";
import { resumeFileProblem } from "@/lib/professional/resume-file";
import styles from "./meu-curriculo.module.css";

type PreviewSection = { heading: string; paragraphs: string[] };

type PreviewPayload = {
  name: string | null;
  contacts: string[];
  sections: PreviewSection[];
  missing: string[];
  pdfBase64: string;
};

type Props = {
  enabled: boolean;
  hasSavedResume: boolean;
  onSaved: (path: string) => void;
};

function pdfBlobUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

export default function MeuCurriculo({ enabled, hasSavedResume, onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saved, setSaved] = useState(hasSavedResume);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    setSaved(hasSavedResume);
  }, [hasSavedResume]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function closePreview() {
    setPreview(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  async function attach(file: File) {
    if (!enabled) {
      setError("Entre com sua conta de profissional para anexar o currículo.");
      return;
    }
    const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const problem = resumeFileProblem(head, file.size);
    if (problem) {
      setError(problem);
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("type", "curriculos");
      const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
      const uploadData = await uploaded.json().catch(() => ({}));
      const path = typeof uploadData?.file?.path === "string" ? uploadData.file.path : "";
      if (!uploaded.ok || !path.startsWith("curriculos/")) {
        setError(uploadData?.error || "Não foi possível enviar o PDF. O currículo anterior foi mantido.");
        return;
      }

      const savedResponse = await fetch("/api/professional/curriculo", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const savedData = await savedResponse.json().catch(() => ({}));
      if (!savedResponse.ok) {
        setError(savedData?.error || "Não foi possível salvar o currículo. O arquivo anterior do perfil foi mantido.");
        return;
      }

      onSaved(path);
      setFileName(file.name);
      setSaved(true);
      setNotice("Currículo anexado ao perfil.");
      closePreview();
    } catch {
      setError("Não foi possível anexar o currículo. O arquivo anterior do perfil foi mantido.");
    } finally {
      setBusy(false);
    }
  }

  async function openPreview() {
    if (!enabled) {
      setError("Entre com sua conta de profissional para gerar o currículo.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/professional/curriculo/preview", { credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.pdfBase64 !== "string") {
        setError(data?.error || "Não foi possível preparar a prévia.");
        return;
      }
      const payload = data as PreviewPayload;
      setPreview(payload);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return pdfBlobUrl(payload.pdfBase64);
      });
    } catch {
      setError("Não foi possível preparar a prévia.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmSave() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/professional/curriculo/gerar", {
        method: "POST",
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data?.path !== "string") {
        setError(data?.error || "Não foi possível salvar o currículo. O arquivo anterior do perfil foi mantido.");
        return;
      }
      onSaved(data.path);
      setFileName("curriculo.pdf");
      setSaved(true);
      setNotice("Currículo gerado e salvo no perfil.");
      closePreview();
    } catch {
      setError("Não foi possível salvar o currículo. O arquivo anterior do perfil foi mantido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.area}>
      <p className={styles.hint}>
        Anexe um PDF que você já tem ou gere um currículo com os dados salvos neste perfil.
        Salve o cadastro antes de gerar, se você acabou de alterar algum campo.
      </p>
      {saved ? (
        <p className={styles.status}>
          {fileName ? `Currículo atual: ${fileName}.` : "Há um currículo salvo neste perfil."}{" "}
          <a href="/api/professional/curriculo">Baixar currículo</a>
        </p>
      ) : (
        <p className={styles.status}>Nenhum currículo salvo neste perfil.</p>
      )}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.button}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Anexar currículo
        </button>
        <button type="button" className={styles.button} disabled={busy} onClick={() => void openPreview()}>
          {busy && !preview ? "Preparando..." : "Gerar currículo em PDF"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void attach(file);
        }}
      />
      {notice ? <p className={styles.status}>{notice}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {preview ? (
        <div className={styles.preview}>
          <h3>Prévia do currículo</h3>
          <p className={styles.hint}>
            Confira o conteúdo antes de salvar. O arquivo só substitui o currículo do perfil depois da confirmação.
          </p>
          {preview.missing.length ? (
            <>
              <p className={styles.hint}>Estes campos ainda podem ser preenchidos no perfil:</p>
              <ul className={styles.missing}>
                {preview.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          <article className={styles.sheet}>
            <p className={styles.sheetName}>{preview.name || "Currículo"}</p>
            {preview.contacts.length ? <p className={styles.sheetContacts}>{preview.contacts.join(" · ")}</p> : null}
            {preview.sections.map((section) => (
              <section key={section.heading}>
                <h4>{section.heading}</h4>
                {section.paragraphs.map((paragraph, index) => (
                  <p key={`${section.heading}-${index}`}>{paragraph}</p>
                ))}
              </section>
            ))}
          </article>
          {previewUrl ? (
            <iframe className={styles.frame} title="Prévia do PDF" src={previewUrl} />
          ) : null}
          <div className={styles.previewActions}>
            <button type="button" className={styles.button} disabled={busy} onClick={closePreview}>
              Voltar e corrigir
            </button>
            <button type="button" className={styles.button} disabled={busy} onClick={() => void confirmSave()}>
              {busy ? "Salvando..." : "Gerar e salvar no meu perfil"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

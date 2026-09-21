"use client";

import React, { useRef, useState } from "react";
import styles from "./register.module.css";
import type { ResumeExtractionResult, ResumeStructuredFields } from "@/lib/curriculum/types";
import { parseResumePatterns } from "@/lib/curriculum/parse-resume-patterns";

type Props = {
  isEditMode?: boolean;
  onApplyStructured: (
    structured: ResumeStructuredFields,
    opts?: { overwrite?: boolean },
  ) => { filledLabels: string[] };
  onCurriculoAnexado: (url: string, fileName: string) => void;
};

async function uploadCurriculoAnexo(file: File): Promise<string | null> {
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "documents");
    const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      file?: { url?: string };
    };
    if (res.ok && data.success && data.file?.url) {
      return data.file.url;
    }
  } catch {
    /* cai no data URL */
  }

  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Card de importação (abaixo da foto): extrai, preenche e anexa o currículo.
 */
export default function RegisterImportCurriculo({
  isEditMode = false,
  onApplyStructured,
  onCurriculoAnexado,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ResumeExtractionResult | null>(null);
  const [filledLabels, setFilledLabels] = useState<string[]>([]);
  const [anexoOk, setAnexoOk] = useState<string | null>(null);

  const onPick = () => inputRef.current?.click();

  const applyFromExtraction = (data: ResumeExtractionResult, overwrite = false) => {
    // Reaplica padrões no cliente a partir do texto (garante o preenchimento atualizado)
    const structured =
      (data.rawText ? parseResumePatterns(data.rawText) : null) || data.structured;
    if (!structured) {
      setFilledLabels([]);
      return;
    }
    const result = onApplyStructured(structured, { overwrite });
    setFilledLabels(result.filledLabels);
    setExtraction({ ...data, structured });
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    setExtraction(null);
    setFilledLabels([]);
    setAnexoOk(null);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("context", isEditMode ? "edit" : "register");

      const res = await fetch("/api/professional/curriculum/extract", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        extraction?: ResumeExtractionResult;
      };

      if (!res.ok || !data.success || !data.extraction) {
        setError(data.error || "Não foi possível ler o currículo.");
        return;
      }

      setExtraction(data.extraction);
      applyFromExtraction(data.extraction, true);

      const url = await uploadCurriculoAnexo(file);
      if (url) {
        onCurriculoAnexado(url, file.name);
        setAnexoOk(file.name);
      }

      const structured =
        (data.extraction.rawText
          ? parseResumePatterns(data.extraction.rawText)
          : data.extraction.structured) || null;
      const semPadroes = !structured?.matchedFields?.length;
      if (!url && semPadroes) {
        setError("Não foi possível anexar nem encontrar padrões. Tente outro arquivo.");
      } else if (!url) {
        setError("Texto lido, mas não foi possível anexar o arquivo.");
      } else if (semPadroes) {
        setError("Arquivo anexado. Poucos padrões encontrados — complete manualmente.");
      }
    } catch {
      setError("Erro de rede ao enviar o arquivo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`${styles.sectionCard} ${styles.importCurriculoCard}`}>
      <h3 className={styles.importCurriculoTitle}>Importar currículo</h3>
      <p className={styles.importCurriculoHint}>
        PDF, DOC ou DOCX (até 8 MB). Preenche o cadastro e anexa o arquivo automaticamente.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className={styles.importCurriculoHiddenInput}
        onChange={(e) => void onFileChange(e)}
      />

      <div className={styles.importCurriculoActions}>
        <button
          type="button"
          className={styles.importCurriculoBtn}
          onClick={onPick}
          disabled={busy}
        >
          {busy ? "Importando…" : "Escolher arquivo"}
        </button>
        <button
          type="button"
          className={styles.importCurriculoBtn}
          onClick={onPick}
          disabled={busy}
        >
          {busy ? "Aguarde…" : "Importar"}
        </button>
      </div>

      {(anexoOk || extraction) && (
        <>
          <div className={styles.importCurriculoDivider} />
          <div className={styles.importCurriculoFileRow}>
            <span className={styles.importCurriculoFileName} title={anexoOk || undefined}>
              {anexoOk || "Arquivo processado"}
            </span>
            <div className={styles.importCurriculoFileActions}>
              <button
                type="button"
                className={styles.importCurriculoBtn}
                onClick={onPick}
                disabled={busy}
              >
                Enviar outro arquivo
              </button>
              <button
                type="button"
                className={styles.importCurriculoBtn}
                disabled={busy || !extraction?.structured}
                onClick={() => extraction && applyFromExtraction(extraction, true)}
              >
                Preencher de novo
              </button>
            </div>
          </div>
        </>
      )}

      {error && (
        <p className={styles.importCurriculoError} role="alert">
          {error}
        </p>
      )}

      {filledLabels.length > 0 && (
        <p className={styles.importCurriculoSuccess} role="status">
          Preenchido: {filledLabels.join(", ")}.
        </p>
      )}

      {extraction && (
        <details className={styles.importCurriculoPreview}>
          <summary>
            Texto extraído ({extraction.format.toUpperCase()} ·{" "}
            {extraction.charCount.toLocaleString("pt-BR")} caracteres)
          </summary>
          <textarea
            readOnly
            value={extraction.rawText}
            className={styles.importCurriculoTextarea}
            aria-label="Texto extraído do currículo"
            rows={6}
          />
        </details>
      )}
    </section>
  );
}

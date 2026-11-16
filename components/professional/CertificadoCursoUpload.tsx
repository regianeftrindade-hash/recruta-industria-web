"use client";

import React, { useRef, useState } from "react";
import { t } from "@/lib/i18n/translate";
import { localizeServerText } from "@/lib/i18n/server-text";
import {
  CURSO_CERTIFICADO_MAX_BYTES,
  CURSO_STATUS_META,
  getCursoStatus,
  isCursoCertificadoMime,
  type CursoDetalhado,
} from "@/lib/professional-form-config";
import { isArquivoAnexado, isArquivoNoServidor, nomeArquivoAnexado } from "@/lib/arquivo-anexo";

type Props = {
  curso: CursoDetalhado;
  onChange: (patch: Partial<CursoDetalhado>) => void;
  uploadType?: string;
  checkboxLabel?: string;
};

async function uploadCertificadoCurso(file: File, uploadType: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", uploadType);
  const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
  const data = await res.json();
  if (res.ok && data.success && data.file?.url) return data.file.url as string;
  if (res.status === 401) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(t("rest.cert.readError")));
      reader.readAsDataURL(file);
    });
  }
  throw new Error(localizeServerText(data.error) || t("rest.cert.sendError"));
}

export default function CertificadoCursoUpload({
  curso,
  onChange,
  uploadType = "curso-certificados",
  checkboxLabel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const status = getCursoStatus(curso);
  const badge = CURSO_STATUS_META[status];
  const anexado = isArquivoAnexado(curso.certificadoUrl);
  const noServidor = anexado && isArquivoNoServidor(curso.certificadoUrl!);

  const handleFile = async (file: File) => {
    setErro(null);

    if (!isCursoCertificadoMime(file.type)) {
      setErro(t("rest.cert.badFormat"));
      return;
    }

    if (file.size > CURSO_CERTIFICADO_MAX_BYTES) {
      setErro(t("rest.cert.tooBig"));
      return;
    }

    setEnviando(true);
    try {
      const url = await uploadCertificadoCurso(file, uploadType);
      if (!url) {
        setErro(t("rest.cert.failed"));
        return;
      }
      onChange({
        possuiCertificado: true,
        certificadoUrl: url,
        verificado: false,
      });
    } catch (err) {
      setErro(err instanceof Error ? err.message : t("rest.cert.failedDot"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-primary, #414141)", fontWeight: 700, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={curso.possuiCertificado === true}
          onChange={(e) => {
            const marcado = e.target.checked;
            onChange({
              possuiCertificado: marcado,
              ...(!marcado ? { certificadoUrl: undefined, verificado: false } : {}),
            });
          }}
        />
        {checkboxLabel || t("rest.cert.attach")}
      </label>

      {(curso.possuiCertificado || anexado) && (
        <div
          style={{
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${badge.border}`,
            background: badge.bg,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: badge.color,
                padding: "3px 8px",
                borderRadius: 999,
                border: `1px solid ${badge.border}`,
                background: "rgba(0,0,0,0.25)",
              }}
            >
              {badge.label}
            </span>
            {anexado && (
              <button
                type="button"
                onClick={() => onChange({ certificadoUrl: undefined, verificado: false })}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  border: "1px solid rgba(220, 80, 80, 0.5)",
                  borderRadius: 4,
                  background: "rgba(220, 80, 80, 0.15)",
                  color: "#f88",
                  cursor: "pointer",
                }}
              >
                Remover anexo
              </button>
            )}
          </div>

          {anexado ? (
            <div style={{ fontSize: 12, color: "var(--text-primary, #414141)", fontWeight: 700 }}>
              <p style={{ margin: "0 0 6px" }}>
                {noServidor ? "✓ Certificado anexado:" : "⚠ Rascunho local:"}{" "}
                <strong>{nomeArquivoAnexado(curso.certificadoUrl!)}</strong>
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {noServidor && (
                  <a
                    href={curso.certificadoUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#C89B3C", WebkitTextStroke: "0.75px #000", paintOrder: "stroke fill", textDecoration: "underline" }}
                  >
                    Ver certificado
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={enviando}
                  style={{
                    padding: "6px 12px",
                    fontSize: 11,
                    border: "1px solid #6b5218",
                    borderRadius: 4,
                    background: "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 45%, #A87E2E 100%)",
                    color: "#000",
                    fontWeight: 700,
                    cursor: enviando ? "not-allowed" : "pointer",
                    opacity: enviando ? 0.7 : 1,
                    boxShadow:
                      "inset 0 1px 0 rgba(200, 155, 60, 0.45), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)",
                  }}
                >
                  {enviando ? t("surface.jobs.sending") : t("rest.cert.replace")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 8 }}>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={enviando}
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  border: "1px solid #6b5218",
                  borderRadius: 4,
                  background: "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 45%, #A87E2E 100%)",
                  color: "#000",
                  fontWeight: 700,
                  cursor: enviando ? "not-allowed" : "pointer",
                  opacity: enviando ? 0.7 : 1,
                  boxShadow:
                    "inset 0 1px 0 rgba(200, 155, 60, 0.45), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)",
                }}
              >
                {enviando ? t("rest.cert.sending") : t("rest.cert.send")}
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              await handleFile(file);
              e.target.value = "";
            }}
          />

          {erro && <p style={{ margin: 0, fontSize: 11, color: "#e57373" }}>{erro}</p>}
        </div>
      )}
    </div>
  );
}

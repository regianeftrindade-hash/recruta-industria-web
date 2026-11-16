"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  emptyResumeDraft,
  renderResumePdf,
  RESUME_MODELS,
  sanitizeResumeDraft,
  type ResumeDraft,
  type ResumeExperience,
  type ResumeModelId,
} from "@/lib/curriculum/resume-draft";
import { CurriculoAnexadoSemLeituraError } from "@/lib/curriculum/resume-read-error";
import styles from "./resume-toolkit.module.css";
import { formatInTimeZone } from "@/lib/datetime/format-in-zone";
import { getBoundLocale } from "@/lib/i18n/active-locale";
import { t } from "@/lib/i18n/translate";

type Status = {
  hasResume: boolean;
  valid: boolean;
  format: "pdf" | "docx" | null;
  fileName: string | null;
  updatedAt: string | null;
  availableForPremium: boolean;
  draft: ResumeDraft | null;
};

type Props = {
  variant: "profile" | "register" | "apply" | "checkout";
  authenticated?: boolean;
  missing?: boolean;
  resumeName?: string | null;
  /** Nesta candidatura só entra arquivo PDF. A geração no site continua em PDF. */
  pdfOnly?: boolean;
  /** `generate` mostra só a geração do PDF, com os dados já preenchidos. */
  focus?: "full" | "generate";
  notice?: string;
  getLocalDraft?: () => ResumeDraft;
  onDraftApplied?: (draft: ResumeDraft) => void;
  /** Lê o arquivo e preenche o cadastro. A mensagem volta para o aviso do card. */
  onAttachFile?: (file: File) => Promise<string | void>;
  onHoldFile?: (file: File | null) => void;
  onSaved?: () => void;
  onCancel?: () => void;
};

const EMPTY_JOB: ResumeExperience = {
  empresa: "",
  cargo: "",
  inicio: "",
  fim: "",
  atividades: "",
  segmento: "",
};

function bytesToPdfBlob(bytes: Uint8Array): Blob {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

function ModelPicker({
  value,
  onChange,
}: {
  value: ResumeModelId;
  onChange: (id: ResumeModelId) => void;
}) {
  return (
    <div className={styles.models} role="radiogroup" aria-label={t("internal.resume.model")}>
      {RESUME_MODELS.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? styles.modelOn : styles.model}
            onClick={() => onChange(item.id)}
          >
            <strong>{item.label}</strong>
            <span>{item.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function formatUpdatedAt(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatInTimeZone(date, getBoundLocale() === "en" ? "en" : "pt-BR", "America/Sao_Paulo", { dateStyle: "short" });
}

async function readError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
}

export async function attachResumeFile(file: File): Promise<{ ok: true; fileName: string } | { ok: false; error: string }> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
    return { ok: false, error: t("internal.resume.pdfOrDocx") };
  }
  if (!file.size) return { ok: false, error: t("internal.resume.emptyFile") };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: t("internal.resume.tooBig") };

  const body = new FormData();
  body.set("file", file);
  body.set("type", "curriculos");
  const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
  const uploadData = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok || !uploadData?.file?.path) {
    return { ok: false, error: uploadData?.error || t("internal.resume.uploadError") };
  }

  const saved = await fetch("/api/professional/curriculo", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: uploadData.file.path }),
  });
  if (!saved.ok) {
    return { ok: false, error: await readError(saved, t("internal.resume.saveError")) };
  }
  const savedData = await saved.json().catch(() => ({}));
  return { ok: true, fileName: savedData.fileName || file.name };
}

export default function ResumeToolkit({
  variant,
  authenticated = variant !== "register",
  missing = false,
  resumeName,
  pdfOnly = false,
  focus = "full",
  notice,
  getLocalDraft,
  onDraftApplied,
  onAttachFile,
  onHoldFile,
  onSaved,
  onCancel,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [draft, setDraft] = useState<ResumeDraft>(emptyResumeDraft());
  const [view, setView] = useState<"home" | "review" | "preview">("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [heldName, setHeldName] = useState("");
  const [model, setModel] = useState<ResumeModelId>("classico");

  async function loadStatus(): Promise<Status | null> {
    if (!authenticated) return null;
    const response = await fetch("/api/professional/curriculo", { credentials: "include" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || t("internal.resume.loadError"));
    }
    const next = data as Status;
    setStatus(next);
    return next;
  }

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    void loadStatus().catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : t("internal.resume.loadError"));
    });
    return () => {
      cancelled = true;
    };
    // A consulta inicial acompanha a sessão já resolvida pelo pai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownName = status?.fileName || resumeName || heldName;
  const updated = formatUpdatedAt(status?.updatedAt || null);
  const hasValid = status?.valid === true || (!status && Boolean(resumeName));
  const showGate = variant === "apply" && missing;
  const showCheckoutWarning = variant === "checkout" && status !== null && !status.valid;

  function openReviewFrom(source: ResumeDraft) {
    const clean = sanitizeResumeDraft(source);
    if (!clean.experiencias.length) clean.experiencias = [{ ...EMPTY_JOB }];
    setDraft(clean);
    setError("");
    setView("review");
  }

  async function openReview() {
    if (getLocalDraft) {
      openReviewFrom(getLocalDraft());
      return;
    }
    try {
      const current = status?.draft ? status : await loadStatus();
      openReviewFrom(current?.draft || emptyResumeDraft());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("internal.resume.loadError"));
    }
  }

  async function preencherComArquivo(file: File): Promise<string> {
    if (!onAttachFile) return "";
    try {
      const aviso = await onAttachFile(file);
      return typeof aviso === "string" ? aviso : "";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("internal.resume.readError"));
      if (err instanceof CurriculoAnexadoSemLeituraError) return "";
      throw err;
    }
  }

  async function onAttach(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!authenticated) {
        const lower = file.name.toLowerCase();
        if (pdfOnly ? !lower.endsWith(".pdf") : !lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
          setError(pdfOnly ? t("internal.resume.pdfOnly") : t("internal.resume.pdfOrDocx"));
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError(t("internal.resume.tooBig"));
          return;
        }
        const aviso = await preencherComArquivo(file);
        onHoldFile?.(file);
        setHeldName(file.name);
        setMessage(aviso || t("internal.resume.selected"));
        return;
      }

      const lower = file.name.toLowerCase();
      if (pdfOnly && !lower.endsWith(".pdf")) {
          setError(t("internal.resume.pdfOnly"));
        return;
      }
      const aviso = await preencherComArquivo(file);
      const result = await attachResumeFile(file);
      if (!result.ok) {
        setError(result.error);
        setMessage(aviso);
        return;
      }
      setMessage([aviso, t("internal.resume.saved")].filter(Boolean).join(" "));
      await loadStatus();
      onSaved?.();
      setView("home");
    } catch (err) {
      if (!(err instanceof CurriculoAnexadoSemLeituraError)) {
        setError(err instanceof Error && err.message
          ? err.message
          : t("internal.resume.uploadRetry"));
        setMessage("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function generate(saveAsMain: boolean) {
    const clean = sanitizeResumeDraft(draft);
    if (!clean.nome) {
      setError(t("internal.resume.nameRequired"));
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      onDraftApplied?.(clean);
      let blob: Blob;
      let saved = false;
      if (!authenticated) {
        blob = bytesToPdfBlob(renderResumePdf(clean, model));
        if (saveAsMain) {
          onHoldFile?.(new File([blob], "curriculo.pdf", { type: "application/pdf" }));
          setHeldName("curriculo.pdf");
          setMessage(t("internal.resume.pdfReady"));
        }
      } else {
        const response = await fetch("/api/professional/curriculo/gerar", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: clean, saveAsMain, model }),
        });
        if (!response.ok) {
          setError(await readError(response, t("internal.resume.generateError")));
          return;
        }
        saved = response.headers.get("X-Resume-Saved") === "1";
        blob = await response.blob();
        if (saved) {
          setMessage(t("internal.resume.pdfSaved"));
          await loadStatus();
          onSaved?.();
        } else if (saveAsMain) {
          setError(t("internal.resume.pdfNotSaved"));
          return;
        }
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setView("preview");
    } catch {
      setError(t("fix.resume.generateError"));
    } finally {
      setBusy(false);
    }
  }

  const listText = useMemo(() => ({
    cursos: draft.cursos.join("\n"),
    habilidades: draft.habilidades.join("\n"),
    idiomas: draft.idiomas.join("\n"),
  }), [draft.cursos, draft.habilidades, draft.idiomas]);

  function chooseModel(next: ResumeModelId) {
    setModel(next);
    if (view !== "preview") return;
    const clean = sanitizeResumeDraft(draft);
    if (!clean.nome) return;
    setPreviewUrl(URL.createObjectURL(bytesToPdfBlob(renderResumePdf(clean, next))));
  }

  function saveAsMain() {
    const replacing = Boolean(status?.valid || heldName);
    if (replacing && !window.confirm(t("fix.resume.replaceConfirm"))) return;
    void generate(true);
  }

  function setList(key: "cursos" | "habilidades" | "idiomas", value: string) {
    setDraft((current) => ({ ...current, [key]: value.split("\n") }));
  }

  function setJob(index: number, patch: Partial<ResumeExperience>) {
    setDraft((current) => ({
      ...current,
      experiencias: current.experiencias.map((job, jobIndex) => (
        jobIndex === index ? { ...job, ...patch } : job
      )),
    }));
  }

  const fileInput = (
    <input
      ref={inputRef}
      className={styles.hidden}
      type="file"
      accept={pdfOnly ? ".pdf,application/pdf" : ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        void onAttach(file);
      }}
    />
  );

  if (variant === "checkout" && status === null && !error) {
    return (
      <section className={styles.card} aria-label={t("fix.aria.resume")}>
        <p className={styles.note}>{t("internal.resume.checking")}</p>
      </section>
    );
  }

  if (variant === "checkout" && status?.valid) {
    return (
      <section className={styles.card} aria-label={t("fix.aria.resume")}>
        <p className={styles.status}>{t("internal.resume.readyPremium")}</p>
        {shownName ? <p className={styles.note}>{shownName}{updated ? ` · ${t("fix.resume.updatedOn")} ${updated}` : ""}</p> : null}
      </section>
    );
  }

  const generateOnly = focus === "generate";

  return (
    <section className={`${styles.card} ${generateOnly && view === "home" ? styles.compact : ""}`} aria-label={generateOnly ? t("internal.resume.generate") : t("rest.resume.mine")}>
      {generateOnly ? null : fileInput}
      {view === "home" ? (
        <>
          {variant !== "apply" || showGate ? (
            <h2 className={styles.title}>{generateOnly ? t("internal.resume.generate") : t("rest.resume.mine")}</h2>
          ) : null}
          {showGate ? <p className={styles.lead}>{t("rest.premium.prompt")}</p> : null}
          {showCheckoutWarning ? (["rest.premium.notice1", "rest.premium.notice2", "rest.premium.notice3", "rest.premium.notice4"] as const).map((key) => (
            <p key={key} className={styles.lead}>{t(key)}</p>
          )) : null}
          {generateOnly ? (
            <p className={styles.note}>
              {notice || t("rest.resume.generateNote")}
            </p>
          ) : null}
          {!generateOnly && variant === "register" ? (
            <p className={styles.note}>
              {t("fix.resume.explain")}
            </p>
          ) : null}
          {variant === "checkout" && showCheckoutWarning ? (
            <p className={styles.note}>{t("internal.resume.continueWithout")}</p>
          ) : null}
          {!showGate && !showCheckoutWarning && shownName ? (
            <>
              <p className={styles.status}>
                {shownName}
                {status?.format ? ` · ${status.format.toUpperCase()}` : ""}
                {updated ? ` · ${t("internal.resume.updated")} ${updated}` : ""}
              </p>
              <p className={styles.note}>
                {hasValid
                  ? t("internal.resume.available")
                  : heldName
                    ? t("internal.resume.pendingAccount")
                    : t("internal.resume.unconfirmed")}
              </p>
            </>
          ) : null}
          {!generateOnly && !showGate && !shownName && variant === "profile" ? (
            <p className={styles.note}>{t("internal.resume.none")}</p>
          ) : null}
          <div className={styles.actions}>
            {generateOnly ? null : (
              <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => inputRef.current?.click()}>
                {shownName && !showGate && !showCheckoutWarning ? t("internal.resume.replace") : t("internal.resume.attach")}
              </button>
            )}
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={openReview}>
              {t("internal.resume.generate")}
            </button>
            {authenticated && status?.valid ? (
              <a className={styles.secondary} href="/api/professional/curriculo/arquivo" target="_blank" rel="noopener noreferrer">
                {t("internal.resume.viewDownload")}
              </a>
            ) : null}
            {showGate && onCancel ? (
              <button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>
                {t("internal.resume.backToJob")}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {view === "review" ? (
        <div className={styles.form}>
          <h2 className={styles.title}>{t("internal.resume.review")}</h2>
          <p className={styles.note}>
            {t("internal.resume.reviewHelp")}
          </p>
          <ModelPicker value={model} onChange={chooseModel} />
          <div className={styles.grid}>
            <label>{t("internal.resume.professionalName")}
              <input value={draft.nome} onChange={(event) => setDraft({ ...draft, nome: event.target.value })} />
            </label>
            <label>{t("surface.auth.email")}
              <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </label>
            <label>{t("registration.simple.phone")}
              <input value={draft.telefone} onChange={(event) => setDraft({ ...draft, telefone: event.target.value })} />
            </label>
            <label>{t("surface.jobs.city")}
              <input value={draft.cidade} onChange={(event) => setDraft({ ...draft, cidade: event.target.value })} />
            </label>
            <label>{t("surface.jobs.state")}
              <input value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value })} />
            </label>
            <label>CNH
              <input value={draft.cnh} onChange={(event) => setDraft({ ...draft, cnh: event.target.value })} />
            </label>
          </div>
          <label>{t("internal.resume.objective")}
            <input value={draft.objetivo} onChange={(event) => setDraft({ ...draft, objetivo: event.target.value })} />
          </label>
          <label>{t("internal.resume.summary")}
            <textarea rows={3} value={draft.resumo} onChange={(event) => setDraft({ ...draft, resumo: event.target.value })} />
          </label>
          <label>{t("internal.resume.education")}
            <input value={draft.escolaridade} onChange={(event) => setDraft({ ...draft, escolaridade: event.target.value })} />
          </label>
          <div className={styles.grid}>
            <label>{t("internal.resume.course")}
              <input value={draft.curso} onChange={(event) => setDraft({ ...draft, curso: event.target.value })} />
            </label>
            <label>{t("internal.resume.institution")}
              <input value={draft.instituicao} onChange={(event) => setDraft({ ...draft, instituicao: event.target.value })} />
            </label>
          </div>
          <label>{t("internal.resume.year")}
            <input value={draft.ano} onChange={(event) => setDraft({ ...draft, ano: event.target.value })} />
          </label>
          {draft.experiencias.map((job, index) => (
            <div key={`exp-${index}`} className={styles.job}>
              <strong>{t("rest.profile.experience")} {index + 1}</strong>
              <div className={styles.grid}>
                <label>{t("internal.resume.company")}
                  <input value={job.empresa} onChange={(event) => setJob(index, { empresa: event.target.value })} />
                </label>
                <label>{t("internal.resume.role")}
                  <input value={job.cargo} onChange={(event) => setJob(index, { cargo: event.target.value })} />
                </label>
                <label>{t("internal.resume.start")}
                  <input value={job.inicio} onChange={(event) => setJob(index, { inicio: event.target.value })} />
                </label>
                <label>{t("internal.resume.end")}
                  <input value={job.fim} onChange={(event) => setJob(index, { fim: event.target.value })} />
                </label>
              </div>
              <label>{t("internal.resume.activities")}
                <textarea rows={2} value={job.atividades} onChange={(event) => setJob(index, { atividades: event.target.value })} />
              </label>
            </div>
          ))}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setDraft((current) => ({ ...current, experiencias: [...current.experiencias, { ...EMPTY_JOB }] }))}
          >
            {t("fix.resume.add")}
          </button>
          <label>{t("internal.resume.courses")}
            <textarea rows={3} value={listText.cursos} onChange={(event) => setList("cursos", event.target.value)} />
          </label>
          <label>{t("internal.resume.skills")}
            <textarea rows={3} value={listText.habilidades} onChange={(event) => setList("habilidades", event.target.value)} />
          </label>
          <label>{t("internal.resume.languages")}
            <textarea rows={2} value={listText.idiomas} onChange={(event) => setList("idiomas", event.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => void generate(false)}>
              {busy ? t("fix.resume.generating") : t("fix.resume.previewPdf")}
            </button>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => setView("home")}>
              {t("internal.pro.back")}
            </button>
          </div>
        </div>
      ) : null}

      {view === "preview" && previewUrl ? (
        <>
          <h2 className={styles.title}>{t("internal.resume.preview")}</h2>
          <p className={styles.note}>{t("internal.resume.previewNote")}</p>
          <ModelPicker value={model} onChange={chooseModel} />
          <iframe className={styles.preview} title={t("fix.resume.previewFrame")} src={previewUrl} />
          <div className={styles.actions}>
            <a className={styles.secondary} href={previewUrl} download="curriculo.pdf">{t("fix.resume.download")}</a>
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={saveAsMain}>
              {busy ? t("surface.reset.saving") : t("fix.resume.saveMain")}
            </button>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => setView("review")}>
              {t("fix.resume.backReview")}
            </button>
          </div>
        </>
      ) : null}

      {message ? <p className={styles.status} role="status">{message}</p> : null}
      {!authenticated && heldName ? (
        <p className={styles.note}>
          {t("fix.resume.holdAccount")}
        </p>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PREMIUM_HIRE_NOTICE,
  PREMIUM_RESUME_PROMPT,
} from "@/lib/curriculum/resume-copy";
import {
  emptyResumeDraft,
  renderResumePdf,
  RESUME_MODELS,
  sanitizeResumeDraft,
  type ResumeDraft,
  type ResumeExperience,
  type ResumeModelId,
} from "@/lib/curriculum/resume-draft";
import styles from "./resume-toolkit.module.css";

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
  /** `generate` mostra só a geração do PDF, com os dados já preenchidos. */
  focus?: "full" | "generate";
  notice?: string;
  getLocalDraft?: () => ResumeDraft;
  onDraftApplied?: (draft: ResumeDraft) => void;
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
    <div className={styles.models} role="radiogroup" aria-label="Modelo do currículo">
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
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

async function readError(response: Response, fallback: string): Promise<string> {
  const data = await response.json().catch(() => ({}));
  return typeof data?.error === "string" && data.error.trim() ? data.error : fallback;
}

export async function attachResumeFile(file: File): Promise<{ ok: true; fileName: string } | { ok: false; error: string }> {
  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
    return { ok: false, error: "Envie um arquivo PDF ou DOCX." };
  }
  if (!file.size) return { ok: false, error: "O arquivo está vazio." };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: "Arquivo muito grande (máx. 10MB)." };

  const body = new FormData();
  body.set("file", file);
  body.set("type", "curriculos");
  const uploaded = await fetch("/api/upload", { method: "POST", body, credentials: "include" });
  const uploadData = await uploaded.json().catch(() => ({}));
  if (!uploaded.ok || !uploadData?.file?.path) {
    return { ok: false, error: uploadData?.error || "Não foi possível enviar o currículo." };
  }

  const saved = await fetch("/api/professional/curriculo", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: uploadData.file.path }),
  });
  if (!saved.ok) {
    return { ok: false, error: await readError(saved, "Não foi possível salvar o currículo no perfil.") };
  }
  const savedData = await saved.json().catch(() => ({}));
  return { ok: true, fileName: savedData.fileName || file.name };
}

export default function ResumeToolkit({
  variant,
  authenticated = variant !== "register",
  missing = false,
  resumeName,
  focus = "full",
  notice,
  getLocalDraft,
  onDraftApplied,
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
      throw new Error(data.error || "Não foi possível consultar o currículo.");
    }
    const next = data as Status;
    setStatus(next);
    return next;
  }

  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    void loadStatus().catch((loadError) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Não foi possível consultar o currículo.");
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
      setError(loadError instanceof Error ? loadError.message : "Não foi possível consultar o currículo.");
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
        if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
          setError("Envie um arquivo PDF ou DOCX.");
          return;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Arquivo muito grande (máx. 10MB).");
          return;
        }
        onHoldFile?.(file);
        setHeldName(file.name);
        setMessage("Arquivo selecionado. Ele ainda não está no perfil.");
        return;
      }

      const result = await attachResumeFile(file);
      if (!result.ok) {
        setError(result.error);
        setMessage("");
        return;
      }
      setMessage("Currículo salvo no perfil.");
      await loadStatus();
      onSaved?.();
      setView("home");
    } catch {
      setError("Não foi possível enviar o currículo. Tente novamente.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function generate(saveAsMain: boolean) {
    const clean = sanitizeResumeDraft(draft);
    if (!clean.nome) {
      setError("Informe o nome profissional para gerar o currículo. Os demais campos podem ficar em branco.");
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
          setMessage("Currículo em PDF pronto. Ele ainda não está no perfil.");
        }
      } else {
        const response = await fetch("/api/professional/curriculo/gerar", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ draft: clean, saveAsMain, model }),
        });
        if (!response.ok) {
          setError(await readError(response, "Não foi possível gerar o currículo."));
          return;
        }
        saved = response.headers.get("X-Resume-Saved") === "1";
        blob = await response.blob();
        if (saved) {
          setMessage("Currículo em PDF salvo no perfil.");
          await loadStatus();
          onSaved?.();
        } else if (saveAsMain) {
          setError("O PDF não foi salvo no perfil.");
          return;
        }
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setView("preview");
    } catch {
      setError("Não foi possível gerar o currículo. Tente novamente.");
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
    if (replacing && !window.confirm("Substituir o currículo principal do perfil por este PDF?")) return;
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
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        void onAttach(file);
      }}
    />
  );

  if (variant === "checkout" && status === null && !error) {
    return (
      <section className={styles.card} aria-label="Meu currículo">
        <p className={styles.note}>Consultando o currículo do perfil...</p>
      </section>
    );
  }

  if (variant === "checkout" && status?.valid) {
    return (
      <section className={styles.card} aria-label="Meu currículo">
        <p className={styles.status}>Você já possui um currículo disponível para as candidaturas Premium.</p>
        {shownName ? <p className={styles.note}>{shownName}{updated ? ` · Atualizado em ${updated}` : ""}</p> : null}
      </section>
    );
  }

  const generateOnly = focus === "generate";

  return (
    <section className={`${styles.card} ${generateOnly && view === "home" ? styles.compact : ""}`} aria-label={generateOnly ? "Gerar currículo em PDF" : "Meu currículo"}>
      {generateOnly ? null : fileInput}
      {view === "home" ? (
        <>
          {variant !== "apply" || showGate ? (
            <h2 className={styles.title}>{generateOnly ? "Gerar currículo em PDF" : "Meu currículo"}</h2>
          ) : null}
          {showGate ? <p className={styles.lead}>{PREMIUM_RESUME_PROMPT}</p> : null}
          {showCheckoutWarning ? PREMIUM_HIRE_NOTICE.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className={styles.lead}>{paragraph}</p>
          )) : null}
          {generateOnly ? (
            <p className={styles.note}>
              {notice || "Não tem um currículo para anexar? Não tem problema. Geramos seu currículo em PDF gratuito com os dados preenchidos neste cadastro."}
            </p>
          ) : null}
          {!generateOnly && variant === "register" ? (
            <p className={styles.note}>
              Anexar currículo usa um arquivo que você já tem. Gerar currículo em PDF cria um documento com os dados deste cadastro. Nenhum dos dois é obrigatório para concluir.
            </p>
          ) : null}
          {variant === "checkout" && showCheckoutWarning ? (
            <p className={styles.note}>Você pode continuar a contratação sem currículo. As funções que dependem dele ficam indisponíveis até o arquivo ser salvo.</p>
          ) : null}
          {!showGate && !showCheckoutWarning && shownName ? (
            <>
              <p className={styles.status}>
                {shownName}
                {status?.format ? ` · ${status.format.toUpperCase()}` : ""}
                {updated ? ` · Atualizado em ${updated}` : ""}
              </p>
              <p className={styles.note}>
                {hasValid
                  ? "Há um currículo disponível para as candidaturas Premium."
                  : heldName
                    ? "O arquivo ainda será associado à sua conta."
                    : "O arquivo salvo não pôde ser confirmado. Envie ou gere outro para usar o envio automático."}
              </p>
            </>
          ) : null}
          {!generateOnly && !showGate && !shownName && variant === "profile" ? (
            <p className={styles.note}>Nenhum currículo salvo. Você pode anexar um PDF ou DOCX ou gerar um PDF pelos dados do perfil.</p>
          ) : null}
          <div className={styles.actions}>
            {generateOnly ? null : (
              <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => inputRef.current?.click()}>
                {shownName && !showGate && !showCheckoutWarning ? "Substituir currículo" : "Anexar currículo"}
              </button>
            )}
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={openReview}>
              Gerar currículo em PDF
            </button>
            {authenticated && status?.valid ? (
              <a className={styles.secondary} href="/api/professional/curriculo/arquivo" target="_blank" rel="noopener noreferrer">
                Visualizar ou baixar
              </a>
            ) : null}
            {showGate && onCancel ? (
              <button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>
                Voltar à vaga
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {view === "review" ? (
        <div className={styles.form}>
          <h2 className={styles.title}>Revisar currículo</h2>
          <p className={styles.note}>
            Confira os dados do perfil. Campos em branco ficam de fora do PDF. Os três modelos usam os mesmos dados, em uma coluna, sem foto e sem gráficos. A prévia é o próprio PDF, com margens, páginas e rodapé.
          </p>
          <ModelPicker value={model} onChange={chooseModel} />
          <div className={styles.grid}>
            <label>Nome profissional
              <input value={draft.nome} onChange={(event) => setDraft({ ...draft, nome: event.target.value })} />
            </label>
            <label>E-mail
              <input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
            </label>
            <label>Telefone
              <input value={draft.telefone} onChange={(event) => setDraft({ ...draft, telefone: event.target.value })} />
            </label>
            <label>Cidade
              <input value={draft.cidade} onChange={(event) => setDraft({ ...draft, cidade: event.target.value })} />
            </label>
            <label>Estado
              <input value={draft.estado} onChange={(event) => setDraft({ ...draft, estado: event.target.value })} />
            </label>
            <label>CNH
              <input value={draft.cnh} onChange={(event) => setDraft({ ...draft, cnh: event.target.value })} />
            </label>
          </div>
          <label>Objetivo
            <input value={draft.objetivo} onChange={(event) => setDraft({ ...draft, objetivo: event.target.value })} />
          </label>
          <label>Resumo profissional
            <textarea rows={3} value={draft.resumo} onChange={(event) => setDraft({ ...draft, resumo: event.target.value })} />
          </label>
          <label>Escolaridade
            <input value={draft.escolaridade} onChange={(event) => setDraft({ ...draft, escolaridade: event.target.value })} />
          </label>
          <div className={styles.grid}>
            <label>Curso
              <input value={draft.curso} onChange={(event) => setDraft({ ...draft, curso: event.target.value })} />
            </label>
            <label>Instituição
              <input value={draft.instituicao} onChange={(event) => setDraft({ ...draft, instituicao: event.target.value })} />
            </label>
          </div>
          <label>Ano de conclusão
            <input value={draft.ano} onChange={(event) => setDraft({ ...draft, ano: event.target.value })} />
          </label>
          {draft.experiencias.map((job, index) => (
            <div key={`exp-${index}`} className={styles.job}>
              <strong>Experiência {index + 1}</strong>
              <div className={styles.grid}>
                <label>Empresa
                  <input value={job.empresa} onChange={(event) => setJob(index, { empresa: event.target.value })} />
                </label>
                <label>Cargo
                  <input value={job.cargo} onChange={(event) => setJob(index, { cargo: event.target.value })} />
                </label>
                <label>Início
                  <input value={job.inicio} onChange={(event) => setJob(index, { inicio: event.target.value })} />
                </label>
                <label>Fim
                  <input value={job.fim} onChange={(event) => setJob(index, { fim: event.target.value })} />
                </label>
              </div>
              <label>Atividades
                <textarea rows={2} value={job.atividades} onChange={(event) => setJob(index, { atividades: event.target.value })} />
              </label>
            </div>
          ))}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => setDraft((current) => ({ ...current, experiencias: [...current.experiencias, { ...EMPTY_JOB }] }))}
          >
            Adicionar experiência
          </button>
          <label>Cursos, um por linha
            <textarea rows={3} value={listText.cursos} onChange={(event) => setList("cursos", event.target.value)} />
          </label>
          <label>Habilidades, uma por linha
            <textarea rows={3} value={listText.habilidades} onChange={(event) => setList("habilidades", event.target.value)} />
          </label>
          <label>Idiomas, um por linha
            <textarea rows={2} value={listText.idiomas} onChange={(event) => setList("idiomas", event.target.value)} />
          </label>
          <div className={styles.actions}>
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={() => void generate(false)}>
              {busy ? "Gerando..." : "Gerar prévia em PDF"}
            </button>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => setView("home")}>
              Voltar
            </button>
          </div>
        </div>
      ) : null}

      {view === "preview" && previewUrl ? (
        <>
          <h2 className={styles.title}>Prévia do currículo</h2>
          <p className={styles.note}>Trocar o modelo atualiza a prévia sem apagar as informações.</p>
          <ModelPicker value={model} onChange={chooseModel} />
          <iframe className={styles.preview} title="Prévia do currículo em PDF" src={previewUrl} />
          <div className={styles.actions}>
            <a className={styles.secondary} href={previewUrl} download="curriculo.pdf">Baixar PDF</a>
            <button type="button" className="ri-btn-3d-gold" disabled={busy} onClick={saveAsMain}>
              {busy ? "Salvando..." : "Salvar como currículo principal"}
            </button>
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => setView("review")}>
              Voltar à revisão
            </button>
          </div>
        </>
      ) : null}

      {message ? <p className={styles.status} role="status">{message}</p> : null}
      {!authenticated && heldName ? (
        <p className={styles.note}>
          Conclua o cadastro nesta página para salvar o currículo no perfil. Se você sair ou fechar a aba antes disso, o arquivo será perdido.
        </p>
      ) : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section>
  );
}

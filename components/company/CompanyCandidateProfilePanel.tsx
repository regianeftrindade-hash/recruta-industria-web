"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import { isArquivoAnexado, nomeArquivoAnexado } from "@/lib/arquivo-anexo";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { SobreMimData } from "@/lib/sobre-mim";
import { PERFIL_INFO, LEGENDA_PONTUACAO_TESTE, PONTUACAO_MAXIMA_PERFIL, QUESTOES_POR_PERFIL, type ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import SecureVideoPlayer from "@/components/shared/SecureVideoPlayer";
import {
  DASH,
  dashCard,
  dashGhostBtn,
  dashInnerBox,
  dashInput,
  dashLabel,
  dashPlanAccent,
  dashSectionTitle,
  dashTag,
} from "@/lib/dashboard-theme";

type Tracking = {
  contatado: boolean;
  entrevistado: boolean;
  contratado: boolean;
  notes: string;
};

type Tip = {
  id: string;
  message: string;
  isAnonymous: boolean;
  rating?: number | null;
  createdAt: string;
};

type Resumo = {
  id: string;
  nome: string;
  cargo?: string;
  area?: string;
  local?: string;
  escolaridade?: string;
  turno?: string;
  experiencia?: string;
  bloqueado: boolean;
  compatibilidade?: number;
  profileCompletion?: number;
  avatar?: string | null;
  curriculoURL?: string | null;
  segmentosIndustria?: string[];
  maquinasEquipamentos?: string[];
};

type DocumentoAnexo = {
  label: string;
  url: string;
};

const CAMPOS_SOBRE_MIM: Array<{ key: keyof SobreMimData; label: string }> = [
  { key: "hobbys", label: "Hobbies" },
  { key: "estiloMusical", label: "Estilo musical" },
  { key: "livros", label: "Livros" },
  { key: "filmesSeries", label: "Filmes e séries" },
  { key: "fraseQueDefine", label: "Uma frase que define" },
  { key: "assuntosInteresse", label: "Assuntos de interesse" },
];

const sectionTitle: React.CSSProperties = {
  ...dashSectionTitle,
  fontSize: 14,
  margin: "20px 0 10px",
  paddingBottom: 6,
  borderBottom: `1px solid ${DASH.border}`,
};

const fieldBox: React.CSSProperties = {
  padding: "10px 12px",
  ...dashInnerBox,
  borderRadius: 8,
  minHeight: 40,
};

const labelStyle: React.CSSProperties = {
  ...dashLabel,
  margin: "0 0 4px",
  textTransform: "uppercase",
};

const valueStyle: React.CSSProperties = {
  color: DASH.text,
  fontSize: 14,
  margin: 0,
  lineHeight: 1.55,
  wordBreak: "break-word",
};

function Campo({ label, value, span = 1 }: { label: string; value?: unknown; span?: number }) {
  const text = value === undefined || value === null || value === "" ? "—" : String(value);
  return (
    <div style={{ ...fieldBox, gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <p style={labelStyle}>{label}</p>
      <p style={valueStyle}>{text}</p>
    </div>
  );
}

function listaDeStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p style={{ ...valueStyle, color: DASH.muted }}>—</p>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {items.map((item) => (
        <span
          key={item}
          style={{
            ...dashTag,
            padding: "4px 8px",
            fontSize: 12,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SimNaoToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div style={{ ...fieldBox, display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ ...labelStyle, margin: 0 }}>{label}</p>
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { label: "Sim", active: value },
          { label: "Não", active: !value },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.label === "Sim")}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: 12,
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              ...(opt.active
                ? btnGold
                : {
                    background: "transparent",
                    color: DASH.text,
                    border: `1px solid ${DASH.gold}`,
                    boxShadow: "none",
                  }),
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type Props = {
  profileId: string;
  onBack: () => void;
  onUnlocked?: () => void;
};

export default function CompanyCandidateProfilePanel({ profileId, onBack, onUnlocked }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [formEdit, setFormEdit] = useState<FormEditPayload | null>(null);
  const [tracking, setTracking] = useState<Tracking>({
    contatado: false,
    entrevistado: false,
    contratado: false,
    notes: "",
  });
  const [tips, setTips] = useState<Tip[]>([]);
  const [canUnlock, setCanUnlock] = useState(false);
  const [canSendTips, setCanSendTips] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [tipText, setTipText] = useState("");
  const [sendingTip, setSendingTip] = useState(false);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [sobreMim, setSobreMim] = useState<SobreMimData | null>(null);
  const [sobreMimPreenchido, setSobreMimPreenchido] = useState(false);
  const [testeComportamental, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoAnexo[]>([]);
  const [videoApresentacaoUrl, setVideoApresentacaoUrl] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/company/professionals/${profileId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail ? `${data.error}: ${data.detail}` : (data.error || "Erro ao carregar perfil"));
        return;
      }
      setResumo(data.resumo);
      setFormEdit(data.formEdit);
      setTracking(data.tracking);
      setTips(data.tips || []);
      setCanUnlock(Boolean(data.canUnlock));
      setCanSendTips(Boolean(data.features?.canSendTips));
      setSobreMim(data.sobreMim ?? null);
      setSobreMimPreenchido(Boolean(data.sobreMimPreenchido));
      setTesteComportamental(data.testeComportamental ?? null);
      setDocumentos(data.documentos ?? []);
      setVideoApresentacaoUrl(data.videoApresentacaoUrl ?? null);
    } catch {
      setError("Erro de rede ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvarTracking = async (patch: Partial<Tracking>) => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/company/professionals/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao salvar");
        return;
      }
      setTracking(data.tracking);
    } catch {
      alert("Erro ao salvar anotações");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleUnlock = async () => {
    setUnlocking(true);
    try {
      const res = await fetch("/api/company/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao desbloquear");
        return;
      }
      onUnlocked?.();
      await carregar();
    } catch {
      alert("Erro ao desbloquear perfil");
    } finally {
      setUnlocking(false);
    }
  };

  const handleSendTip = async () => {
    if (!tipText.trim()) return;
    setSendingTip(true);
    try {
      const res = await fetch("/api/company/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, message: tipText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar dica");
        return;
      }
      setTipText("");
      await carregar();
    } catch {
      alert("Erro ao enviar dica");
    } finally {
      setSendingTip(false);
    }
  };

  const handleSendMessage = async () => {
    const text = mensagemTexto.trim();
    if (!text) return;
    setEnviandoMensagem(true);
    try {
      const res = await fetch("/api/company/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, body: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao enviar mensagem");
        return;
      }
      setMensagemTexto("");
      alert("Mensagem enviada! O candidato verá no painel dele.");
    } catch {
      alert("Erro ao enviar mensagem");
    } finally {
      setEnviandoMensagem(false);
    }
  };

  if (loading) {
    return <p style={{ color: DASH.muted, fontSize: 14, padding: "20px 0" }}>Carregando perfil...</p>;
  }

  if (error || !resumo) {
    return (
      <div style={{ padding: "20px 0" }}>
        <p style={{ color: "#f88", marginBottom: 16 }}>{error || "Perfil não encontrado"}</p>
        <button type="button" onClick={onBack} style={{ ...dashGhostBtn, padding: "8px 16px", fontSize: 13 }}>
          ← Voltar aos perfis
        </button>
      </div>
    );
  }

  const fd = formEdit?.formData ?? {};
  const valor = (chave: string, alt?: unknown): string => {
    const v = fd[chave];
    if (v !== undefined && v !== null && v !== "") {
      return typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : "—";
    }
    if (alt !== undefined && alt !== null && alt !== "") {
      return typeof alt === "string" || typeof alt === "number" || typeof alt === "boolean" ? String(alt) : "—";
    }
    return "—";
  };
  const cursos = formEdit?.cursos?.filter(Boolean) ?? listaDeStrings(fd.cursosCertificacoes);
  const empresas = formEdit?.empresas?.filter((e) => e.nome?.trim() || e.cargo?.trim()) ?? [];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap" }}>
        {resumo.avatar ? (
          <img src={resumo.avatar} alt="" style={{ ...avatarImageStyle(88), filter: resumo.bloqueado ? "blur(4px)" : "none" }} />
        ) : (
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: DASH.inner, border: `2px solid ${DASH.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👤</div>
        )}
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ color: DASH.text, margin: "0 0 6px", fontSize: 24, fontWeight: 700 }}>{resumo.nome}</h2>
          <p style={{ margin: 0, fontSize: 15, color: DASH.text }}>
            {resumo.cargo || "—"} · {resumo.area || "—"}
          </p>
          {resumo.local && <p style={{ margin: "4px 0 0", fontSize: 13, color: DASH.muted }}>{resumo.local}</p>}
          <p style={{ margin: "6px 0 0", fontSize: 13, color: DASH.muted }}>
            {typeof resumo.compatibilidade === "number" && (
              <span style={dashPlanAccent}>Compatibilidade: {resumo.compatibilidade}% · </span>
            )}
            Completude: {resumo.profileCompletion ?? 0}%
          </p>
          {resumo.bloqueado && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 13, color: DASH.muted, margin: "0 0 10px" }}>
                Perfil bloqueado — libere o contato para ver o cadastro completo.
              </p>
              {canUnlock && (
                <button type="button" onClick={handleUnlock} disabled={unlocking} style={{ ...btnGold, padding: "10px 18px", fontSize: 13, opacity: unlocking ? 0.7 : 1 }}>
                  {unlocking ? "Desbloqueando..." : "🔓 Liberar contato"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!resumo.bloqueado && videoApresentacaoUrl && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={sectionTitle}>Vídeo de apresentação</h3>
          <SecureVideoPlayer src={videoApresentacaoUrl} />
          <p style={{ margin: "8px 0 0", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
            Vídeo enviado pelo candidato. Reprodução apenas na plataforma.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)", gap: 20, alignItems: "start" }}>
        <section style={{ ...dashCard, borderRadius: 12, padding: 20 }}>
          <h3 style={{ ...dashSectionTitle, margin: "0 0 4px", fontSize: 18 }}>Cadastro do profissional</h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: DASH.muted }}>
            {resumo.bloqueado ? "Visualização parcial até liberar o contato." : "Dados completos do formulário de cadastro."}
          </p>

          {!resumo.bloqueado && formEdit ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                <Campo label="Nome" value={valor("nome")} />
                <Campo label="CPF" value={formEdit.cpf || fd.cpf} />
                <Campo label="E-mail" value={valor("email")} span={2} />
                <Campo label="Telefone" value={formEdit.telefone || fd.telefone} />
                <Campo label="WhatsApp" value={fd.whatsapp} />
                <Campo label="Estado" value={fd.estado} />
                <Campo label="Cidade" value={fd.cidade} />
                <Campo label="Escolaridade" value={fd.escolaridade} />
                <Campo label="Cargo desejado" value={valor("cargoDesejado")} />
                <Campo label="Área" value={fd.areaInteresse} />
                <Campo label="Turno" value={fd.turnoDisponivel} />
                <Campo label="Experiência" value={fd.tempoExperiencia} />
                <Campo label="Pretensão salarial" value={formEdit.pretensaoSalarial || fd.pretensaoSalarial} />
                <Campo label="Recolocação" value={fd.recolocacao} />
                <Campo label="Disponibilidade" value={fd.disponibilidadeInicio} />
                <Campo label="CNH" value={fd.possuiCNH} />
                <Campo label="Categoria CNH" value={fd.categoriaCNH} />
                <Campo label="Aceita viagens" value={fd.aceitaViagens} />
                <Campo label="Mudança de cidade" value={fd.disponibilidadeMudanca} />
              </div>

              <h4 style={sectionTitle}>Conhecimentos industriais</h4>
              <div style={{ display: "grid", gap: 10 }}>
                <div style={fieldBox}><p style={labelStyle}>Segmentos</p><TagList items={listaDeStrings(fd.segmentosIndustria)} /></div>
                <div style={fieldBox}><p style={labelStyle}>Equipamentos</p><TagList items={listaDeStrings(fd.maquinasEquipamentos)} /></div>
                <div style={fieldBox}><p style={labelStyle}>Qualidade</p><TagList items={listaDeStrings(fd.qualidadeProcessos)} /></div>
                <div style={fieldBox}><p style={labelStyle}>Informática</p><TagList items={listaDeStrings(fd.informatica)} /></div>
                <div style={fieldBox}><p style={labelStyle}>Cursos</p><TagList items={cursos} /></div>
                <div style={fieldBox}><p style={labelStyle}>Certificações</p><TagList items={listaDeStrings(fd.certificacoes)} /></div>
                <div style={fieldBox}><p style={labelStyle}>Idiomas</p><TagList items={listaDeStrings(fd.idiomas)} /></div>
              </div>

              {empresas.length > 0 && (
                <>
                  <h4 style={sectionTitle}>Experiências</h4>
                  <div style={{ display: "grid", gap: 8 }}>
                    {empresas.map((e, i) => (
                      <div key={`${e.nome}-${i}`} style={fieldBox}>
                        <p style={valueStyle}>• {e.cargo || "—"} — {e.nome || "—"}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h4 style={sectionTitle}>Apresentação para empresas</h4>
              <div style={fieldBox}>
                <p style={{ ...valueStyle, whiteSpace: "pre-wrap" }}>{valor("mensagemEmpresas")}</p>
              </div>

              {(isArquivoAnexado(fd.curriculo) || resumo.curriculoURL) && (
                <p style={{ marginTop: 12 }}>
                  <a href={String(fd.curriculo || resumo.curriculoURL)} target="_blank" rel="noreferrer" style={{ color: DASH.text, fontSize: 14, textDecoration: "underline" }}>
                    📄 Abrir currículo
                  </a>
                </p>
              )}
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              <Campo label="Cargo" value={resumo.cargo} />
              <Campo label="Área" value={resumo.area} />
              <Campo label="Local" value={resumo.local} />
              <Campo label="Escolaridade" value={resumo.escolaridade} />
              <Campo label="Turno" value={resumo.turno} />
              <Campo label="Experiência" value={resumo.experiencia} />
              <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
                <p style={labelStyle}>Segmentos (parcial)</p>
                <TagList items={resumo.segmentosIndustria || []} />
              </div>
              <div style={{ ...fieldBox, gridColumn: "1 / -1" }}>
                <p style={labelStyle}>Equipamentos (parcial)</p>
                <TagList items={resumo.maquinasEquipamentos || []} />
              </div>
            </div>
          )}
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <section style={{ ...dashCard, borderRadius: 12, padding: 18 }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 14px", fontSize: 16 }}>📋 Acompanhamento (somente sua empresa)</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <SimNaoToggle label="Contatado" value={tracking.contatado} onChange={(contatado) => { setTracking((t) => ({ ...t, contatado })); void salvarTracking({ contatado }); }} />
              <SimNaoToggle label="Entrevistado" value={tracking.entrevistado} onChange={(entrevistado) => { setTracking((t) => ({ ...t, entrevistado })); void salvarTracking({ entrevistado }); }} />
              <SimNaoToggle label="Contratado" value={tracking.contratado} onChange={(contratado) => { setTracking((t) => ({ ...t, contratado })); void salvarTracking({ contratado }); }} />
            </div>
            <div style={{ marginTop: 14 }}>
              <p style={labelStyle}>Anotações internas</p>
              <textarea
                value={tracking.notes}
                onChange={(e) => setTracking((t) => ({ ...t, notes: e.target.value }))}
                onBlur={(e) => void salvarTracking({ notes: e.target.value })}
                rows={6}
                placeholder="Observações sobre este candidato (visível apenas para sua empresa)..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 8,
                  ...dashInput,
                  fontSize: 14,
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              {savingNotes && <p style={{ fontSize: 11, color: DASH.muted, margin: "6px 0 0" }}>Salvando...</p>}
            </div>
          </section>

          <section style={{ ...dashCard, borderRadius: 12, padding: 18 }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 16 }}>✉️ Mensagem para o candidato</h3>
            {resumo.bloqueado ? (
              <p style={{ fontSize: 13, color: DASH.muted, margin: 0 }}>
                Libere o contato para enviar mensagem direta ao profissional.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: DASH.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
                  A mensagem aparece na caixa de entrada do candidato. Ele pode ler, mas não responde por aqui.
                </p>
                <textarea
                  value={mensagemTexto}
                  onChange={(e) => setMensagemTexto(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Escreva sua mensagem para o profissional..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    borderRadius: 8,
                    ...dashInput,
                    fontSize: 13,
                    lineHeight: 1.5,
                    resize: "vertical",
                  }}
                />
                <button
                  type="button"
                  onClick={() => void handleSendMessage()}
                  disabled={enviandoMensagem || !mensagemTexto.trim()}
                  style={{
                    ...btnGold,
                    width: "100%",
                    marginTop: 8,
                    padding: 10,
                    fontSize: 13,
                    opacity: enviandoMensagem || !mensagemTexto.trim() ? 0.7 : 1,
                  }}
                >
                  {enviandoMensagem ? "Enviando..." : "Enviar mensagem"}
                </button>
              </>
            )}
          </section>

          <section style={{ ...dashCard, borderRadius: 12, padding: 18 }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 16 }}>💡 Dicas enviadas ao candidato</h3>
            {tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 220, overflowY: "auto" }}>
                {tips.map((tip) => (
                  <div key={tip.id} style={{ padding: 10, ...dashInnerBox, borderRadius: 8, borderLeft: `3px solid ${DASH.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.5, color: DASH.text }}>{tip.message}</p>
                    <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>{new Date(tip.createdAt).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: DASH.muted, margin: "0 0 14px" }}>Nenhuma dica enviada ainda.</p>
            )}
            {canSendTips && !resumo.bloqueado && (
              <>
                <textarea
                  value={tipText}
                  onChange={(e) => setTipText(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Escreva uma dica anônima para o candidato..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: 10,
                    borderRadius: 8,
                    ...dashInput,
                    fontSize: 13,
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendTip}
                  disabled={sendingTip || !tipText.trim()}
                  style={{ ...btnGold, width: "100%", marginTop: 8, padding: 10, fontSize: 13, opacity: sendingTip || !tipText.trim() ? 0.7 : 1 }}
                >
                  {sendingTip ? "Enviando..." : "Enviar dica"}
                </button>
              </>
            )}
          </section>
        </aside>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
        <section style={{ ...dashCard, borderRadius: 12, padding: 20 }}>
          <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 16 }}>Sobre mim</h3>
          {resumo.bloqueado ? (
            <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
              Libere o contato para ver as informações pessoais do candidato.
            </p>
          ) : sobreMimPreenchido && sobreMim ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              {CAMPOS_SOBRE_MIM.map(({ key, label }) => (
                <Campo key={key} label={label} value={sobreMim[key] || "—"} />
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
              O candidato ainda não preencheu esta seção.
            </p>
          )}
        </section>

        <section style={{ ...dashCard, borderRadius: 12, padding: 20 }}>
          <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 16 }}>Teste comportamental</h3>
          {testeComportamental ? (
            (() => {
              const info = PERFIL_INFO[testeComportamental.perfilPrincipal];
              const soma = testeComportamental.pontuacoes[testeComportamental.perfilPrincipal];
              return (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 800, color: DASH.gold }}>
                    {info.emoji} Perfil predominante: {info.titulo} — {soma} pontos
                  </p>
                  <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
                    {QUESTOES_POR_PERFIL} perguntas deste perfil · notas de 1 a 5 · máx. {PONTUACAO_MAXIMA_PERFIL} pts
                  </p>
                  <div style={{ marginBottom: 10 }}>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Para o candidato</p>
                    <p style={{ ...valueStyle, fontSize: 13 }}>{info.paraCandidato}</p>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ ...labelStyle, marginBottom: 4 }}>Visão do recrutador</p>
                    <p style={{ ...valueStyle, fontSize: 13 }}>{info.visaoRecrutador}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                    {(["executor", "comunicador", "planejador", "analista"] as const).map((perfil) => (
                      <div
                        key={perfil}
                        style={{
                          padding: "8px 10px",
                          ...dashInnerBox,
                          borderColor: testeComportamental.perfilPrincipal === perfil ? DASH.gold : DASH.border,
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 10, color: DASH.muted }}>
                          {PERFIL_INFO[perfil].emoji} {PERFIL_INFO[perfil].titulo}
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 700, color: DASH.text }}>
                          {testeComportamental.pontuacoes[perfil]} pts
                        </p>
                        <p style={{ margin: 0, fontSize: 9, color: DASH.muted }}>máx. {PONTUACAO_MAXIMA_PERFIL}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
              O candidato ainda não realizou o teste comportamental.
            </p>
          )}
        </section>

        <section style={{ ...dashCard, borderRadius: 12, padding: 20 }}>
          <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 16 }}>Documentos anexados</h3>
          {resumo.bloqueado ? (
            <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
              Libere o contato para acessar currículo, atestados e demais anexos.
            </p>
          ) : documentos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {documentos.map((doc) => (
                <a
                  key={`${doc.label}-${doc.url}`}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 12px",
                    ...dashInnerBox,
                    borderRadius: 8,
                    textDecoration: "none",
                    color: DASH.text,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>📄 {doc.label}</span>
                  <span style={{ fontSize: 11, color: DASH.muted }}>{nomeArquivoAnexado(doc.url)}</span>
                </a>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
              Nenhum documento anexado pelo candidato.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

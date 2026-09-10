"use client";

import React, { useMemo, useState } from "react";
import { DASH, dashCard, dashInnerBox, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import {
  formatInterviewComprovante,
  isArquivada,
  isEntrevista,
  isPropostaAtiva,
} from "@/lib/company/job-proposals-shared";
import { AVISO_RETENCAO_PROPOSTAS } from "@/lib/profile/inbox-retention";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";
import css from "./ProfessionalOpportunityBoard.module.css";

type Props = {
  proposals: JobProposalDTO[];
  onChanged: () => void;
};

const rowStyle: React.CSSProperties = {
  border: `1px solid ${DASH.border}`,
  borderRadius: 14,
  background: DASH.inner,
};

const nestedCard: React.CSSProperties = {
  ...dashInnerBox,
  padding: 12,
  background: DASH.inner,
};

export { isArquivada, isEntrevista, isPropostaAtiva };

function trackingOf(p: JobProposalDTO) {
  return (
    p.tracking || {
      contatado: false,
      entrevistado: false,
      emTeste: false,
      contratado: false,
      naoContratado: false,
      entrevistaCancelada: false,
    }
  );
}

export default function ProfessionalOpportunityBoard({ proposals, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [abertaId, setAbertaId] = useState<string | null>(null);

  const listas = useMemo(() => {
    const propostas = proposals.filter(isPropostaAtiva);
    const entrevistas = proposals.filter(isEntrevista).sort((a, b) => {
      const ta = a.interview ? new Date(a.interview.scheduledAt).getTime() : 0;
      const tb = b.interview ? new Date(b.interview.scheduledAt).getTime() : 0;
      return ta - tb;
    });
    const arquivadas = proposals.filter(isArquivada);
    return { propostas, entrevistas, arquivadas };
  }, [proposals]);

  const responder = async (id: string, action: "INTERESTED" | "MORE_INFO" | "DECLINED") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/professional/proposals/${id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao responder");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao responder proposta");
    } finally {
      setBusyId(null);
    }
  };

  const responderEntrevista = async (id: string, action: "CONFIRM" | "DECLINE") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/professional/proposals/${id}/interview-respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao responder entrevista");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao responder entrevista");
    } finally {
      setBusyId(null);
    }
  };

  const toggleFunil = async (
    id: string,
    campo: "entrevistado" | "emTeste" | "contratado" | "naoContratado" | "entrevistaCancelada",
    atual: boolean,
  ) => {
    setBusyId(id);
    try {
      const body: Record<string, unknown> = { [campo]: !atual };
      if (campo === "entrevistaCancelada" && !atual) {
        const justification = window.prompt(
          "Justificativa do cancelamento da entrevista (opcional):",
          "",
        );
        if (justification === null) {
          setBusyId(null);
          return;
        }
        body.justification = justification.trim() || "Cancelada pelo profissional";
      }
      if (campo === "contratado" && !atual) body.naoContratado = false;
      if (campo === "naoContratado" && !atual) body.contratado = false;

      const res = await fetch(`/api/professional/proposals/${id}/funnel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao atualizar");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao atualizar histórico");
    } finally {
      setBusyId(null);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este item? Itens com mais de 1 mês também são removidos automaticamente.")) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/professional/proposals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir");
        return;
      }
      onChanged();
    } catch {
      alert("Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "5px 8px",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 8,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
    border: `1px solid ${active ? DASH.gold : DASH.border}`,
    background: active ? "rgba(200,155,60,0.22)" : "transparent",
    color: active ? DASH.gold : DASH.muted,
    fontFamily: "inherit",
  });

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${DASH.border}`,
    color: DASH.muted,
    borderRadius: 8,
    padding: "5px 8px",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const renderProposta = (p: JobProposalDTO) => {
    const busy = busyId === p.id;
    const detalhe = [formatReaisDisplay(p.salario), turnoPropostaLabel(p.turno), p.cidade?.trim() || null]
      .filter(Boolean)
      .join(" · ");

    const aberto = abertaId === p.id;

    return (
      <article
        key={p.id}
        className={css.row}
        style={rowStyle}
        onClick={() => setAbertaId(aberto ? null : p.id)}
      >
        <div className={css.texto}>
          <p
            className={css.titulo}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: DASH.title,
              textTransform: "uppercase",
            }}
          >
            {p.companyName} · {p.cargo}
          </p>
          <p className={css.sub} style={{ marginTop: 2, fontSize: 10, color: DASH.muted }}>
            {detalhe}
            {p.status === "INTERESTED" ? " · Aguardando agenda" : ""}
            {aberto ? "" : " · Toque para ver a proposta"}
          </p>
        </div>
        <div className={css.acoes} onClick={(e) => e.stopPropagation()}>
          {(p.status === "SENT" || p.status === "MORE_INFO") && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void responder(p.id, "INTERESTED")}
                style={{ ...btnGold, padding: "5px 8px", fontSize: 10, whiteSpace: "nowrap" }}
              >
                Interesse
              </button>
              {p.status === "SENT" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void responder(p.id, "MORE_INFO")}
                  className="ri-dash-btn-secondary"
                  style={btnGhost}
                >
                  + Info
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void responder(p.id, "DECLINED")}
                style={{ ...btnGhost, color: "#e57373" }}
              >
                Recusar
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void excluir(p.id)}
            style={{ ...btnGhost, color: "#e57373" }}
          >
            Excluir
          </button>
        </div>
        {aberto && (
          <div className={css.detalhe} style={{ color: DASH.text }}>
            {p.beneficios?.trim() ? (
              <p style={{ margin: "0 0 8px" }}>
                <strong style={{ color: DASH.title }}>Benefícios:</strong> {p.beneficios}
              </p>
            ) : null}
            <p style={{ margin: 0 }}>
              <strong style={{ color: DASH.title }}>Mensagem:</strong> {p.mensagem || "Sem mensagem."}
            </p>
          </div>
        )}
      </article>
    );
  };

  const renderEntrevista = (p: JobProposalDTO) => {
    if (!p.interview) return null;
    const busy = busyId === p.id;
    const t = trackingOf(p);
    const comprovante = formatInterviewComprovante({
      companyName: p.companyName,
      scheduledAt: p.interview.scheduledAt,
      locationType: p.interview.locationType,
      address: p.interview.address,
      meetingUrl: p.interview.meetingUrl,
      observacoes: p.interview.observacoes,
    });

    return (
      <article key={p.id} className={css.row} style={rowStyle}>
        <div className={css.texto}>
          <p
            className={css.titulo}
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: DASH.title,
              textTransform: "uppercase",
            }}
          >
            {p.companyName} · {p.cargo}
          </p>
          <p className={css.sub} style={{ marginTop: 2, fontSize: 10, color: DASH.muted }}>
            {comprovante.dataLabel} · {comprovante.horaLabel} · {comprovante.localLabel}
          </p>
          {p.interview.observacoes?.trim() ? (
            <p className={css.sub} style={{ marginTop: 6, fontSize: 11, color: DASH.text, whiteSpace: "pre-wrap" }}>
              <strong style={{ color: DASH.title }}>Observação:</strong> {p.interview.observacoes.trim()}
            </p>
          ) : null}
        </div>
        <div
          className={css.acoes}
          style={{
            alignItems: "center",
          }}
        >
          {p.status === "INTERVIEW_PENDING" && (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void responderEntrevista(p.id, "CONFIRM")}
                style={{ ...btnGold, padding: "5px 8px", fontSize: 10, whiteSpace: "nowrap" }}
              >
                Confirmar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void responderEntrevista(p.id, "DECLINE")}
                style={{ ...btnGhost, color: "#e57373" }}
              >
                Recusar
              </button>
            </>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFunil(p.id, "entrevistado", t.entrevistado)}
            style={chip(t.entrevistado)}
          >
            {t.entrevistado ? "✓ " : ""}Entrevistado
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFunil(p.id, "emTeste", t.emTeste)}
            style={chip(t.emTeste)}
          >
            {t.emTeste ? "✓ " : ""}Teste
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFunil(p.id, "entrevistaCancelada", t.entrevistaCancelada)}
            style={chip(t.entrevistaCancelada)}
          >
            {t.entrevistaCancelada ? "✓ " : ""}Entrevista cancelada
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFunil(p.id, "contratado", t.contratado)}
            style={chip(t.contratado)}
          >
            {t.contratado ? "✓ " : ""}Contratado
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleFunil(p.id, "naoContratado", t.naoContratado)}
            style={chip(t.naoContratado)}
          >
            {t.naoContratado ? "✓ " : ""}Não contratado
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void excluir(p.id)}
            style={{ ...btnGhost, color: "#e57373" }}
          >
            Excluir
          </button>
        </div>
      </article>
    );
  };

  const renderArquivada = (p: JobProposalDTO) => {
    const busy = busyId === p.id;
    const t = trackingOf(p);
    const motivo = t.contratado
      ? "Contratado"
      : t.naoContratado
        ? "Não contratado"
        : t.entrevistaCancelada || p.status === "INTERVIEW_CANCELLED"
          ? "Entrevista cancelada"
          : p.status === "DECLINED"
            ? "Sem interesse"
            : p.status === "INTERVIEW_DECLINED"
              ? "Entrevista recusada"
              : "Arquivada";

    return (
      <article
        key={p.id}
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: 8,
          flex: "0 0 auto",
          minWidth: 200,
          maxWidth: 260,
          boxSizing: "border-box",
          padding: "8px 10px",
          border: `1px solid ${DASH.border}`,
          borderRadius: 14,
          background: DASH.inner,
        }}
      >
        <button
          type="button"
          disabled={busy}
          onClick={() => void excluir(p.id)}
          title="Excluir"
          style={{
            ...btnGhost,
            color: "#e57373",
            borderColor: "rgba(229,115,115,0.55)",
            flexShrink: 0,
            padding: "4px 8px",
            fontSize: 10,
          }}
        >
          Excluir
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              color: DASH.title,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.companyName}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 10,
              color: DASH.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p.cargo}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 9,
              color: DASH.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {motivo}
          </p>
        </div>
      </article>
    );
  };

  return (
    <section className={`dash-card ${css.board}`} style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
      <h3 style={{ ...dashSectionTitle, margin: "0 0 6px", fontSize: 14 }}>
        Oportunidades
      </h3>
      <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
        {AVISO_RETENCAO_PROPOSTAS}
      </p>

      {listas.entrevistas.some((p) => p.status === "INTERVIEW_PENDING") && (
        <div
          role="status"
          style={{
            margin: "0 0 12px",
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${DASH.gold}`,
            background: "rgba(200,155,60,0.14)",
          }}
        >
          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 800, color: DASH.gold }}>
            Confirme sua entrevista
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: DASH.text, lineHeight: 1.45 }}>
            Há convite(s) aguardando sua confirmação. Use Confirmar ou Recusar na lista abaixo.
          </p>
          <button
            type="button"
            onClick={() => {
              document.getElementById("prof-entrevistas-agendadas")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            style={{ ...btnGold, padding: "7px 12px", fontSize: 11 }}
          >
            Ver entrevistas
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={nestedCard}>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: DASH.muted }}>
            Propostas recebidas ({listas.propostas.length})
          </h4>
          {listas.propostas.length === 0 ? (
            <div className="ri-dash-empty">
              <strong>Nenhuma proposta ativa</strong>
              <span>Quando uma empresa enviar uma proposta de vaga, ela aparece aqui para você responder.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {listas.propostas.map(renderProposta)}
            </div>
          )}
        </div>

        <div id="prof-entrevistas-agendadas" style={nestedCard}>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: DASH.muted }}>
            Entrevistas agendadas ({listas.entrevistas.length})
          </h4>
          {listas.entrevistas.length === 0 ? (
            <div className="ri-dash-empty">
              <strong>Nenhuma entrevista agendada</strong>
              <span>Após demonstrar interesse, a empresa pode marcar a entrevista — ela entra nesta lista.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {listas.entrevistas.map(renderEntrevista)}
            </div>
          )}
        </div>

        <div style={nestedCard}>
          <h4 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 600, color: DASH.muted }}>
            Arquivadas ({listas.arquivadas.length})
          </h4>
          {listas.arquivadas.length === 0 ? (
            <div className="ri-dash-empty">
              <strong>Nada arquivado ainda</strong>
              <span>Propostas recusadas, entrevistas encerradas ou canceladas ficam aqui por um tempo.</span>
            </div>
          ) : (
            <div className={css.listaArquivadas}>
              {listas.arquivadas.map(renderArquivada)}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

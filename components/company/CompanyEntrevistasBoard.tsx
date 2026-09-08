"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DASH, dashCard, dashInnerBox, dashSectionTitle } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { companyProfessionalPath } from "@/lib/profile/public-slug";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import { AVISO_RETENCAO_PROPOSTAS } from "@/lib/profile/inbox-retention";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";
import ProfessionalRecruitmentHistory, {
  type RecruitmentHistoryCounts,
} from "@/components/professional/ProfessionalRecruitmentHistory";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import {
  isArquivada,
  isEntrevista,
  isPropostaAtiva,
} from "@/components/professional/ProfessionalOpportunityBoard";
import CompanyEntrevistaCard from "@/components/company/CompanyEntrevistaCard";

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: `1px solid ${DASH.border}`,
  borderRadius: 14,
  background: DASH.inner,
};

const nestedCard: React.CSSProperties = {
  ...dashInnerBox,
  padding: 12,
  background: DASH.inner,
};

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

/**
 * Aba Entrevistas da empresa — espelha o fluxo do profissional:
 * propostas ativas, entrevistas (com funil), arquivadas + histórico.
 */
export default function CompanyEntrevistasBoard() {
  const router = useRouter();
  const [proposals, setProposals] = useState<JobProposalDTO[]>([]);
  const [history, setHistory] = useState<RecruitmentHistoryCounts>({
    propostas: 0,
    entrevistas: 0,
    testes: 0,
    contratacoes: 0,
    naoContratacoes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelMenuId, setCancelMenuId] = useState<string | null>(null);
  const [cancelMode, setCancelMode] = useState<"menu" | "justify" | "reschedule" | null>(null);
  const [justification, setJustification] = useState("");
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    time: "",
    locationType: "PLATFORM" as "PRESENTIAL" | "ONLINE" | "PLATFORM",
    address: "",
    meetingUrl: "",
    observacoes: "",
  });

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/company/proposals/opportunities", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error(data.error || "Falha ao carregar oportunidades");
        return;
      }
      setProposals(data.proposals || []);
      if (data.history) {
        setHistory({
          propostas: data.history.propostas || 0,
          entrevistas: data.history.entrevistas || 0,
          testes: data.history.testes || 0,
          contratacoes: data.history.contratacoes || 0,
          naoContratacoes: data.history.naoContratacoes || 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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

  const toggleFunil = async (
    p: JobProposalDTO,
    campo: "entrevistado" | "emTeste" | "contratado" | "naoContratado",
    atual: boolean,
  ) => {
    setBusyId(p.id);
    try {
      const body: Record<string, boolean> = { [campo]: !atual };
      if (campo === "contratado" && !atual) body.naoContratado = false;
      if (campo === "naoContratado" && !atual) body.contratado = false;
      if ((campo === "contratado" || campo === "naoContratado") && !atual) {
        body.entrevistado = true;
      }

      const res = await fetch(`/api/company/proposals/${encodeURIComponent(p.id)}/funnel`, {
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
      await reload();
    } catch {
      alert("Erro ao atualizar acompanhamento");
    } finally {
      setBusyId(null);
    }
  };

  const excluir = async (id: string) => {
    if (
      !confirm(
        "Excluir esta proposta? Ela some também para o profissional. Use isso se a empresa se arrependeu de enviar.",
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/company/proposals/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao excluir");
        return;
      }
      await reload();
    } catch {
      alert("Erro ao excluir");
    } finally {
      setBusyId(null);
    }
  };

  const abrirCancelar = (id: string) => {
    setCancelMenuId(id);
    setCancelMode("menu");
    setJustification("");
  };

  const fecharCancelar = () => {
    setCancelMenuId(null);
    setCancelMode(null);
    setJustification("");
  };

  const cancelarComJustificativa = async (proposalId: string) => {
    const motivo = justification.trim();
    if (!motivo) {
      alert("Informe a justificativa do cancelamento.");
      return;
    }
    setBusyId(proposalId);
    try {
      const res = await fetch(
        `/api/company/proposals/${encodeURIComponent(proposalId)}/interview/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ justification: motivo }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao cancelar");
        return;
      }
      fecharCancelar();
      await reload();
    } catch {
      alert("Erro ao cancelar entrevista");
    } finally {
      setBusyId(null);
    }
  };

  const reagendar = async (proposalId: string) => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      alert("Preencha data e horário.");
      return;
    }
    setBusyId(proposalId);
    try {
      const scheduledAt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}:00`);
      const res = await fetch(`/api/company/proposals/${encodeURIComponent(proposalId)}/interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          scheduledAt: scheduledAt.toISOString(),
          locationType: rescheduleForm.locationType,
          address: rescheduleForm.address,
          meetingUrl: rescheduleForm.meetingUrl,
          observacoes: rescheduleForm.observacoes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Erro ao reagendar");
        return;
      }
      fecharCancelar();
      setRescheduleForm({
        date: "",
        time: "",
        locationType: "PLATFORM",
        address: "",
        meetingUrl: "",
        observacoes: "",
      });
      await reload();
    } catch {
      alert("Erro ao reagendar entrevista");
    } finally {
      setBusyId(null);
    }
  };

  const btnGhost: React.CSSProperties = {
    background: "transparent",
    border: `1px solid ${DASH.border}`,
    color: DASH.text,
    borderRadius: 8,
    padding: "5px 8px",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };

  const nomeProf = (p: JobProposalDTO) => p.professionalName || "Profissional";

  const renderProposta = (p: JobProposalDTO) => {
    const busy = busyId === p.id;
    const detalhe = [formatReaisDisplay(p.salario), turnoPropostaLabel(p.turno), p.cidade?.trim() || null]
      .filter(Boolean)
      .join(" · ");

    return (
      <article key={p.id} style={rowStyle}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void excluir(p.id)}
          style={{ ...btnGhost, color: "#e57373", borderColor: "rgba(229,115,115,0.55)" }}
        >
          Excluir
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 800,
              color: DASH.gold,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {nomeProf(p)} · {p.cargo}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 10,
              color: DASH.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {detalhe || p.status}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => router.push(companyProfessionalPath(p.profileId, p.profileId))}
            style={{ ...btnGold, padding: "5px 8px", fontSize: 10 }}
          >
            Perfil
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
            ? "Proposta recusada"
            : p.status === "INTERVIEW_DECLINED"
              ? "Entrevista recusada"
              : "Arquivada";

    return (
      <article key={p.id} style={rowStyle}>
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
              color: DASH.gold,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {nomeProf(p)}
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
        <button
          type="button"
          onClick={() => router.push(companyProfessionalPath(p.profileId))}
          style={{ ...btnGhost, flexShrink: 0 }}
        >
          Perfil
        </button>
      </article>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
        <AmpulhetaLoading label="Carregando entrevistas..." size={32} color={DASH.gold} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
        <h3 style={{ ...dashSectionTitle, color: DASH.gold, margin: "0 0 6px", fontSize: 14 }}>
          📅 Entrevistas e acompanhamento
        </h3>
        <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
          {AVISO_RETENCAO_PROPOSTAS} Após marcar Contratado ou Não contratado, o item vai para Arquivadas.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={nestedCard}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Propostas ativas ({listas.propostas.length})
            </h4>
            {listas.propostas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhuma proposta ativa.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {listas.propostas.map(renderProposta)}
              </div>
            )}
          </div>

          <div style={nestedCard}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Entrevistas agendadas ({listas.entrevistas.length})
            </h4>
            {listas.entrevistas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
                Quando você agendar entrevistas a partir de propostas, elas aparecerão aqui.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {listas.entrevistas.map((p) => (
                  <CompanyEntrevistaCard
                    key={p.id}
                    proposal={p}
                    busy={busyId === p.id}
                    cancelOpen={cancelMenuId === p.id}
                    cancelMode={cancelMode}
                    justification={justification}
                    rescheduleForm={rescheduleForm}
                    onExcluir={() => void excluir(p.id)}
                    onToggleFunil={(campo, atual) => void toggleFunil(p, campo, atual)}
                    onAbrirCancelar={() => abrirCancelar(p.id)}
                    onFecharCancelar={fecharCancelar}
                    onSetCancelMode={setCancelMode}
                    onSetJustification={setJustification}
                    onSetRescheduleForm={setRescheduleForm}
                    onCancelarComJustificativa={() => void cancelarComJustificativa(p.id)}
                    onReagendar={() => void reagendar(p.id)}
                    onPerfil={() => router.push(companyProfessionalPath(p.profileId, p.profileId))}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={nestedCard}>
            <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: DASH.gold }}>
              Arquivadas ({listas.arquivadas.length})
            </h4>
            {listas.arquivadas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhum item arquivado.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  flexWrap: "nowrap",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {listas.arquivadas.map(renderArquivada)}
              </div>
            )}
          </div>
        </div>
      </section>

      <ProfessionalRecruitmentHistory history={history} />
    </div>
  );
}

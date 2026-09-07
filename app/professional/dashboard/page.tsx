/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import InstallAppPrompt from "@/components/pwa/InstallAppPrompt";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  DashboardThemeShell,
  dashCard,
  dashHeader,
  dashInnerBox,
  dashSectionTitle,
  compatBadgeStyle,
} from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import {
  PERFIL_INFO,
  TOTAL_PERGUNTAS_TESTE,
  type ResultadoTesteComportamental,
} from "@/lib/teste-comportamental";
import { AVISO_RETENCAO_INBOX } from "@/lib/profile/inbox-retention";
import CarreiraTimeline from "@/components/professional/CarreiraTimeline";
import ProfessionalOpportunityBoard from "@/components/professional/ProfessionalOpportunityBoard";
import ProfessionalRecruitmentHistory, {
  type RecruitmentHistoryCounts,
} from "@/components/professional/ProfessionalRecruitmentHistory";
import PlatformVideoCall from "@/components/shared/PlatformVideoCall";
import { buildCareerTimeline } from "@/lib/professional/career-timeline";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";

const VAZIO = "—";
/** Títulos de seção do dashboard profissional — dourado */
const dashTitleProf = { ...dashSectionTitle, color: DASH.gold };

interface ProfileData {
  nome?: string;
  email?: string;
  profissao?: string;
  cargoDesejado?: string;
  localizacao?: string;
  experiencia?: string;
  avatar?: string | null;
  fotoPerfil?: string | null;
  formEdit?: FormEditPayload | null;
  profileCompletion?: number;
}

interface Tip {
  id: string;
  message: string;
  isAnonymous: boolean;
  createdAt: string;
}

interface InboxMessage {
  id: string;
  from: string;
  body: string;
  createdAt: string;
  senderRole?: "COMPANY" | "PROFESSIONAL";
  replyToId?: string | null;
  companyUserId?: string;
  companyName?: string;
  replies?: InboxMessage[];
}

interface ProfileViewItem {
  id: string;
  createdAt: string;
  viewType: string;
  companyName: string | null;
}

const btnExcluirStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#e57373",
  fontSize: 10,
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "underline",
  padding: "2px 4px",
  flexShrink: 0,
};

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarDataHoraCurta(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function textoContagemVisualizacoesSemana(qtd: number): string {
  if (qtd === 0) return "Nenhuma visualização esta semana";
  if (qtd === 1) return "1 visualização esta semana";
  return `${qtd} visualizações esta semana`;
}

export default function DashboardProfissional() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formEdit, setFormEdit] = useState<FormEditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [proposals, setProposals] = useState<JobProposalDTO[]>([]);
  const [recruitmentHistory, setRecruitmentHistory] = useState<RecruitmentHistoryCounts>({
    propostas: 0,
    entrevistas: 0,
    testes: 0,
    contratacoes: 0,
    naoContratacoes: 0,
  });
  const [mensagemAbertaId, setMensagemAbertaId] = useState<string | null>(null);
  const [respostaTexto, setRespostaTexto] = useState<Record<string, string>>({});
  const [enviandoRespostaId, setEnviandoRespostaId] = useState<string | null>(null);
  const [abaDireita, setAbaDireita] = useState<"oportunidades" | "dicas" | "mensagens">("oportunidades");
  const [weekViewsCount, setWeekViewsCount] = useState(0);
  const [lastViewAt, setLastViewAt] = useState<string | null>(null);
  const [lastViewCompany, setLastViewCompany] = useState<string | null>(null);
  const [weekViews, setWeekViews] = useState<ProfileViewItem[]>([]);
  const [companyNamesHidden, setCompanyNamesHidden] = useState(true);
  const [testeComportamental, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/professional/profile", { credentials: "include" });
        if (res.status === 401) {
          router.push("/login?tipo=profissional");
          return;
        }
        if (!res.ok) throw new Error("Erro ao buscar perfil");
        const data = await res.json();
        if (!data.registrationComplete) {
          router.replace("/professional/register");
          return;
        }
        setProfileData(data);
        setFormEdit(data.formEdit || null);
        setLoading(false);

        const [tipsRes, viewsRes, testeRes, msgsRes, propsRes, histRes] = await Promise.all([
          fetch("/api/professional/tips", { credentials: "include" }),
          fetch("/api/professional/profile-views", { credentials: "include" }),
          fetch("/api/professional/teste-comportamental", { credentials: "include" }),
          fetch("/api/professional/messages", { credentials: "include" }),
          fetch("/api/professional/proposals", { credentials: "include" }),
          fetch("/api/professional/recruitment-history", { credentials: "include" }),
        ]);

        if (tipsRes.ok) {
          const tipsData = await tipsRes.json();
          setTips(tipsData.tips || []);
        }

        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          const semana = (viewsData.weekViews || []) as ProfileViewItem[];
          setWeekViews(semana);
          setWeekViewsCount(viewsData.weekViewsCount ?? semana.length);
          setLastViewAt(viewsData.lastViewAt || null);
          setLastViewCompany(viewsData.lastViewCompany || null);
          setCompanyNamesHidden(Boolean(viewsData.companyNamesHidden));
        }

        if (testeRes.ok) {
          const testeData = await testeRes.json();
          if (testeData.resultado) setTesteComportamental(testeData.resultado);
        }

        try {
          const fresh = sessionStorage.getItem("ri-teste-resultado");
          if (fresh) {
            sessionStorage.removeItem("ri-teste-resultado");
            const parsed = JSON.parse(fresh) as ResultadoTesteComportamental;
            if (parsed?.perfilPrincipal) setTesteComportamental(parsed);
          }
        } catch {
          /* ignore */
        }

        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          setInboxMessages((msgsData.messages || []) as InboxMessage[]);
        }

        if (propsRes.ok) {
          const propsData = await propsRes.json();
          setProposals((propsData.proposals || []) as JobProposalDTO[]);
        }

        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.history) {
            setRecruitmentHistory(histData.history as RecruitmentHistoryCounts);
          }
        }
      } catch {
        setError("Não foi possível carregar o perfil.");
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [router]);

  // Mantém o profissional "online" enquanto estiver no painel; ao sair, marca offline
  useEffect(() => {
    let cancelled = false;

    const beat = async () => {
      try {
        await fetch("/api/presence/heartbeat", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        /* ignore */
      }
    };

    const goOffline = () => {
      const payload = JSON.stringify({ offline: true });
      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/presence/heartbeat", blob);
          return;
        }
      } catch {
        /* fallback abaixo */
      }
      void fetch("/api/presence/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    };

    void beat();
    const id = window.setInterval(() => {
      if (!cancelled) void beat();
    }, 45000);

    const onPageHide = () => goOffline();
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
      goOffline();
    };
  }, []);

  const reloadProposals = async () => {
    try {
      const res = await fetch("/api/professional/proposals", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setProposals((data.proposals || []) as JobProposalDTO[]);
      }
      const histRes = await fetch("/api/professional/recruitment-history", { credentials: "include" });
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.history) {
          setRecruitmentHistory(histData.history as RecruitmentHistoryCounts);
        }
      }
      const msgsRes = await fetch("/api/professional/messages", { credentials: "include" });
      if (msgsRes.ok) {
        const msgsData = await msgsRes.json();
        setInboxMessages((msgsData.messages || []) as InboxMessage[]);
      }
    } catch {
      /* ignore */
    }
  };

  const handleFotoClick = () => fileInputRef.current?.click();

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatars");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        alert(`Erro ao fazer upload: ${errorData.error}`);
        return;
      }
      const uploadData = await uploadRes.json();
      setProfileData((prev) => (prev ? { ...prev, avatar: uploadData.file.url } : prev));
      alert("Foto salva com sucesso!");
    } catch {
      alert("Erro ao fazer upload da foto. Tente novamente.");
    }
  };

  const handleLogout = () => {
    try {
      const payload = JSON.stringify({ offline: true });
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/presence/heartbeat", new Blob([payload], { type: "application/json" }));
      }
    } catch {
      /* ignore */
    }
    window.location.href = "/api/auth/logout";
  };

  if (loading) {
    return (
      <DashboardThemeShell className="ri-dash-prof">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AmpulhetaLoading label="Carregando perfil..." size={42} color={DASH.gold} />
        </div>
      </DashboardThemeShell>
    );
  }

  if (error) {
    return (
      <DashboardThemeShell className="ri-dash-prof">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc3545", fontSize: 20 }}>
          {error}
        </div>
      </DashboardThemeShell>
    );
  }

  if (!profileData) {
    return (
      <DashboardThemeShell className="ri-dash-prof">
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          Perfil não encontrado.
        </div>
      </DashboardThemeShell>
    );
  }

  const edit = formEdit ?? profileData.formEdit ?? null;
  const fd = edit?.formData ?? {};
  const valor = (chave: string, alternativo?: unknown) => {
    const v = fd[chave];
    if (v !== undefined && v !== null && v !== "") return v;
    if (alternativo !== undefined && alternativo !== null && alternativo !== "") return alternativo;
    return VAZIO;
  };

  const fotoPerfil = fd.fotoPerfil || profileData.fotoPerfil || profileData.avatar;

  const nomeExibicao = (() => {
    const n = fd.nome ?? profileData.nome;
    if (n && String(n) !== "" && String(n) !== VAZIO) return String(n);
    return profileData.email?.split("@")[0] || "Usuário";
  })();

  const cargoResumo = String(valor("cargoDesejado", profileData.cargoDesejado || profileData.profissao));
  const areaResumo = String(valor("areaInteresse", fd.areaInteresse));
  const localResumo = [fd.cidade, fd.estado].filter(Boolean).join(", ") || String(profileData.localizacao || VAZIO);
  const escolaridadeResumo = String(valor("escolaridade", fd.escolaridade));
  const turnoResumo = String(valor("turnoDisponivel", fd.turnoDisponivel));
  const experienciaResumo = String(valor("tempoExperiencia", profileData.experiencia));
  const recolocacaoResumo = String(valor("recolocacao", fd.recolocacao));
  const empresasTimeline = edit?.empresas ?? [];
  const temLinhaTempo = buildCareerTimeline(empresasTimeline).length > 0;

  const toggleMensagemAberta = (id: string) => {
    setMensagemAbertaId((atual) => (atual === id ? null : id));
  };

  const handleExcluirMensagem = async (messageId: string) => {
    if (!window.confirm("Excluir esta mensagem?")) return;
    try {
      const res = await fetch(`/api/professional/messages?id=${encodeURIComponent(messageId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      const next = inboxMessages.filter((msg) => msg.id !== messageId);
      setInboxMessages(next);
      if (mensagemAbertaId === messageId) setMensagemAbertaId(null);
    } catch {
      alert("Não foi possível excluir a mensagem.");
    }
  };

  const handleResponderMensagem = async (messageId: string) => {
    const texto = (respostaTexto[messageId] || "").trim();
    if (!texto) return;
    setEnviandoRespostaId(messageId);
    try {
      const res = await fetch("/api/professional/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyToId: messageId, body: texto }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Não foi possível enviar a resposta.");
        return;
      }
      const reply = data.message as InboxMessage;
      setInboxMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, replies: [...(msg.replies || []), reply] }
            : msg,
        ),
      );
      setRespostaTexto((prev) => ({ ...prev, [messageId]: "" }));
    } catch {
      alert("Erro de rede ao enviar a resposta.");
    } finally {
      setEnviandoRespostaId(null);
    }
  };

  const handleExcluirDica = async (tipId: string) => {
    if (!window.confirm("Excluir esta dica?")) return;
    try {
      const res = await fetch(`/api/professional/tips/${tipId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      setTips((prev) => prev.filter((tip) => tip.id !== tipId));
    } catch {
      alert("Não foi possível excluir a dica.");
    }
  };

  return (
    <DashboardThemeShell className="ri-dash-prof" style={{ width: "100%", maxWidth: "none" }}>
      <header
        style={{
          ...dashHeader,
          padding: "6px 20px 0",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            paddingBottom: 6,
          }}
        >
          <LogoRecruta size="xs" as="span" depth />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <DashboardThemeToggle />
            <InstallAppPrompt variant="inline" />
            <button type="button" onClick={handleLogout} style={{ ...btnGold, padding: "5px 12px", fontSize: 11 }}>
              Sair
            </button>
          </div>
        </div>

        {/* Abas à direita — mesmo lugar do dashboard empresa */}
        <div
          role="tablist"
          aria-label="Área de comunicação"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            alignItems: "center",
            justifyContent: "flex-end",
            width: "100%",
            paddingTop: 2,
          }}
        >
          {(
            [
              { id: "oportunidades" as const, label: "Oportunidades", badge: proposals.length },
              { id: "dicas" as const, label: "Dicas", badge: tips.length },
              { id: "mensagens" as const, label: "Mensagens", badge: inboxMessages.length },
            ]
          ).map((tab) => {
            const ativo = abaDireita === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => setAbaDireita(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  padding: "5px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: ativo ? "#000" : DASH.gold,
                  background: ativo ? DASH.gold : "transparent",
                  border: `1px solid ${DASH.gold}`,
                  borderRadius: "10px 10px 0 0",
                  boxShadow: ativo ? "0 2px 0 #5a4512" : "none",
                  cursor: "pointer",
                  lineHeight: 1.2,
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
                {tab.badge > 0 ? (
                  <span
                    style={{
                      background: ativo ? "#000" : DASH.gold,
                      color: ativo ? DASH.gold : "#000",
                      borderRadius: 999,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 6px",
                    }}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          minHeight: "calc(100vh - 90px)",
          alignItems: "stretch",
        }}
      >
        {/* Esquerda — perfil resumido, visualizações e histórico */}
        <main
          style={{
            padding: "12px 10px 12px 12px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 90px)",
            borderRight: `1px solid ${DASH.border}`,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: "none" }} />

          <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <h3 style={{ ...dashTitleProf, margin: 0, fontSize: 14 }}>Perfil resumido</h3>
              <button
                type="button"
                onClick={() => router.push("/professional/register?edit=1")}
                style={{ ...btnGold, padding: "6px 10px", fontSize: 10, flexShrink: 0 }}
              >
                Editar perfil
              </button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
              É assim que as empresas veem seu perfil antes de liberar o contato.
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <div onClick={handleFotoClick} style={{ cursor: "pointer", flexShrink: 0 }} title="Clique para alterar a foto">
                {fotoPerfil ? (
                  <img
                    src={String(fotoPerfil)}
                    alt="Prévia da foto"
                    style={avatarImageStyle(56)}
                    decoding="async"
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: DASH.input,
                      border: `1px solid ${DASH.gold}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: DASH.gold }}>
                  {nomeExibicao}
                </p>
                <p style={{ margin: "0 0 3px", fontSize: 11, color: DASH.text }}>
                  {cargoResumo} · {areaResumo}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: DASH.muted }}>
                  {localResumo} · {escolaridadeResumo} · {turnoResumo}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: DASH.muted }}>
                  Exp: {experienciaResumo} · Recolocação: {recolocacaoResumo}
                </p>
                {typeof profileData.profileCompletion === "number" && (
                  <span style={{ ...compatBadgeStyle(profileData.profileCompletion, false), marginTop: 8, display: "inline-block" }}>
                    Completude {profileData.profileCompletion}%
                  </span>
                )}
              </div>
            </div>
            {temLinhaTempo && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${DASH.border}` }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: DASH.gold, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Linha do tempo
                </p>
                <CarreiraTimeline experiencias={empresasTimeline} compact />
              </div>
            )}

            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${DASH.border}` }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: DASH.gold, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Perfil pessoal
              </p>
              {testeComportamental ? (
                (() => {
                  const info = PERFIL_INFO[testeComportamental.perfilPrincipal];
                  return (
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: DASH.gold, lineHeight: 1.35 }}>
                        {info.emoji} Perfil predominante: {info.titulo}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: DASH.text }}>
                        {info.paraCandidato}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
                    Descubra como você age no dia a dia com {TOTAL_PERGUNTAS_TESTE} afirmações pessoais. Preencha uma única vez para ver seu perfil aqui no painel.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/professional/dashboard/teste-comportamental")}
                    style={{ ...btnGold, padding: "8px 16px", fontSize: 12 }}
                  >
                    Iniciar
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow, textAlign: "center" }}>
            <h3 style={{ ...dashTitleProf, margin: "0 0 12px", fontSize: 14 }}>Visualizações da semana</h3>
            <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, color: DASH.gold, lineHeight: 1.1 }}>
              {weekViewsCount}
            </p>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: DASH.muted }}>
              {textoContagemVisualizacoesSemana(weekViewsCount)}
            </p>
            {lastViewAt ? (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.text }}>
                Última visualização: <strong>{formatarData(lastViewAt)}</strong>
                {lastViewCompany ? <> · <strong>{lastViewCompany}</strong></> : null}
              </p>
            ) : (
              <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.muted }}>
                Nenhuma empresa visualizou seu perfil nesta semana.
              </p>
            )}

            {!companyNamesHidden && weekViews.length > 0 ? (
              <div style={{ textAlign: "left", marginTop: 8 }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>
                  Empresas que visualizaram
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 160, overflowY: "auto" }}>
                  {weekViews.map((view) => (
                    <div key={view.id} style={{ padding: "6px 8px", ...dashInnerBox, fontSize: 11 }}>
                      <strong style={{ color: DASH.title }}>{view.companyName || "Empresa"}</strong>
                      <span style={{ color: DASH.muted }}> · {formatarDataHoraCurta(view.createdAt)}</span>
                      <span style={{ display: "block", fontSize: 10, color: DASH.muted, marginTop: 2 }}>
                        {view.viewType === "FULL" ? "Perfil completo" : "Resumo"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <ProfessionalRecruitmentHistory history={recruitmentHistory} />
        </main>

        {/* Direita — conteúdo da aba ativa */}
        <aside style={{ padding: "12px 12px 12px 10px", overflowY: "auto", maxHeight: "calc(100vh - 90px)", display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          {abaDireita === "oportunidades" && (
            <>
              <PlatformVideoCall role="professional" title="Chamada de vídeo" peerLabel="empresa" />
              <ProfessionalOpportunityBoard proposals={proposals} onChanged={() => void reloadProposals()} />
            </>
          )}

          {abaDireita === "dicas" && (
          <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashTitleProf, margin: "0 0 6px", fontSize: 14 }}>
              Dicas recebidas ({tips.length})
            </h3>
            <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
              {AVISO_RETENCAO_INBOX}
            </p>
            {tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      border: "none",
                      borderRadius: 14,
                      background: DASH.inner,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          lineHeight: 1.4,
                          color: DASH.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={tip.message}
                      >
                        {tip.message}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: DASH.muted }}>
                        {tip.isAnonymous ? "Dica anônima" : "Empresa"} · {formatarDataHoraCurta(tip.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleExcluirDica(tip.id)}
                      style={{ ...btnExcluirStyle, flexShrink: 0 }}
                      title="Excluir dica"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhuma dica recebida ainda.</p>
            )}
          </section>
          )}

          {abaDireita === "mensagens" && (
          <section className="dash-card" style={{ ...dashCard, padding: 12, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashTitleProf, margin: "0 0 6px", fontSize: 14 }}>
              Mensagens ({inboxMessages.length})
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
              {AVISO_RETENCAO_INBOX} Abra a mensagem para ler e responder à empresa.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
              {inboxMessages.length === 0 ? (
                <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                  Quando uma empresa enviar mensagem, ela aparecerá aqui para você responder.
                </p>
              ) : (
                inboxMessages.map((msg) => {
                  const aberta = mensagemAbertaId === msg.id;
                  const preview = msg.body.length > 48 ? `${msg.body.slice(0, 48)}...` : msg.body;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        border: "none",
                        borderRadius: 14,
                        background: DASH.inner,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                        <button
                          type="button"
                          onClick={() => toggleMensagemAberta(msg.id)}
                          aria-expanded={aberta}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            padding: 0,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "center",
                            color: DASH.text,
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              fontSize: 11,
                              fontWeight: 700,
                              color: DASH.title,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              textAlign: "center",
                            }}
                          >
                            {msg.from}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 10,
                              color: DASH.muted,
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              textAlign: "center",
                            }}
                          >
                            {aberta ? formatarDataHora(msg.createdAt) : preview}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirMensagem(msg.id)}
                          style={{ ...btnExcluirStyle, flexShrink: 0 }}
                          title="Excluir mensagem"
                        >
                          Excluir
                        </button>
                      </div>
                      {aberta && (
                        <div style={{ padding: "0 10px 10px", borderTop: `1px solid ${DASH.border}` }}>
                          <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.5, color: DASH.text }}>{msg.body}</p>

                          {(msg.replies || []).length > 0 && (
                            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                              {(msg.replies || []).map((r) => (
                                <div
                                  key={r.id}
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    background: "rgba(200,155,60,0.12)",
                                    border: `1px solid ${DASH.gold}`,
                                  }}
                                >
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DASH.gold }}>
                                    Sua resposta · {formatarDataHoraCurta(r.createdAt)}
                                  </p>
                                  <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.45, color: DASH.text }}>
                                    {r.body}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ marginTop: 10 }}>
                            <textarea
                              value={respostaTexto[msg.id] || ""}
                              onChange={(e) =>
                                setRespostaTexto((prev) => ({ ...prev, [msg.id]: e.target.value }))
                              }
                              rows={3}
                              maxLength={1000}
                              placeholder="Escreva sua resposta para a empresa..."
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: 8,
                                borderRadius: 10,
                                border: `1px solid ${DASH.border}`,
                                background: DASH.input,
                                color: DASH.text,
                                fontSize: 12,
                                lineHeight: 1.45,
                                resize: "vertical",
                                fontFamily: "inherit",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => void handleResponderMensagem(msg.id)}
                              disabled={enviandoRespostaId === msg.id || !(respostaTexto[msg.id] || "").trim()}
                              style={{
                                ...btnGold,
                                marginTop: 6,
                                padding: "7px 12px",
                                fontSize: 11,
                                opacity:
                                  enviandoRespostaId === msg.id || !(respostaTexto[msg.id] || "").trim()
                                    ? 0.7
                                    : 1,
                              }}
                            >
                              {enviandoRespostaId === msg.id ? "Enviando..." : "Responder"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
          )}
        </aside>
      </div>
    </DashboardThemeShell>
  );
}

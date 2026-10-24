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
} from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import { type ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import { AVISO_RETENCAO_INBOX } from "@/lib/profile/inbox-retention";
import ProfessionalJobSearch from "@/components/professional/ProfessionalJobSearch";
import CadastroProfissional from "@/app/professional/register/page";
import ProfessionalOpportunityBoard from "@/components/professional/ProfessionalOpportunityBoard";
import ProfessionalRecruitmentHistory, {
  type RecruitmentHistoryCounts,
} from "@/components/professional/ProfessionalRecruitmentHistory";
import PlatformVideoCall from "@/components/shared/PlatformVideoCall";
import DeleteAccountControl from "@/components/shared/DeleteAccountControl";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";

const VAZIO = "—";
/** Títulos de seção — quietos; ouro fica em h1, métricas e CTAs */
const dashTitleProf = { ...dashSectionTitle };

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
  registrationComplete?: boolean;
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
  const [abaDireita, setAbaDireita] = useState<"vagas" | "oportunidades" | "dicas" | "perfil" | "mensagens">("vagas");
  const [perfilEditando, setPerfilEditando] = useState(false);
  const [weekViewsCount, setWeekViewsCount] = useState(0);
  const [lastViewAt, setLastViewAt] = useState<string | null>(null);
  const [lastViewCompany, setLastViewCompany] = useState<string | null>(null);
  const [visitorViews, setVisitorViews] = useState<ProfileViewItem[]>([]);
  const [companyNamesHidden, setCompanyNamesHidden] = useState(true);
  const [, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
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
          const todas = (viewsData.allViews || []) as ProfileViewItem[];
          setVisitorViews(todas);
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
    window.location.href = "/api/auth/logout?redirect=/";
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
  const fotoPerfil = fd.fotoPerfil || profileData.fotoPerfil || profileData.avatar;

  const nomeExibicao = (() => {
    const n = fd.nome ?? profileData.nome;
    if (n && String(n) !== "" && String(n) !== VAZIO) return String(n);
    return profileData.email?.split("@")[0] || "Usuário";
  })();

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

  const paginaInteira = abaDireita === "oportunidades" || abaDireita === "vagas";

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
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <LogoRecruta size="xs" as="span" depth />
            <span className="ri-dash-access-tag">Acesso Profissional</span>
          </div>
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
            gap: 4,
            alignItems: "flex-end",
            justifyContent: "flex-end",
            width: "100%",
            paddingTop: 10,
            borderBottom: "2px solid #8D6B1F",
            marginBottom: 12,
          }}
        >
          {(
            [
              { id: "vagas" as const, label: "Buscar vagas", badge: 0 },
              { id: "oportunidades" as const, label: "Oportunidades", badge: proposals.filter((p) => p.status === "SENT" || p.status === "MORE_INFO" || p.status === "INTERVIEW_PENDING").length },
              { id: "dicas" as const, label: "Dicas", badge: tips.length },
              { id: "mensagens" as const, label: "Mensagens", badge: inboxMessages.length },
              { id: "perfil" as const, label: "Perfil", badge: 0 },
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
                  padding: "8px 16px",
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  color: "#000",
                  background: ativo ? "#E8C56A" : "#F3E6C8",
                  border: "2px solid #8D6B1F",
                  borderBottom: ativo ? "2px solid var(--dash-bg)" : "2px solid #8D6B1F",
                  borderRadius: "14px 14px 0 0",
                  marginBottom: -2,
                  boxShadow: "none",
                  cursor: "pointer",
                  lineHeight: 1.2,
                  fontFamily: "inherit",
                }}
              >
                {tab.label}
                {tab.badge > 0 ? (
                  <span
                    style={{
                      background: "#8D6B1F",
                      color: "#F3E6C8",
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

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: "none" }} />

      <div
        className="ri-dash-two-col"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          width: "100%",
          minHeight: paginaInteira ? 0 : "calc(100vh - 90px)",
          alignItems: "stretch",
        }}
      >
        {/* Esquerda — cadastro completo */}
        <main
          style={{
            padding: "12px 10px 12px 12px",
            overflow: "visible",
            overflowY: "visible",
            maxHeight: "none",
            minHeight: 0,
            borderRight: "none",
            minWidth: 0,
            display: abaDireita === "perfil" ? "flex" : "none",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {abaDireita === "perfil" && (
            <CadastroProfissional
              incorporado
              travado={!perfilEditando}
              onSalvo={() => setPerfilEditando(false)}
              acoes={
                <>
                  <button
                    type="button"
                    onClick={() => setPerfilEditando(true)}
                    disabled={perfilEditando}
                    style={{ ...btnGold, padding: "6px 10px", fontSize: 10, flexShrink: 0, opacity: perfilEditando ? 0.7 : 1 }}
                  >
                    {perfilEditando ? "Campos liberados" : "Editar perfil"}
                  </button>
                  <DeleteAccountControl variant="compact" />
                </>
              }
            />
          )}
        </main>

        {/* Direita — conteúdo da aba ativa */}
        <aside
          data-pagina-inteira={paginaInteira ? "true" : "false"}
          style={{
            padding: "12px 12px 12px 10px",
            overflow: paginaInteira ? "visible" : "auto",
            overflowY: paginaInteira ? "visible" : "auto",
            maxHeight: paginaInteira ? "none" : "calc(100vh - 90px)",
            minHeight: 0,
            display: abaDireita === "perfil" ? "none" : "flex",
            flexDirection: "column",
            gap: 10,
            minWidth: 0,
            scrollbarGutter: paginaInteira ? "auto" : "stable",
          }}
        >
          {abaDireita === "vagas" && (
            <>
              <section className="dash-card" style={{ ...dashCard, padding: "14px 14px 18px", overflow: "visible", boxShadow: DASH.shadow, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div onClick={handleFotoClick} style={{ cursor: "pointer", flexShrink: 0 }} title="Clique para alterar a foto">
                  {fotoPerfil ? (
                    <img src={String(fotoPerfil)} alt="Foto do profissional" style={avatarImageStyle(56)} decoding="async" />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: DASH.input, border: `2px solid #8D6B1F`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
                  )}
                </div>
                <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 16, color: DASH.title }}>{nomeExibicao}</p>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 999,
                      border: "2px solid #8D6B1F",
                      background: "#E8C56A",
                      color: "#000",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                    }}
                  >
                    CADASTRO {typeof profileData.profileCompletion === "number" ? profileData.profileCompletion : 0}%
                  </span>
                </div>
              </section>
              <ProfessionalJobSearch />
            </>
          )}

          {abaDireita === "oportunidades" && (
            <>
              <PlatformVideoCall role="professional" title="Chamada de vídeo" peerLabel="empresa" />
              <ProfessionalOpportunityBoard proposals={proposals} onChanged={() => void reloadProposals()} />
              <section className="dash-card" style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow, textAlign: "center" }}>
                <h3 style={{ ...dashTitleProf, margin: "0 0 12px", fontSize: 14 }}>Quem visualizou meu perfil</h3>
                <p style={{ margin: "0 0 4px", fontSize: 28, fontWeight: 800, color: DASH.gold, lineHeight: 1.1 }}>{weekViewsCount}</p>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.muted }}>
                  {weekViewsCount === 0 ? textoContagemVisualizacoesSemana(weekViewsCount) : "esta semana"}
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                  Uma visita registra que a empresa abriu o perfil. Isso não significa interesse em contratação.
                </p>
                {lastViewAt ? (
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.text }}>
                    Última visualização: <strong>{formatarData(lastViewAt)}</strong>
                    {!companyNamesHidden && lastViewCompany ? <> · <strong>{lastViewCompany}</strong></> : null}
                  </p>
                ) : (
                  <p style={{ margin: "0 0 12px", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                    Ainda não há visita de empresa registrada neste perfil.
                  </p>
                )}
                {companyNamesHidden ? (
                  <p style={{ margin: 0, fontSize: 11, color: DASH.text, lineHeight: 1.45 }}>
                    A lista com o nome das empresas é do plano Premium. A contagem da semana continua no plano gratuito.{" "}
                    <a href="/professional/pagamento" style={{ color: DASH.gold, fontWeight: 700 }}>Conhecer o Premium</a>
                  </p>
                ) : visitorViews.length > 0 ? (
                  <div style={{ textAlign: "left", marginTop: 8 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: DASH.muted, textTransform: "uppercase" }}>Empresas identificadas</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                      {visitorViews.filter((view) => view.companyName).map((view) => (
                        <div key={view.id} style={{ padding: "6px 8px", ...dashInnerBox, fontSize: 11 }}>
                          <strong style={{ color: DASH.title }}>{view.companyName}</strong>
                          <span style={{ color: DASH.muted }}> · {formatarDataHoraCurta(view.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                    {visitorViews.some((view) => !view.companyName) ? (
                      <p style={{ margin: "8px 0 0", fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                        Visitas sem identificação da empresa entram na contagem, mas o nome não é exibido.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </section>
              <ProfessionalRecruitmentHistory history={recruitmentHistory} />
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
              <div className="ri-dash-empty">
                <strong>Nenhuma dica recebida</strong>
                <span>Quando uma empresa deixar uma dica no seu perfil, ela aparece aqui.</span>
              </div>
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
                <div className="ri-dash-empty">
                  <strong>Nenhuma mensagem ainda</strong>
                  <span>Quando uma empresa enviar mensagem, ela aparece aqui para você ler e responder.</span>
                </div>
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
                                    background: "rgba(200,155,60,0.08)",
                                    border: `1px solid ${DASH.border}`,
                                  }}
                                >
                                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DASH.muted }}>
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

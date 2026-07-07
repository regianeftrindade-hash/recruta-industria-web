/* 🔒 BLOQUEADO (06/07/2026) — não editar sem pedido explícito. Ver .cursor/rules/dashboard-page-lock.mdc */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import DashboardThemeToggle from "@/app/components/DashboardThemeToggle";
import LogoRecruta from "@/app/components/LogoRecruta";
import "@/app/dashboard/dashboard-theme.css";
import {
  DASH,
  DashboardThemeShell,
  dashCard,
  dashHeader,
  dashInnerBox,
  dashInput,
  dashLabel,
  dashSectionTitle,
  compatBadgeStyle,
} from "@/lib/dashboard-theme";
import { SOBRE_MIM_LIMITES, SOBRE_MIM_VAZIO, type SobreMimData } from "@/lib/sobre-mim";
import {
  PERFIL_INFO,
  PONTUACAO_MAXIMA_PERFIL,
  QUESTOES_POR_PERFIL,
  type ResultadoTesteComportamental,
} from "@/lib/teste-comportamental";
import VideoApresentacaoSection from "@/components/professional/VideoApresentacaoSection";

const VAZIO = "—";
const LIMITE_LISTA = 10;

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
  hasVideoApresentacao?: boolean;
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

function aplicarLimiteLista<T>(items: T[]): T[] {
  if (items.length > LIMITE_LISTA) return [];
  return items.slice(0, LIMITE_LISTA);
}

function textoContagemVisualizacoesSemana(qtd: number): string {
  if (qtd === 0) return "Nenhuma visualização esta semana";
  if (qtd === 1) return "1 visualização esta semana";
  return `${qtd} visualizações esta semana`;
}

const campoSobreMimStyle: React.CSSProperties = {
  ...dashInput,
  width: "100%",
  fontSize: 10,
  padding: "4px 6px",
  lineHeight: 1.35,
  resize: "none",
  minHeight: 28,
  boxSizing: "border-box",
};

function CampoSobreMim({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
        <label style={{ ...dashLabel, fontSize: 9, margin: 0 }}>{label}</label>
        <span style={{ fontSize: 9, color: DASH.muted }}>{value.length}/{maxLength}</span>
      </div>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={campoSobreMimStyle}
      />
    </div>
  );
}

async function limparDicasSeExceder(tipsFromApi: Tip[]): Promise<Tip[]> {
  if (tipsFromApi.length <= LIMITE_LISTA) return tipsFromApi;
  await Promise.all(
    tipsFromApi.map((tip) =>
      fetch(`/api/professional/tips/${tip.id}`, { method: "DELETE", credentials: "include" })
    )
  );
  return [];
}

export default function DashboardProfissional() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [formEdit, setFormEdit] = useState<FormEditPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [inboxMessages, setInboxMessages] = useState<InboxMessage[]>([]);
  const [mensagemAbertaId, setMensagemAbertaId] = useState<string | null>(null);
  const [sobreMim, setSobreMim] = useState<SobreMimData>(SOBRE_MIM_VAZIO);
  const [salvandoSobreMim, setSalvandoSobreMim] = useState(false);
  const [sobreMimSalvo, setSobreMimSalvo] = useState(false);
  const [weekViewsCount, setWeekViewsCount] = useState(0);
  const [lastViewAt, setLastViewAt] = useState<string | null>(null);
  const [lastViewCompany, setLastViewCompany] = useState<string | null>(null);
  const [weekViews, setWeekViews] = useState<ProfileViewItem[]>([]);
  const [companyNamesHidden, setCompanyNamesHidden] = useState(true);
  const [testeComportamental, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
  const [hasVideoApresentacao, setHasVideoApresentacao] = useState(false);
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
        setHasVideoApresentacao(Boolean(data.hasVideoApresentacao));

        const tipsRes = await fetch("/api/professional/tips", { credentials: "include" });
        if (tipsRes.ok) {
          const tipsData = await tipsRes.json();
          const normalizadas = await limparDicasSeExceder(tipsData.tips || []);
          setTips(aplicarLimiteLista(normalizadas));
        }

        const viewsRes = await fetch("/api/professional/profile-views", { credentials: "include" });
        if (viewsRes.ok) {
          const viewsData = await viewsRes.json();
          const semana = (viewsData.weekViews || []) as ProfileViewItem[];
          setWeekViews(semana);
          setWeekViewsCount(viewsData.weekViewsCount ?? semana.length);
          setLastViewAt(viewsData.lastViewAt || null);
          setLastViewCompany(viewsData.lastViewCompany || null);
          setCompanyNamesHidden(Boolean(viewsData.companyNamesHidden));
        }

        const sobreRes = await fetch("/api/professional/sobre-mim", { credentials: "include" });
        if (sobreRes.ok) {
          const sobreData = await sobreRes.json();
          if (sobreData.sobreMim) setSobreMim(sobreData.sobreMim);
        }

        const testeRes = await fetch("/api/professional/teste-comportamental", { credentials: "include" });
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

        try {
          const msgsRes = await fetch("/api/professional/messages", { credentials: "include" });
          if (msgsRes.ok) {
            const msgsData = await msgsRes.json();
            const filtradas = (msgsData.messages || []) as InboxMessage[];
            const limitadas = aplicarLimiteLista(filtradas);
            setInboxMessages(limitadas);
          }
        } catch {
          /* ignore */
        }
      } catch {
        setError("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    };
    void fetchProfile();
  }, [router]);

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
    window.location.href = "/api/auth/logout";
  };

  if (loading) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          Carregando perfil...
        </div>
      </DashboardThemeShell>
    );
  }

  if (error) {
    return (
      <DashboardThemeShell>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc3545", fontSize: 20 }}>
          {error}
        </div>
      </DashboardThemeShell>
    );
  }

  if (!profileData) {
    return (
      <DashboardThemeShell>
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
      const next = aplicarLimiteLista(inboxMessages.filter((msg) => msg.id !== messageId));
      setInboxMessages(next);
      if (mensagemAbertaId === messageId) setMensagemAbertaId(null);
    } catch {
      alert("Não foi possível excluir a mensagem.");
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
      setTips((prev) => aplicarLimiteLista(prev.filter((tip) => tip.id !== tipId)));
    } catch {
      alert("Não foi possível excluir a dica.");
    }
  };

  const handleSalvarSobreMim = async () => {
    setSalvandoSobreMim(true);
    setSobreMimSalvo(false);
    try {
      const res = await fetch("/api/professional/sobre-mim", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sobreMim),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Falha ao salvar");
      }
      if (data.sobreMim) setSobreMim(data.sobreMim);
      setSobreMimSalvo(true);
      setTimeout(() => setSobreMimSalvo(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.";
      alert(msg);
    } finally {
      setSalvandoSobreMim(false);
    }
  };

  const atualizarSobreMim = (campo: keyof SobreMimData, val: string) => {
    const limite = SOBRE_MIM_LIMITES[campo];
    setSobreMim((prev) => ({ ...prev, [campo]: val.slice(0, limite) }));
    setSobreMimSalvo(false);
  };

  const dicasExibidas = aplicarLimiteLista(tips);
  const mensagensExibidas = aplicarLimiteLista(inboxMessages);

  return (
    <DashboardThemeShell style={{ width: "100%", maxWidth: "none" }}>
      <header style={{ ...dashHeader, padding: "14px 12px" }}>
        <LogoRecruta size="xs" as="span" depth />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <DashboardThemeToggle />
          <button type="button" onClick={handleLogout} style={{ ...btnGold, padding: "8px 16px", fontSize: 13 }}>
            Sair
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          width: "100%",
          minHeight: "calc(100vh - 56px)",
          alignItems: "stretch",
        }}
      >
        {/* Esquerda — perfil resumido + sobre mim */}
        <main
          style={{
            padding: "12px 10px 12px 12px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 56px)",
            borderRight: `1px solid ${DASH.border}`,
            minWidth: 0,
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFotoChange} style={{ display: "none" }} />

          <section style={{ ...dashCard, padding: 14, marginBottom: 12, boxShadow: DASH.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <h3 style={{ ...dashSectionTitle, margin: 0, fontSize: 14 }}>Perfil resumido</h3>
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
                      border: `2px solid ${DASH.gold}`,
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
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: DASH.text }}>
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
          </section>

          <VideoApresentacaoSection
            initialHasVideo={hasVideoApresentacao}
            onVideoChange={setHasVideoApresentacao}
          />

          <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>Sobre mim</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <CampoSobreMim label="Hobbies" value={sobreMim.hobbys} onChange={(v) => atualizarSobreMim("hobbys", v)} placeholder="Ex.: corrida, culinária..." maxLength={SOBRE_MIM_LIMITES.hobbys} />
              <CampoSobreMim label="Estilo musical" value={sobreMim.estiloMusical} onChange={(v) => atualizarSobreMim("estiloMusical", v)} placeholder="Ex.: rock, MPB..." maxLength={SOBRE_MIM_LIMITES.estiloMusical} />
              <CampoSobreMim label="Livros" value={sobreMim.livros} onChange={(v) => atualizarSobreMim("livros", v)} placeholder="Autores ou gêneros..." maxLength={SOBRE_MIM_LIMITES.livros} />
              <CampoSobreMim label="Filmes e séries" value={sobreMim.filmesSeries} onChange={(v) => atualizarSobreMim("filmesSeries", v)} placeholder="Filmes ou séries..." maxLength={SOBRE_MIM_LIMITES.filmesSeries} />
              <CampoSobreMim label="Uma frase que te define" value={sobreMim.fraseQueDefine} onChange={(v) => atualizarSobreMim("fraseQueDefine", v)} placeholder="Uma frase sobre você..." maxLength={SOBRE_MIM_LIMITES.fraseQueDefine} />
              <CampoSobreMim label="Assuntos que me interessam" value={sobreMim.assuntosInteresse} onChange={(v) => atualizarSobreMim("assuntosInteresse", v)} placeholder="Ex.: tecnologia, sustentabilidade..." maxLength={SOBRE_MIM_LIMITES.assuntosInteresse} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
              {sobreMimSalvo && <span style={{ fontSize: 10, color: DASH.muted }}>Salvo</span>}
              <button
                type="button"
                onClick={() => void handleSalvarSobreMim()}
                disabled={salvandoSobreMim}
                style={{
                  ...btnGold,
                  padding: "6px 12px",
                  fontSize: 11,
                  opacity: salvandoSobreMim ? 0.7 : 1,
                  cursor: salvandoSobreMim ? "wait" : "pointer",
                }}
              >
                {salvandoSobreMim ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>

          <section style={{ ...dashCard, padding: 14, marginTop: 12, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 14 }}>Teste comportamental</h3>
            {testeComportamental ? (
              (() => {
                const info = PERFIL_INFO[testeComportamental.perfilPrincipal];
                const somaPrincipal = testeComportamental.pontuacoes[testeComportamental.perfilPrincipal];
                return (
                  <div>
                    <p style={{ margin: "0 0 8px", fontSize: 10, color: DASH.muted }}>
                      Concluído em {formatarDataHoraCurta(testeComportamental.completedAt)}
                    </p>
                    <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: DASH.gold, lineHeight: 1.35 }}>
                      {info.emoji} Perfil predominante: {info.titulo}
                    </p>
                    <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: DASH.text }}>
                      <span style={{ color: DASH.gold }}>{somaPrincipal}</span> pontos
                    </p>
                    <p style={{ margin: "0 0 12px", fontSize: 10, color: DASH.muted, lineHeight: 1.45 }}>
                      {QUESTOES_POR_PERFIL} perguntas deste perfil · notas de 1 a 5 · máx. {PONTUACAO_MAXIMA_PERFIL} pts
                    </p>

                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: DASH.title, textTransform: "uppercase" }}>
                        Para o candidato
                      </p>
                      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: DASH.text }}>{info.paraCandidato}</p>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: DASH.title, textTransform: "uppercase" }}>
                        Visão do recrutador
                      </p>
                      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.5, color: DASH.text }}>{info.visaoRecrutador}</p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
                  Descubra seu perfil comportamental com 20 afirmações. Preencha uma única vez para ver seu resultado aqui no painel.
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
          </section>
        </main>

        {/* Direita — visualizações, dicas e mensagens */}
        <aside style={{ padding: "12px 12px 12px 10px", overflowY: "auto", maxHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow, textAlign: "center" }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 14 }}>Visualizações da semana</h3>
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

          <section style={{ ...dashCard, padding: 14, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 12px", fontSize: 14 }}>
              Dicas recebidas ({dicasExibidas.length}/{LIMITE_LISTA})
            </h3>
            {dicasExibidas.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dicasExibidas.map((tip) => (
                  <div key={tip.id} style={{ padding: 10, ...dashInnerBox }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: DASH.text, flex: 1 }}>{tip.message}</p>
                      <button type="button" onClick={() => void handleExcluirDica(tip.id)} style={btnExcluirStyle} title="Excluir dica">
                        Excluir
                      </button>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: DASH.muted }}>
                      {tip.isAnonymous ? "Dica anônima" : "Empresa"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Nenhuma dica recebida ainda.</p>
            )}
          </section>

          <section style={{ ...dashCard, padding: 12, boxShadow: DASH.shadow }}>
            <h3 style={{ ...dashSectionTitle, margin: "0 0 10px", fontSize: 14 }}>
              Mensagens ({mensagensExibidas.length}/{LIMITE_LISTA})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 280, overflowY: "auto" }}>
              {mensagensExibidas.length === 0 ? (
                <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                  Quando uma empresa enviar mensagem, ela aparecerá aqui.
                </p>
              ) : (
                mensagensExibidas.map((msg) => {
                  const aberta = mensagemAbertaId === msg.id;
                  const preview = msg.body.length > 42 ? `${msg.body.slice(0, 42)}...` : msg.body;
                  return (
                    <div key={msg.id} style={{ ...dashInnerBox, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "stretch" }}>
                        <button
                          type="button"
                          onClick={() => toggleMensagemAberta(msg.id)}
                          aria-expanded={aberta}
                          style={{
                            flex: 1,
                            padding: "8px 10px",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            color: DASH.text,
                          }}
                        >
                          <span style={{ minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: DASH.title }}>{msg.from}</span>
                            <span style={{ display: "block", fontSize: 10, color: DASH.muted, marginTop: 2 }}>
                              {aberta ? formatarDataHora(msg.createdAt) : preview}
                            </span>
                          </span>
                          <span aria-hidden style={{ fontSize: 9, color: DASH.muted }}>{aberta ? "▲" : "▼"}</span>
                        </button>
                        <button type="button" onClick={() => handleExcluirMensagem(msg.id)} style={{ ...btnExcluirStyle, alignSelf: "center", marginRight: 8 }} title="Excluir mensagem">
                          Excluir
                        </button>
                      </div>
                      {aberta && (
                        <div style={{ padding: "0 10px 10px", borderTop: `1px solid ${DASH.border}` }}>
                          <p style={{ margin: "8px 0 0", fontSize: 12, lineHeight: 1.5, color: DASH.text }}>{msg.body}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </aside>
      </div>
    </DashboardThemeShell>
  );
}

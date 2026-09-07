"use client";

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import {
  CURSO_STATUS_META,
  getCursoStatus,
  parseCursosDetalhados,
  parseCertificacoesDetalhadas,
  type CursoDetalhado,
  type CertificacaoDetalhada,
} from "@/lib/professional-form-config";
import { isArquivoAnexado, nomeArquivoAnexado } from "@/lib/arquivo-anexo";
import { avatarImageStyle } from "@/lib/theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { SobreMimData } from "@/lib/sobre-mim";
import { PERFIL_INFO, type ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import SecureVideoPlayer from "@/components/shared/SecureVideoPlayer";
import { GOLD_GRADIENT_STOPS } from "@/lib/decorative-gold-line";
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
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import CarreiraTimeline from "@/components/professional/CarreiraTimeline";
import BandeiraFavoritoIcon from "@/components/company/BandeiraFavoritoIcon";
import PropostasEntrevistasEmpresa from "@/components/company/PropostasEntrevistasEmpresa";
import OnlineStatusDot from "@/components/shared/OnlineStatusDot";
import PlatformVideoCall from "@/components/shared/PlatformVideoCall";
import { buildCareerTimeline } from "@/lib/professional/career-timeline";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import { formatReaisDisplay, turnoPropostaLabel } from "@/lib/format-reais";
import { AVISO_RETENCAO_INBOX } from "@/lib/profile/inbox-retention";

const goldTitle: React.CSSProperties = {
  ...dashSectionTitle,
  color: DASH.gold,
};

type Tracking = {
  contatado: boolean;
  entrevistado: boolean;
  emTeste: boolean;
  contratado: boolean;
  naoContratado: boolean;
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
  favorito?: boolean;
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

const fieldBox: React.CSSProperties = {
  padding: "10px 12px",
  ...dashInnerBox,
  border: `1px solid ${DASH.gold}`,
  borderRadius: 8,
  minHeight: 40,
  background: DASH.inner,
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

/**
 * Fluxo livre: cada campo ocupa só o tamanho do texto.
 * Sem colunas fixas — o que couber fica na mesma linha
 * (ex.: Idade + Sexo + Identidade; Área + Cargo; Contato completo).
 */
function PerfilTextoCorrido({
  pares,
}: {
  pares: Array<{ label: string; value?: unknown }>;
}) {
  const partes = pares
    .map(({ label, value }) => {
      if (value === undefined || value === null || value === "") return null;
      const texto = Array.isArray(value)
        ? value.map(String).filter(Boolean).join(" · ")
        : String(value).trim();
      if (!texto || texto === "—") return null;
      return { label, texto };
    })
    .filter(Boolean) as Array<{ label: string; texto: string }>;

  if (partes.length === 0) {
    return <p style={{ ...valueStyle, color: DASH.muted }}>Sem dados para exibir.</p>;
  }

  /** Só textos bem longos (mensagem etc.) usam a linha inteira */
  const linhaInteira = (label: string, texto: string) => {
    if (/mensagem|apresenta|sobre mim|faixa etária|equipamentos|qualidade|informática|segmentos|cursos|certifica/i.test(label)) {
      return texto.length > 28;
    }
    return texto.length > 90;
  };

  const labelEl = (label: string) => (
    <span
      style={{
        color: DASH.gold,
        textDecoration: "underline",
        textUnderlineOffset: 3,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: 14,
        rowGap: 8,
        alignItems: "baseline",
        width: "100%",
      }}
    >
      {partes.map((item) => {
        const full = linhaInteira(item.label, item.texto);
        return (
          <p
            key={`${item.label}-${item.texto}`}
            style={{
              margin: 0,
              color: DASH.text,
              fontSize: 14,
              lineHeight: 1.4,
              flex: full ? "1 1 100%" : "0 0 auto",
              whiteSpace: full ? "normal" : "nowrap",
              wordBreak: full ? "break-word" : undefined,
              maxWidth: full ? "100%" : undefined,
            }}
          >
            {labelEl(item.label)}
            {": "}
            {item.texto}
          </p>
        );
      })}
    </div>
  );
}

function CardSecaoPerfil({
  emoji,
  titulo,
  pares,
}: {
  emoji: string;
  titulo: string;
  pares: Array<{ label: string; value?: unknown }>;
}) {
  const temDados = pares.some(({ value }) => {
    if (value === undefined || value === null || value === "" || value === "—") return false;
    if (Array.isArray(value)) return value.some((v) => String(v || "").trim());
    return String(value).trim().length > 0;
  });
  if (!temDados) return null;

  return (
    <section
      data-perfil-card="1"
      style={{ ...dashCard, padding: 18 }}
    >
      <h4
        style={{
          ...goldTitle,
          margin: "0 0 14px",
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span aria-hidden>{emoji}</span>
        {titulo}
      </h4>
      <PerfilTextoCorrido pares={pares} />
    </section>
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
  // Texto simples — sem tags/pills
  return (
    <p style={{ ...valueStyle, margin: 0 }}>
      {items.join(" · ")}
    </p>
  );
}

function formatarDataCurta(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { year: "numeric", month: "2-digit" });
}

function CursoDetalheItem({ curso }: { curso: CursoDetalhado }) {
  const status = getCursoStatus(curso);
  const badge = CURSO_STATUS_META[status];
  const linhaSecundaria = [
    curso.instituicao,
    curso.cargaHoraria,
    formatarDataCurta(curso.dataConclusao),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${badge.border}`,
        background: badge.bg,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: DASH.text }}>{curso.nome}</p>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: badge.color,
            padding: "3px 8px",
            borderRadius: 999,
            border: `1px solid ${badge.border}`,
            background: "rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {badge.label}
        </span>
      </div>
      {linhaSecundaria && (
        <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>{linhaSecundaria}</p>
      )}
      {curso.certificadoUrl && (
        <a
          href={curso.certificadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: DASH.gold, textDecoration: "underline", marginTop: 2 }}
        >
          Ver anexo
        </a>
      )}
    </div>
  );
}

function CertificacaoDetalheItem({ cert }: { cert: CertificacaoDetalhada }) {
  const status = getCursoStatus({
    nome: cert.nome,
    validadeCertificado: cert.validade,
    possuiCertificado: cert.possuiCertificado,
    certificadoUrl: cert.certificadoUrl,
    verificado: cert.verificado,
  });
  const badge = CURSO_STATUS_META[status];
  const linhaSecundaria = [cert.emissor, formatarDataCurta(cert.validade)].filter(Boolean).join(" · ");

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${badge.border}`,
        background: badge.bg,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: DASH.text }}>{cert.nome}</p>
        {cert.certificadoUrl && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: badge.color,
              padding: "3px 8px",
              borderRadius: 999,
              border: `1px solid ${badge.border}`,
              background: "rgba(0,0,0,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            {badge.label}
          </span>
        )}
      </div>
      {linhaSecundaria && (
        <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>{linhaSecundaria}</p>
      )}
      {cert.certificadoUrl && (
        <a
          href={cert.certificadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: DASH.gold, textDecoration: "underline", marginTop: 2 }}
        >
          Ver anexo
        </a>
      )}
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
    <div
      style={{
        ...fieldBox,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <p style={{ ...labelStyle, margin: 0 }}>{label}</p>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {[
          { label: "Sim", active: value },
          { label: "Não", active: !value },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.label === "Sim")}
            style={{
              padding: "4px 12px",
              fontSize: 11,
              borderRadius: 7,
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
    emTeste: false,
    contratado: false,
    naoContratado: false,
    notes: "",
  });
  const [tips, setTips] = useState<Tip[]>([]);
  const [canUnlock, setCanUnlock] = useState(false);
  const [companyVerified, setCompanyVerified] = useState(true);
  const [canSendTips, setCanSendTips] = useState(false);
  const [canFavorite, setCanFavorite] = useState(false);
  const [canSendProposals, setCanSendProposals] = useState(false);
  const [canUseTalentBank, setCanUseTalentBank] = useState(false);
  const [talentLists, setTalentLists] = useState<Array<{ id: string; name: string }>>([]);
  const [talentListIdsSelecionados, setTalentListIdsSelecionados] = useState<string[]>([]);
  const [salvandoTalent, setSalvandoTalent] = useState(false);
  const [proposals, setProposals] = useState<JobProposalDTO[]>([]);
  const [favoriting, setFavoriting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMembers, setShareMembers] = useState<
    Array<{ id: string; name: string; email: string; department: string }>
  >([]);
  const [shareSelected, setShareSelected] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState("");
  const [loadingShareMembers, setLoadingShareMembers] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedbacks, setFeedbacks] = useState<
    Array<{ id: string; authorName: string; body: string; createdAt: string }>
  >([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [tipText, setTipText] = useState("");
  const [sendingTip, setSendingTip] = useState(false);
  const [mensagemTexto, setMensagemTexto] = useState("");
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [conversa, setConversa] = useState<
    Array<{
      id: string;
      from: string;
      body: string;
      createdAt: string;
      senderRole: "COMPANY" | "PROFESSIONAL";
    }>
  >([]);
  const [sobreMim, setSobreMim] = useState<SobreMimData | null>(null);
  const [sobreMimPreenchido, setSobreMimPreenchido] = useState(false);
  const [testeComportamental, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoAnexo[]>([]);
  const [videoApresentacaoUrl, setVideoApresentacaoUrl] = useState<string | null>(null);
  const [profissionalOnline, setProfissionalOnline] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const lineGradId = useId();
  const [goldLine, setGoldLine] = useState<{
    width: number;
    height: number;
    d: string;
  } | null>(null);

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
      setTracking({
        contatado: Boolean(data.tracking?.contatado),
        entrevistado: Boolean(data.tracking?.entrevistado),
        emTeste: Boolean(data.tracking?.emTeste),
        contratado: Boolean(data.tracking?.contratado),
        naoContratado: Boolean(data.tracking?.naoContratado),
        notes: String(data.tracking?.notes || ""),
      });
      setTips(data.tips || []);
      setCanUnlock(Boolean(data.canUnlock));
      setCompanyVerified(data.verification?.canAccessSensitiveProfiles === true);
      setCanSendTips(Boolean(data.features?.canSendTips));
      setCanFavorite(Boolean(data.features?.canFavorite));
      setCanSendProposals(Boolean(data.features?.canSendProposals));
      setCanUseTalentBank(Boolean(data.features?.canUseTalentBank));

      if (data.features?.canUseTalentBank) {
        try {
          const tlRes = await fetch(
            `/api/company/talent-lists?profileId=${encodeURIComponent(profileId)}`,
            { credentials: "include" },
          );
          if (tlRes.ok) {
            const tlData = await tlRes.json();
            setTalentLists(
              Array.isArray(tlData.lists)
                ? tlData.lists.map((l: { id: string; name: string }) => ({ id: l.id, name: l.name }))
                : [],
            );
            setTalentListIdsSelecionados(
              Array.isArray(tlData.membershipListIds) ? tlData.membershipListIds.map(String) : [],
            );
          } else {
            setTalentLists([]);
            setTalentListIdsSelecionados([]);
          }
        } catch {
          setTalentLists([]);
          setTalentListIdsSelecionados([]);
        }
      } else {
        setTalentLists([]);
        setTalentListIdsSelecionados([]);
      }

      if (data.resumo && !data.resumo.bloqueado) {
        try {
          const propRes = await fetch(
            `/api/company/proposals?profileId=${encodeURIComponent(profileId)}`,
            { credentials: "include" },
          );
          if (propRes.ok) {
            const propData = await propRes.json();
            setProposals(propData.proposals || []);
          } else {
            setProposals([]);
          }
        } catch {
          setProposals([]);
        }
      } else {
        setProposals([]);
      }

      if (data.resumo && !data.resumo.bloqueado) {
        try {
          const msgRes = await fetch(
            `/api/company/messages?profileId=${encodeURIComponent(profileId)}`,
            { credentials: "include" },
          );
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setConversa(msgData.messages || []);
          } else {
            setConversa([]);
          }
        } catch {
          setConversa([]);
        }
      } else {
        setConversa([]);
      }
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

  const recarregarPropostas = useCallback(async () => {
    try {
      const propRes = await fetch(
        `/api/company/proposals?profileId=${encodeURIComponent(profileId)}`,
        { credentials: "include" },
      );
      if (propRes.ok) {
        const propData = await propRes.json();
        setProposals(propData.proposals || []);
      }
    } catch {
      /* mantém lista atual */
    }
  }, [profileId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/presence?profileId=${encodeURIComponent(profileId)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProfissionalOnline(Boolean(data.online));
      } catch {
        /* ignore */
      }
    };
    void poll();
    const id = window.setInterval(poll, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [profileId]);

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

  const handleFavorite = async () => {
    if (!resumo || favoriting) return;
    const atual = !!resumo.favorito;
    const proximo = !atual;
    setFavoriting(true);
    setResumo((r) => (r ? { ...r, favorito: proximo } : r));
    try {
      if (atual) {
        const res = await fetch(`/api/company/favorites?profileId=${encodeURIComponent(profileId)}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setResumo((r) => (r ? { ...r, favorito: atual } : r));
          alert(data.error || "Erro ao remover favorito");
        }
      } else {
        const res = await fetch("/api/company/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ profileId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setResumo((r) => (r ? { ...r, favorito: atual } : r));
          alert(data.error || "Erro ao favoritar");
        }
      }
    } catch {
      setResumo((r) => (r ? { ...r, favorito: atual } : r));
      alert("Erro ao atualizar favorito");
    } finally {
      setFavoriting(false);
    }
  };

  const carregarFeedbacks = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/company/profile-feedback?profileId=${encodeURIComponent(profileId)}`,
        { credentials: "include" },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.feedbacks)) {
        setFeedbacks(data.feedbacks);
      }
    } catch {
      /* ignore */
    }
  }, [profileId]);

  useEffect(() => {
    void carregarFeedbacks();
  }, [carregarFeedbacks]);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;
    setSendingFeedback(true);
    setFeedbackMsg("");
    try {
      const res = await fetch("/api/company/profile-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profileId, body: feedbackText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedbackMsg(data.error || "Não foi possível enviar o feedback.");
        return;
      }
      if (Array.isArray(data.feedbacks)) setFeedbacks(data.feedbacks);
      setFeedbackText("");
    } catch {
      setFeedbackMsg("Erro de rede ao enviar o feedback.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const loadShareMembers = async () => {
    setShowShare((current) => !current);
    setShareMsg("");
    if (shareMembers.length > 0) return;
    setLoadingShareMembers(true);
    try {
      const res = await fetch("/api/company/rh-members", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShareMembers(Array.isArray(data.members) ? data.members : []);
      }
    } finally {
      setLoadingShareMembers(false);
    }
  };

  const toggleShareMember = (memberId: string) => {
    setShareSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  };

  const handleShareProfile = async () => {
    if (shareSelected.length === 0) {
      setShareMsg("Selecione pelo menos uma pessoa da equipe.");
      return;
    }
    setSharing(true);
    setShareMsg("");
    try {
      const res = await fetch("/api/company/profile-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileId,
          toUserIds: shareSelected,
          note: shareNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setShareMsg(data.error || "Não foi possível compartilhar.");
        return;
      }
      setShareMsg(data.message || "Perfil compartilhado.");
      setShareSelected([]);
      setShareNote("");
    } catch {
      setShareMsg("Erro de rede ao compartilhar.");
    } finally {
      setSharing(false);
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

  const handleExcluirDica = async (tipId: string) => {
    if (!window.confirm("Excluir esta dica? Itens com mais de 1 mês também são apagados automaticamente.")) {
      return;
    }
    try {
      const res = await fetch(`/api/company/tips?id=${encodeURIComponent(tipId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível excluir a dica.");
        return;
      }
      setTips((prev) => prev.filter((t) => t.id !== tipId));
    } catch {
      alert("Não foi possível excluir a dica.");
    }
  };

  const handleExcluirMensagem = async (messageId: string) => {
    if (!window.confirm("Excluir esta mensagem? Itens com mais de 1 mês também são apagados automaticamente.")) {
      return;
    }
    try {
      const res = await fetch(
        `/api/company/messages?id=${encodeURIComponent(messageId)}&profileId=${encodeURIComponent(profileId)}`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Não foi possível excluir a mensagem.");
        return;
      }
      setConversa((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      alert("Não foi possível excluir a mensagem.");
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
      await carregar();
      alert("Mensagem enviada! O candidato verá no painel dele e poderá responder.");
    } catch {
      alert("Erro ao enviar mensagem");
    } finally {
      setEnviandoMensagem(false);
    }
  };

  useLayoutEffect(() => {
    const updateLine = () => {
      const root = headerRef.current;
      const info = infoRef.current;
      if (!root || !info) {
        setGoldLine(null);
        return;
      }

      const rootBox = root.getBoundingClientRect();
      const infoBox = info.getBoundingClientRect();
      const video = videoRef.current;
      const videoBox = video?.getBoundingClientRect();

      const startX = Math.max(8, infoBox.left - rootBox.left);
      const lineY = infoBox.bottom - rootBox.top + 6;
      const tipRise = 10;

      let d: string;
      let height: number;

      if (videoBox) {
        const videoLeft = videoBox.left - rootBox.left;
        // Reta sob o texto, colada no vídeo — sem curva no fim
        const horizEnd = Math.max(startX + 40, videoLeft);
        d = [
          `M ${startX - 6} ${lineY - tipRise}`,
          `Q ${startX - 6} ${lineY} ${startX + 10} ${lineY}`,
          `L ${horizEnd} ${lineY}`,
        ].join(" ");
        height = Math.ceil(lineY + tipRise + 8);
      } else {
        const endX = infoBox.right - rootBox.left;
        d = [
          `M ${startX - 6} ${lineY - tipRise}`,
          `Q ${startX - 6} ${lineY} ${startX + 10} ${lineY}`,
          `L ${endX} ${lineY}`,
        ].join(" ");
        height = Math.ceil(lineY + tipRise + 8);
      }

      setGoldLine({
        width: Math.ceil(rootBox.width),
        height: Math.max(height, Math.ceil(rootBox.height) + 20),
        d,
      });
    };

    updateLine();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateLine) : null;
    if (headerRef.current) ro?.observe(headerRef.current);
    if (infoRef.current) ro?.observe(infoRef.current);
    if (videoRef.current) ro?.observe(videoRef.current);
    window.addEventListener("resize", updateLine);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateLine);
    };
  }, [resumo, videoApresentacaoUrl, loading]);

  if (loading) {
    return (
      <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
        <AmpulhetaLoading label="Carregando perfil..." size={36} color={DASH.gold} />
      </div>
    );
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
  const cursosDetalhados: CursoDetalhado[] =
    formEdit?.cursosDetalhados && formEdit.cursosDetalhados.length > 0
      ? formEdit.cursosDetalhados
      : parseCursosDetalhados(fd.cursosDetalhados ?? formEdit?.cursos ?? fd.cursosCertificacoes);
  const cursos = cursosDetalhados.length > 0
    ? cursosDetalhados.map((c) => c.nome)
    : (formEdit?.cursos?.filter(Boolean) ?? listaDeStrings(fd.cursosCertificacoes));
  const certificacoesDetalhadas = parseCertificacoesDetalhadas(fd.certificacoesDetalhadas ?? fd.certificacoes);
  const empresas = formEdit?.empresas?.filter((e) => e.nome?.trim() || e.cargo?.trim()) ?? [];
  const carreiraTimeline = buildCareerTimeline(empresas);

  return (
    <div>
      <div
        ref={headerRef}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(280px, 0.9fr)",
          gap: 20,
          alignItems: "start",
          marginBottom: 6,
          paddingBottom: 12,
        }}
      >
        {goldLine && (
          <svg
            aria-hidden
            width={goldLine.width}
            height={goldLine.height}
            viewBox={`0 0 ${goldLine.width} ${goldLine.height}`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 0,
            }}
          >
            <defs>
              <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                {GOLD_GRADIENT_STOPS.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
            <path
              d={goldLine.d}
              fill="none"
              stroke={`url(#${lineGradId})`}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            zIndex: 1,
            minWidth: 0,
          }}
        >
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          {resumo.avatar ? (
            <img
              src={resumo.avatar}
              alt=""
              style={{
                ...avatarImageStyle(88),
                flexShrink: 0,
                filter: resumo.bloqueado ? "blur(4px)" : "none",
              }}
            />
          ) : (
            <div
              style={{
                width: 88,
                height: 88,
                flexShrink: 0,
                borderRadius: "50%",
                background: DASH.inner,
                border: `1px solid ${DASH.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
              }}
            >
              👤
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div ref={infoRef}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
                <h2 style={{ color: DASH.gold, margin: "0 0 6px", fontSize: 24, fontWeight: 700, flex: 1, minWidth: 0 }}>
                  {resumo.nome}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <OnlineStatusDot online={profissionalOnline} size={14} />
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        color: profissionalOnline ? "#22c55e" : DASH.muted,
                        lineHeight: 1,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {profissionalOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  {canFavorite && (
                    <button
                      type="button"
                      onClick={() => void handleFavorite()}
                      disabled={favoriting}
                      title={resumo.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                      aria-label={resumo.favorito ? "Remover dos favoritos" : "Marcar como favorito"}
                      aria-pressed={!!resumo.favorito}
                      style={{
                        background: "none",
                        border: "none",
                        outline: "none",
                        padding: 4,
                        margin: 0,
                        cursor: favoriting ? "wait" : "pointer",
                        lineHeight: 0,
                        color: resumo.favorito ? "#e53935" : DASH.muted,
                        flexShrink: 0,
                        opacity: favoriting ? 0.7 : 1,
                      }}
                    >
                      <BandeiraFavoritoIcon ativo={!!resumo.favorito} size={28} />
                    </button>
                  )}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 15, color: DASH.text }}>
                {resumo.cargo || "—"} · {resumo.area || "—"}
              </p>
              {resumo.local && (
                <p style={{ margin: "4px 0 0", fontSize: 13, color: DASH.muted }}>{resumo.local}</p>
              )}
              <p style={{ margin: "6px 0 0", fontSize: 13, color: DASH.muted }}>
                {typeof resumo.compatibilidade === "number" && (
                  <span style={dashPlanAccent}>Compatibilidade: {resumo.compatibilidade}% · </span>
                )}
                Completude: {resumo.profileCompletion ?? 0}%
              </p>
            </div>
            {resumo.bloqueado && (
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 13, color: DASH.muted, margin: "0 0 10px" }}>
                  {!companyVerified
                    ? "Para ver dados sensíveis, confirme o e-mail corporativo e aguarde a aprovação do cartão CNPJ — mesmo com plano pago."
                    : "Perfil bloqueado — libere o contato para ver o cadastro completo."}
                </p>
                {canUnlock && companyVerified && (
                  <button
                    type="button"
                    onClick={handleUnlock}
                    disabled={unlocking}
                    style={{
                      ...btnGold,
                      padding: "10px 18px",
                      fontSize: 13,
                      opacity: unlocking ? 0.7 : 1,
                    }}
                  >
                    {unlocking ? "Desbloqueando..." : "🔓 Liberar contato"}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {!resumo.bloqueado && formEdit ? (
          <CardSecaoPerfil
            emoji="📞"
            titulo="Contato"
            pares={[
              { label: "E-mail", value: valor("email") !== "—" ? valor("email") : undefined },
              { label: "Telefone", value: formEdit.telefone || fd.telefone },
              { label: "Telefone 2", value: formEdit.telefone2 || fd.telefone2 },
              { label: "WhatsApp", value: fd.whatsapp },
            ]}
          />
        ) : null}

          {!resumo.bloqueado && formEdit ? (
            <>
              <CardSecaoPerfil
                emoji="🏭"
                titulo="Dados pessoais"
                pares={[
                  { label: "Nome", value: valor("nome") !== "—" ? valor("nome") : resumo.nome },
                  { label: "CPF", value: formEdit.cpf || fd.cpf },
                  { label: "Nascimento", value: formEdit.dataNascimentoDisplay || fd.dataNascimento },
                  { label: "Idade", value: fd.idade },
                  { label: "Sexo biológico", value: fd.sexoBiologico },
                  { label: "Identidade de gênero", value: fd.identidadeGenero },
                  { label: "Orientação sexual", value: fd.orientacaoSexual },
                  { label: "Estado civil", value: fd.estadoCivil },
                  { label: "Religião", value: fd.religiao },
                  { label: "Antecedentes", value: fd.antecedentes },
                  { label: "CNH", value: fd.possuiCNH },
                  { label: "Categoria CNH", value: fd.categoriaCNH },
                ]}
              />

              <CardSecaoPerfil
                emoji="👨‍👩‍👧‍👦"
                titulo="Filhos"
                pares={[
                  { label: "Possui filhos", value: fd.possuiFilhos },
                  { label: "Quantidade de filhos", value: fd.quantidadeFilhos },
                  { label: "Faixa etária dos filhos", value: listaDeStrings(fd.faixaEtariaFilhos) },
                ]}
              />

              <CardSecaoPerfil
                emoji="📍"
                titulo="Localização"
                pares={[
                  { label: "Estado", value: fd.estado },
                  { label: "Cidade", value: fd.cidade },
                  { label: "Mudança de cidade", value: fd.disponibilidadeMudanca },
                  { label: "Aceita viagens", value: fd.aceitaViagens },
                ]}
              />

              <CardSecaoPerfil
                emoji="🎓"
                titulo="Formação"
                pares={[
                  { label: "Escolaridade", value: fd.escolaridade },
                  { label: "Curso", value: fd.cursoFormacao },
                  { label: "Instituição", value: fd.instituicaoFormacao },
                  { label: "Ano de conclusão", value: fd.anoConclusaoFormacao },
                  {
                    label: "Cursos",
                    value: cursosDetalhados.length > 0
                      ? cursosDetalhados.map((c) => c.nome)
                      : cursos,
                  },
                  {
                    label: "Certificações",
                    value: certificacoesDetalhadas.length > 0
                      ? certificacoesDetalhadas.map((c) => c.nome)
                      : listaDeStrings(fd.certificacoes),
                  },
                  { label: "Idiomas", value: listaDeStrings(fd.idiomas) },
                ]}
              />

              <CardSecaoPerfil
                emoji="💼"
                titulo="Perfil profissional"
                pares={[
                  { label: "Situação profissional", value: fd.situacaoProfissional },
                  { label: "Área de interesse", value: fd.areaInteresse || resumo.area },
                  { label: "Cargo desejado", value: valor("cargoDesejado") !== "—" ? valor("cargoDesejado") : resumo.cargo },
                  { label: "Nível operacional", value: valor("nivelOperacional") !== "—" ? valor("nivelOperacional") : undefined },
                  { label: "Área do nível", value: valor("areaNivel") !== "—" ? valor("areaNivel") : undefined },
                  { label: "Detalhe do nível", value: valor("detalheNivel") !== "—" ? valor("detalheNivel") : undefined },
                  { label: "Turno", value: (() => {
                    const t = String(fd.turnoDisponivel || resumo.turno || "").trim();
                    return t ? turnoPropostaLabel(t) : undefined;
                  })() },
                  { label: "Pretensão salarial", value: (() => {
                    const v = String(formEdit.pretensaoSalarial || fd.pretensaoSalarial || "").trim();
                    return v ? formatReaisDisplay(v) : undefined;
                  })() },
                  { label: "Recolocação", value: fd.recolocacao },
                  { label: "Disponibilidade", value: fd.disponibilidadeInicio },
                ]}
              />

              {carreiraTimeline.length > 0 && (
                <div style={{ ...dashCard, padding: 18 }}>
                  <h4
                    style={{
                      ...goldTitle,
                      margin: "0 0 14px",
                      fontSize: 15,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span aria-hidden>📅</span>
                    Linha do tempo profissional
                  </h4>
                  <CarreiraTimeline experiencias={empresas} showDescricao />
                </div>
              )}

              <CardSecaoPerfil
                emoji="🏭"
                titulo="Experiência na indústria"
                pares={[
                  { label: "Trabalhou na indústria", value: fd.trabalhouIndustria },
                  { label: "Tempo de experiência", value: fd.tempoExperiencia || resumo.experiencia },
                  { label: "Segmentos", value: listaDeStrings(fd.segmentosIndustria) },
                ]}
              />

              <CardSecaoPerfil
                emoji="⚙️"
                titulo="Máquinas e equipamentos"
                pares={[
                  { label: "Equipamentos", value: listaDeStrings(fd.maquinasEquipamentos) },
                ]}
              />

              <CardSecaoPerfil
                emoji="📋"
                titulo="Qualidade e processos"
                pares={[
                  { label: "Qualidade", value: listaDeStrings(fd.qualidadeProcessos) },
                ]}
              />

              <CardSecaoPerfil
                emoji="💻"
                titulo="Informática"
                pares={[
                  { label: "Informática", value: listaDeStrings(fd.informatica) },
                ]}
              />

              <CardSecaoPerfil
                emoji="✍️"
                titulo="Apresentação profissional"
                pares={[
                  {
                    label: "Mensagem para empresas",
                    value: valor("mensagemEmpresas") !== "—" ? valor("mensagemEmpresas") : undefined,
                  },
                ]}
              />
            </>
          ) : (
            <>
              <CardSecaoPerfil
                emoji="🏭"
                titulo="Dados pessoais"
                pares={[
                  { label: "Nome", value: resumo.nome },
                  { label: "Local", value: resumo.local },
                  { label: "Escolaridade", value: resumo.escolaridade },
                ]}
              />
              <CardSecaoPerfil
                emoji="💼"
                titulo="Perfil profissional"
                pares={[
                  { label: "Cargo", value: resumo.cargo },
                  { label: "Área", value: resumo.area },
                  { label: "Turno", value: turnoPropostaLabel(String(resumo.turno || "")) },
                  { label: "Experiência", value: resumo.experiencia },
                ]}
              />
              <CardSecaoPerfil
                emoji="🏭"
                titulo="Experiência na indústria"
                pares={[
                  { label: "Segmentos", value: resumo.segmentosIndustria },
                  { label: "Equipamentos", value: resumo.maquinasEquipamentos },
                ]}
              />
            </>
          )}

          <section style={{ ...dashCard, padding: 18 }}>
            <h4
              style={{
                ...goldTitle,
                margin: "0 0 14px",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span aria-hidden>🧍</span>
              Sobre mim
            </h4>
            {resumo.bloqueado ? (
              <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                Libere o contato para ver as informações pessoais do candidato.
              </p>
            ) : sobreMimPreenchido && sobreMim ? (
              <PerfilTextoCorrido
                pares={CAMPOS_SOBRE_MIM.map(({ key, label }) => ({
                  label,
                  value: sobreMim[key] || undefined,
                }))}
              />
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                O candidato ainda não preencheu esta seção.
              </p>
            )}
          </section>

          <section style={{ ...dashCard, padding: 18 }}>
            <h4
              style={{
                ...goldTitle,
                margin: "0 0 14px",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span aria-hidden>🧠</span>
              Perfil pessoal
            </h4>
            {testeComportamental ? (
              (() => {
                const info = PERFIL_INFO[testeComportamental.perfilPrincipal];
                return (
                  <div>
                    <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: DASH.gold }}>
                      {info.emoji} Perfil predominante: {info.titulo}
                    </p>
                    <div>
                      <p style={{ ...labelStyle, marginBottom: 4 }}>Visão do recrutador</p>
                      <p style={{ ...valueStyle, fontSize: 13 }}>{info.visaoRecrutador}</p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                O candidato ainda não realizou o teste de perfil pessoal.
              </p>
            )}
          </section>

          <section style={{ ...dashCard, padding: 18 }}>
            <h4
              style={{
                ...goldTitle,
                margin: "0 0 14px",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span aria-hidden>📎</span>
              Currículo e anexos
            </h4>
            {resumo.bloqueado ? (
              <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                Libere o contato para acessar currículo, atestados e demais anexos.
              </p>
            ) : (
              (() => {
                const docEscolar =
                  formEdit && isArquivoAnexado(fd.documentoFormacao)
                    ? String(fd.documentoFormacao)
                    : "";
                const lista = [...documentos];
                if (docEscolar && !lista.some((d) => d.url === docEscolar)) {
                  lista.unshift({ label: "Documento escolar", url: docEscolar });
                }
                if (lista.length === 0) {
                  return (
                    <p style={{ margin: 0, fontSize: 13, color: DASH.muted }}>
                      Nenhum arquivo anexado pelo candidato.
                    </p>
                  );
                }
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {lista.map((doc) => (
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
                );
              })()
            )}
          </section>
        </div>

        {/* Vídeo de apresentação + chamada + compartilhar */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 16,
            }}
          >
            {!resumo.bloqueado && videoApresentacaoUrl ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  ref={videoRef}
                  style={{
                    width: 128,
                    height: 228,
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1px solid ${DASH.gold}`,
                    background: "#000",
                    boxShadow: `0 0 0 1px rgba(200,155,60,0.25)`,
                  }}
                >
                  <SecureVideoPlayer
                    src={videoApresentacaoUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      maxHeight: "none",
                      borderRadius: 0,
                      objectFit: "cover",
                    }}
                  />
                </div>
                <p
                  style={{
                    ...dashTag,
                    margin: 0,
                    display: "inline-block",
                    fontSize: 10,
                    textAlign: "center",
                  }}
                >
                  Vídeo de apresentação
                </p>
              </div>
            ) : !resumo.bloqueado ? (
              <div
                style={{
                  width: 128,
                  height: 228,
                  borderRadius: 12,
                  border: `1px dashed ${DASH.border}`,
                  background: DASH.inner,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 10,
                  textAlign: "center",
                }}
              >
                <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.4 }}>
                  Sem vídeo de apresentação
                </p>
              </div>
            ) : null}

            {!resumo.bloqueado && (
              <PlatformVideoCall
                role="company"
                profileId={profileId}
                title="Chamada de vídeo"
                compact
                peerLabel={resumo.nome.split(" ")[0] || "candidato"}
              />
            )}
          </div>

          {!resumo.bloqueado && (
            <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10 }}>
              <button
                type="button"
                onClick={() => void loadShareMembers()}
                title="Compartilhar com a equipe do mesmo plano"
                style={{
                  ...btnGold,
                  padding: "8px 12px",
                  fontSize: 12,
                  width: "100%",
                }}
              >
                Compartilhar
              </button>

              {showShare && (
                <div
                  style={{
                    ...dashInnerBox,
                    padding: 12,
                    border: `1px solid ${DASH.gold}`,
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: DASH.gold }}>
                    Compartilhar com a equipe (mesmo plano)
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: DASH.muted, lineHeight: 1.45 }}>
                    Só aparecem pessoas da mesma assinatura. Elas recebem o link no chat e em
                    compartilhados.
                  </p>
                  {loadingShareMembers ? (
                    <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Buscando equipe...</p>
                  ) : shareMembers.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
                      Nenhuma outra pessoa no mesmo plano. Cadastre usuários na aba Equipe.
                    </p>
                  ) : (
                    <div style={{ display: "grid", gap: 6 }}>
                      {shareMembers.map((member) => {
                        const selected = shareSelected.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleShareMember(member.id)}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 8,
                              alignItems: "center",
                              padding: "8px 10px",
                              border: `1px solid ${DASH.gold}`,
                              borderRadius: 10,
                              background: selected ? "rgba(200,155,60,0.18)" : DASH.inner,
                              color: DASH.text,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "left",
                            }}
                          >
                            <span>
                              <strong style={{ color: DASH.gold }}>{member.name}</strong>
                              <span style={{ display: "block", fontSize: 10, color: DASH.muted }}>
                                {member.department} · {member.email}
                              </span>
                            </span>
                            <span style={{ fontSize: 11, color: selected ? DASH.gold : DASH.muted }}>
                              {selected ? "Selecionado" : "Selecionar"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <label>
                    <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>
                      Nota (opcional)
                    </span>
                    <input
                      value={shareNote}
                      onChange={(e) => setShareNote(e.target.value)}
                      placeholder="Ex.: candidato forte para a vaga de solda"
                      maxLength={280}
                      style={dashInput}
                    />
                  </label>
                  {shareMsg ? (
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: shareMsg.includes("compartilhado") ? "#4ade80" : "#f87171",
                      }}
                    >
                      {shareMsg}
                    </p>
                  ) : null}
                  {shareMembers.length > 0 ? (
                    <button
                      type="button"
                      disabled={sharing || shareSelected.length === 0}
                      onClick={() => void handleShareProfile()}
                      style={{
                        ...btnGold,
                        padding: "8px 12px",
                        fontSize: 12,
                        width: "fit-content",
                        opacity: sharing || shareSelected.length === 0 ? 0.7 : 1,
                      }}
                    >
                      {sharing ? "Compartilhando..." : "Enviar para selecionados"}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )}

        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 0,
            alignItems: "stretch",
          }}
        >
          {!resumo.bloqueado && (
            <PropostasEntrevistasEmpresa
              profileId={profileId}
              canSend={canSendProposals}
              proposals={proposals}
              onChanged={() => void recarregarPropostas()}
            />
          )}

          <section style={{ ...dashCard, padding: 18 }}>
            <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>
              💬 Feedback da equipe
            </h3>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
              Todos da mesma assinatura veem os feedbacks deixados sobre este candidato.
            </p>

            <div
              style={{
                ...dashInnerBox,
                padding: 10,
                border: `1px solid ${DASH.gold}`,
                display: "grid",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Escreva seu feedback sobre o candidato..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 8,
                  borderRadius: 8,
                  ...dashInput,
                  fontSize: 12,
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
              {feedbackMsg ? (
                <p style={{ margin: 0, fontSize: 11, color: "#f87171" }}>{feedbackMsg}</p>
              ) : null}
              <button
                type="button"
                onClick={() => void handleSendFeedback()}
                disabled={sendingFeedback || !feedbackText.trim()}
                style={{
                  ...btnGold,
                  padding: "6px 12px",
                  fontSize: 12,
                  width: "fit-content",
                  justifySelf: "end",
                  opacity: sendingFeedback || !feedbackText.trim() ? 0.7 : 1,
                }}
              >
                {sendingFeedback ? "Enviando..." : "Enviar feedback"}
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
                Nenhum feedback ainda. Seja o primeiro a avaliar.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 8, maxHeight: 320, overflowY: "auto" }}>
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      ...dashInnerBox,
                      padding: "8px 10px",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <strong style={{ fontSize: 12, color: DASH.gold }}>{fb.authorName}</strong>
                      <span style={{ fontSize: 10, color: DASH.muted, flexShrink: 0 }}>
                        {new Date(fb.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: DASH.text, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                      {fb.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ ...dashCard, padding: 18 }}>
            <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>✉️ Mensagem para o candidato</h3>
            <p style={{ fontSize: 11, color: DASH.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
              {AVISO_RETENCAO_INBOX}
            </p>
            {resumo.bloqueado ? (
              <p style={{ fontSize: 13, color: DASH.muted, margin: 0 }}>
                Libere o contato para enviar mensagem direta ao profissional.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: DASH.muted, margin: "0 0 10px", lineHeight: 1.45 }}>
                  A mensagem aparece na caixa de entrada do candidato. Ele pode ler e responder por lá.
                </p>

                {conversa.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      maxHeight: 240,
                      overflowY: "auto",
                      marginBottom: 12,
                    }}
                  >
                    {conversa.map((m) => {
                      const isProf = m.senderRole === "PROFESSIONAL";
                      const quando = new Date(m.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${DASH.gold}`,
                            background: isProf ? "rgba(200,155,60,0.12)" : DASH.inner,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => void handleExcluirMensagem(m.id)}
                            style={{
                              background: "transparent",
                              border: "1px solid rgba(229,115,115,0.55)",
                              color: "#e57373",
                              borderRadius: 8,
                              padding: "4px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                              flexShrink: 0,
                              fontFamily: "inherit",
                            }}
                            title="Excluir mensagem"
                          >
                            Excluir
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 10,
                                fontWeight: 700,
                                color: isProf ? DASH.gold : DASH.muted,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {isProf ? m.from || "Profissional" : "Você"} · {quando}
                            </p>
                            <p
                              style={{
                                margin: "3px 0 0",
                                fontSize: 12,
                                lineHeight: 1.4,
                                color: DASH.text,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={m.body}
                            >
                              {m.body}
                            </p>
                          </div>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              color: isProf ? DASH.gold : DASH.muted,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isProf ? "Recebida" : "Enviada"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

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

          {canUseTalentBank && (
            <section style={{ ...dashCard, padding: 18 }}>
              <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>
                📁 Adicionar ao banco de talentos
              </h3>
              {resumo.bloqueado ? (
                <p style={{ margin: 0, fontSize: 13, color: DASH.muted, lineHeight: 1.45 }}>
                  Libere o contato para adicionar este profissional às suas listas.
                </p>
              ) : (
                <>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
                    Selecione uma ou mais listas (Ctrl/Cmd + clique) e salve.
                  </p>
                  <select
                    multiple
                    size={Math.min(6, Math.max(3, talentLists.length || 3))}
                    value={talentListIdsSelecionados}
                    onChange={(e) => {
                      const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                      setTalentListIdsSelecionados(opts);
                    }}
                    style={{
                      ...dashInput,
                      width: "100%",
                      minHeight: 96,
                      padding: 8,
                      marginBottom: 10,
                    }}
                  >
                    {talentLists.length === 0 ? (
                      <option value="" disabled>
                        Nenhuma lista criada ainda
                      </option>
                    ) : (
                      talentLists.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      type="button"
                      disabled={salvandoTalent}
                      onClick={async () => {
                        setSalvandoTalent(true);
                        try {
                          const res = await fetch("/api/company/talent-lists", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                              action: "syncProfileLists",
                              profileId,
                              listIds: talentListIdsSelecionados,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error || "Erro ao salvar no banco de talentos");
                            return;
                          }
                          if (Array.isArray(data.membershipListIds)) {
                            setTalentListIdsSelecionados(data.membershipListIds.map(String));
                          }
                          alert("Listas do banco de talentos atualizadas.");
                        } catch {
                          alert("Erro ao salvar no banco de talentos");
                        } finally {
                          setSalvandoTalent(false);
                        }
                      }}
                      style={{ ...btnGold, padding: "8px 14px", fontSize: 12, opacity: salvandoTalent ? 0.7 : 1 }}
                    >
                      {salvandoTalent ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      type="button"
                      disabled={salvandoTalent}
                      onClick={async () => {
                        const name = window.prompt("Nome da nova lista:");
                        if (!name?.trim()) return;
                        try {
                          const res = await fetch("/api/company/talent-lists", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ action: "createList", name: name.trim() }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            alert(data.error || "Erro ao criar lista");
                            return;
                          }
                          const tlRes = await fetch(
                            `/api/company/talent-lists?profileId=${encodeURIComponent(profileId)}`,
                            { credentials: "include" },
                          );
                          if (tlRes.ok) {
                            const tlData = await tlRes.json();
                            setTalentLists(
                              Array.isArray(tlData.lists)
                                ? tlData.lists.map((l: { id: string; name: string }) => ({
                                    id: l.id,
                                    name: l.name,
                                  }))
                                : [],
                            );
                            setTalentListIdsSelecionados((prev) =>
                              data.id && !prev.includes(data.id) ? [...prev, data.id] : prev,
                            );
                          }
                        } catch {
                          alert("Erro ao criar lista");
                        }
                      }}
                      style={{
                        background: "transparent",
                        border: `1px solid ${DASH.gold}`,
                        color: DASH.gold,
                        borderRadius: 8,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      + Nova lista
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          <section style={{ ...dashCard, padding: 18 }}>
            <h3 style={{ ...goldTitle, margin: "0 0 8px", fontSize: 16 }}>💡 Dicas enviadas ao candidato</h3>
            <p style={{ fontSize: 11, color: DASH.muted, margin: "0 0 12px", lineHeight: 1.45 }}>
              {AVISO_RETENCAO_INBOX}
            </p>
            {tips.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14, maxHeight: 220, overflowY: "auto" }}>
                {tips.map((tip) => (
                  <div
                    key={tip.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      padding: 10,
                      ...dashInnerBox,
                      borderLeft: `3px solid ${DASH.gold}`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => void handleExcluirDica(tip.id)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(229,115,115,0.55)",
                        color: "#e57373",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer",
                        flexShrink: 0,
                        fontFamily: "inherit",
                      }}
                      title="Excluir dica"
                    >
                      Excluir
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 4px", fontSize: 13, lineHeight: 1.5, color: DASH.text }}>{tip.message}</p>
                      <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>{new Date(tip.createdAt).toLocaleString("pt-BR")}</p>
                    </div>
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

          <section style={{ ...dashCard, padding: 18 }}>
            <h3 style={{ ...goldTitle, margin: "0 0 8px", fontSize: 16 }}>📝 Anotações internas</h3>
            <p style={{ margin: "0 0 10px", fontSize: 11, color: DASH.muted, lineHeight: 1.4 }}>
              O acompanhamento (entrevistado, em teste, contratado, não contratado) fica na aba Entrevistas do painel.
            </p>
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
                border: `1px solid ${DASH.gold}`,
                fontSize: 14,
                lineHeight: 1.5,
                resize: "vertical",
              }}
            />
            {savingNotes && <p style={{ fontSize: 11, color: DASH.muted, margin: "6px 0 0" }}>Salvando...</p>}
          </section>
        </aside>
        </div>
      </div>

    </div>
  );
}

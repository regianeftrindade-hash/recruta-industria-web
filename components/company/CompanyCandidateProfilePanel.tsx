"use client";

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { SobreMimData } from "@/lib/sobre-mim";
import type { ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import { GOLD_GRADIENT_STOPS } from "@/lib/decorative-gold-line";
import {
  DASH,
  dashCard,
  dashGhostBtn,
  dashInput,
} from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import PropostasEntrevistasEmpresa from "@/components/company/PropostasEntrevistasEmpresa";
import CompanyCandidateNotesCard from "@/components/company/CompanyCandidateNotesCard";
import CompanyCandidateFeedbackCard from "@/components/company/CompanyCandidateFeedbackCard";
import CompanyCandidateMessagesCard from "@/components/company/CompanyCandidateMessagesCard";
import CompanyCandidateTipsCard, { type TipItem } from "@/components/company/CompanyCandidateTipsCard";
import CompanyCandidateProfileHeader from "@/components/company/CompanyCandidateProfileHeader";
import CompanyCandidateProfileDetails from "@/components/company/CompanyCandidateProfileDetails";
import CompanyCandidateProfileMediaShare from "@/components/company/CompanyCandidateProfileMediaShare";
import { goldTitle } from "@/components/company/candidate-profile-bits";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import type {
  CompanyCandidateProfilePanelProps,
  DocumentoAnexo,
  Resumo,
  Tracking,
} from "@/components/company/company-candidate-profile-types";

export default function CompanyCandidateProfilePanel({
  profileId,
  onBack,
  onUnlocked,
}: CompanyCandidateProfilePanelProps) {
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
  const [tips, setTips] = useState<TipItem[]>([]);
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

  useLayoutEffect(() => {
    const updateLine = () => {
      const root = headerRef.current;
      const info = infoRef.current;
      if (!root || !info) {
        setGoldLine(null);
        return;
      }
      if (window.matchMedia("(max-width: 900px)").matches) {
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

  return (
    <div style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
      <div
        className="ri-candidate-profile-head"
        ref={headerRef}
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 0.9fr)",
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
              gridColumn: "1 / -1",
              gridRow: "1 / -1",
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
          className="ri-candidate-profile-main"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            zIndex: 1,
            minWidth: 0,
          }}
        >
          <CompanyCandidateProfileHeader
            resumo={resumo}
            infoRef={infoRef}
            profissionalOnline={profissionalOnline}
            canFavorite={canFavorite}
            favoriting={favoriting}
            onFavorite={handleFavorite}
            companyVerified={companyVerified}
            canUnlock={canUnlock}
            unlocking={unlocking}
            onUnlock={handleUnlock}
          />

          <CompanyCandidateProfileDetails
            resumo={resumo}
            formEdit={formEdit}
            sobreMim={sobreMim}
            sobreMimPreenchido={sobreMimPreenchido}
            testeComportamental={testeComportamental}
            documentos={documentos}
          />
        </div>

        {/* Vídeo de apresentação + chamada + compartilhar */}
        <div
          className="ri-candidate-profile-side"
          style={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12,
            position: "relative",
            zIndex: 1,
          }}
        >
          <CompanyCandidateProfileMediaShare
            profileId={profileId}
            bloqueado={resumo.bloqueado}
            nome={resumo.nome}
            videoApresentacaoUrl={videoApresentacaoUrl}
            videoRef={videoRef}
            showShare={showShare}
            shareMembers={shareMembers}
            shareSelected={shareSelected}
            shareNote={shareNote}
            loadingShareMembers={loadingShareMembers}
            sharing={sharing}
            shareMsg={shareMsg}
            onToggleShare={loadShareMembers}
            onToggleMember={toggleShareMember}
            onShareNoteChange={setShareNote}
            onShare={handleShareProfile}
          />

          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginTop: 0,
              alignItems: "stretch",
              minWidth: 0,
              maxWidth: "100%",
              width: "100%",
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

            <CompanyCandidateFeedbackCard profileId={profileId} />

            <CompanyCandidateMessagesCard
              profileId={profileId}
              bloqueado={resumo.bloqueado}
              conversa={conversa}
              onConversaChange={setConversa}
              onReload={carregar}
            />

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

            <CompanyCandidateTipsCard
              profileId={profileId}
              bloqueado={resumo.bloqueado}
              canSendTips={canSendTips}
              tips={tips}
              onTipsChange={setTips}
              onReload={carregar}
            />

            <CompanyCandidateNotesCard
              profileId={profileId}
              notes={tracking.notes}
              onNotesChange={(notes) => setTracking((t) => ({ ...t, notes }))}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}

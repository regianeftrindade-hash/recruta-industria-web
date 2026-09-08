"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEditPayload } from "@/lib/professional-profile-map";
import type { SobreMimData } from "@/lib/sobre-mim";
import type { ResultadoTesteComportamental } from "@/lib/teste-comportamental";
import type { TipItem } from "@/components/company/CompanyCandidateTipsCard";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";
import type {
  DocumentoAnexo,
  Resumo,
  Tracking,
} from "@/components/company/company-candidate-profile-types";

type ShareMember = { id: string; name: string; email: string; department: string };

type ConversaMsg = {
  id: string;
  from: string;
  body: string;
  createdAt: string;
  senderRole: "COMPANY" | "PROFESSIONAL";
};

export function useCompanyCandidateProfile(
  profileId: string,
  onUnlocked?: () => void,
) {
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
  const [proposals, setProposals] = useState<JobProposalDTO[]>([]);
  const [favoriting, setFavoriting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareMembers, setShareMembers] = useState<ShareMember[]>([]);
  const [shareSelected, setShareSelected] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState("");
  const [loadingShareMembers, setLoadingShareMembers] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [conversa, setConversa] = useState<ConversaMsg[]>([]);
  const [sobreMim, setSobreMim] = useState<SobreMimData | null>(null);
  const [sobreMimPreenchido, setSobreMimPreenchido] = useState(false);
  const [testeComportamental, setTesteComportamental] = useState<ResultadoTesteComportamental | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoAnexo[]>([]);
  const [videoApresentacaoUrl, setVideoApresentacaoUrl] = useState<string | null>(null);
  const [profissionalOnline, setProfissionalOnline] = useState(false);

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

  return {
    loading,
    error,
    resumo,
    formEdit,
    tracking,
    setTracking,
    tips,
    setTips,
    canUnlock,
    companyVerified,
    canSendTips,
    canFavorite,
    canSendProposals,
    canUseTalentBank,
    talentLists,
    setTalentLists,
    talentListIdsSelecionados,
    setTalentListIdsSelecionados,
    proposals,
    favoriting,
    unlocking,
    showShare,
    shareMembers,
    shareSelected,
    shareNote,
    setShareNote,
    loadingShareMembers,
    sharing,
    shareMsg,
    conversa,
    setConversa,
    sobreMim,
    sobreMimPreenchido,
    testeComportamental,
    documentos,
    videoApresentacaoUrl,
    profissionalOnline,
    carregar,
    recarregarPropostas,
    handleUnlock,
    handleFavorite,
    loadShareMembers,
    toggleShareMember,
    handleShareProfile,
  };
}

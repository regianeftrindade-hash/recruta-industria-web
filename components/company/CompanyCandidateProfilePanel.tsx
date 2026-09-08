"use client";

import React from "react";
import { GOLD_GRADIENT_STOPS } from "@/lib/decorative-gold-line";
import {
  DASH,
  dashGhostBtn,
} from "@/lib/dashboard-theme";
import AmpulhetaLoading from "@/components/ui/AmpulhetaLoading";
import CompanyCandidateProfileHeader from "@/components/company/CompanyCandidateProfileHeader";
import CompanyCandidateProfileDetails from "@/components/company/CompanyCandidateProfileDetails";
import CompanyCandidateProfileMediaShare from "@/components/company/CompanyCandidateProfileMediaShare";
import CompanyCandidateProfileSideColumn from "@/components/company/CompanyCandidateProfileSideColumn";
import type { CompanyCandidateProfilePanelProps } from "@/components/company/company-candidate-profile-types";
import { useCompanyCandidateProfile } from "@/components/company/useCompanyCandidateProfile";
import { useCandidateProfileGoldLine } from "@/components/company/useCandidateProfileGoldLine";

export default function CompanyCandidateProfilePanel({
  profileId,
  onBack,
  onUnlocked,
}: CompanyCandidateProfilePanelProps) {
  const {
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
  } = useCompanyCandidateProfile(profileId, onUnlocked);

  const { headerRef, infoRef, videoRef, lineGradId, goldLine } = useCandidateProfileGoldLine({
    resumo,
    videoApresentacaoUrl,
    loading,
  });

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

          <CompanyCandidateProfileSideColumn
            profileId={profileId}
            bloqueado={resumo.bloqueado}
            canSendProposals={canSendProposals}
            proposals={proposals}
            onProposalsChanged={() => void recarregarPropostas()}
            canUseTalentBank={canUseTalentBank}
            talentLists={talentLists}
            talentListIdsSelecionados={talentListIdsSelecionados}
            onTalentListIdsChange={setTalentListIdsSelecionados}
            onTalentListsChange={setTalentLists}
            conversa={conversa}
            onConversaChange={setConversa}
            canSendTips={canSendTips}
            tips={tips}
            onTipsChange={setTips}
            notes={tracking.notes}
            onNotesChange={(notes) => setTracking((t) => ({ ...t, notes }))}
            onReload={carregar}
          />
        </div>
      </div>
    </div>
  );
}

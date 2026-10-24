"use client";

import React from "react";
import { botaoPerfil, CLASSE_PERFIL, COR_DOURADO, textoAviso } from "@/lib/ui/perfil-empresa-cores";
import "@/styles/perfil-empresa-cores.css";
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
    actionFeedback,
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

  const { headerRef, infoRef, videoRef, goldLine } = useCandidateProfileGoldLine({
    resumo,
    videoApresentacaoUrl,
    loading,
  });

  if (loading) {
    return (
      <div className={CLASSE_PERFIL} style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
        <AmpulhetaLoading label="Carregando perfil..." size={36} color={COR_DOURADO} />
      </div>
    );
  }

  if (error || !resumo) {
    return (
      <div className={CLASSE_PERFIL} style={{ padding: "20px 0" }}>
        <p style={{ ...textoAviso, marginBottom: 16 }}>{error || "Perfil não encontrado"}</p>
        <button type="button" onClick={onBack} style={{ ...botaoPerfil, padding: "8px 16px", fontSize: 13 }}>
          ← Voltar
        </button>
      </div>
    );
  }

  return (
    <div className={CLASSE_PERFIL} style={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden", boxSizing: "border-box" }}>
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
            <path
              d={goldLine.d}
              fill="none"
              stroke="#000"
              strokeWidth={4.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={goldLine.d}
              fill="none"
              stroke={COR_DOURADO}
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
            actionFeedback={actionFeedback}
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
          />
        </div>
      </div>
    </div>
  );
}

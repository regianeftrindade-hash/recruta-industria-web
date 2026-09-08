"use client";

import React from "react";
import PropostasEntrevistasEmpresa from "@/components/company/PropostasEntrevistasEmpresa";
import CompanyCandidateNotesCard from "@/components/company/CompanyCandidateNotesCard";
import CompanyCandidateFeedbackCard from "@/components/company/CompanyCandidateFeedbackCard";
import CompanyCandidateMessagesCard, {
  type ConversaItem,
} from "@/components/company/CompanyCandidateMessagesCard";
import CompanyCandidateTipsCard, { type TipItem } from "@/components/company/CompanyCandidateTipsCard";
import CompanyCandidateTalentBankCard, {
  type TalentListItem,
} from "@/components/company/CompanyCandidateTalentBankCard";
import type { JobProposalDTO } from "@/lib/company/job-proposals-shared";

export type { TalentListItem };

type Props = {
  profileId: string;
  bloqueado: boolean;
  canSendProposals: boolean;
  proposals: JobProposalDTO[];
  onProposalsChanged: () => void;
  canUseTalentBank: boolean;
  talentLists: TalentListItem[];
  talentListIdsSelecionados: string[];
  onTalentListIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
  onTalentListsChange: React.Dispatch<React.SetStateAction<TalentListItem[]>>;
  conversa: ConversaItem[];
  onConversaChange: (next: ConversaItem[]) => void;
  canSendTips: boolean;
  tips: TipItem[];
  onTipsChange: (next: TipItem[]) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
};

export default function CompanyCandidateProfileSideColumn({
  profileId,
  bloqueado,
  canSendProposals,
  proposals,
  onProposalsChanged,
  canUseTalentBank,
  talentLists,
  talentListIdsSelecionados,
  onTalentListIdsChange,
  onTalentListsChange,
  conversa,
  onConversaChange,
  canSendTips,
  tips,
  onTipsChange,
  notes,
  onNotesChange,
}: Props) {
  return (
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
      {!bloqueado && (
        <PropostasEntrevistasEmpresa
          profileId={profileId}
          canSend={canSendProposals}
          proposals={proposals}
          onChanged={onProposalsChanged}
        />
      )}

      <CompanyCandidateFeedbackCard profileId={profileId} />

      <CompanyCandidateMessagesCard
        profileId={profileId}
        bloqueado={bloqueado}
        conversa={conversa}
        onConversaChange={onConversaChange}
      />

      {canUseTalentBank && (
        <CompanyCandidateTalentBankCard
          profileId={profileId}
          bloqueado={bloqueado}
          talentLists={talentLists}
          talentListIdsSelecionados={talentListIdsSelecionados}
          onTalentListIdsChange={onTalentListIdsChange}
          onTalentListsChange={onTalentListsChange}
        />
      )}

      <CompanyCandidateTipsCard
        profileId={profileId}
        bloqueado={bloqueado}
        canSendTips={canSendTips}
        tips={tips}
        onTipsChange={onTipsChange}
      />

      <CompanyCandidateNotesCard
        profileId={profileId}
        notes={notes}
        onNotesChange={onNotesChange}
      />
    </aside>
  );
}

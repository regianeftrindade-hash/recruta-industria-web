"use client";

import { DASH } from "@/lib/dashboard-theme";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import type { CallStatus, Participant, RhMember } from "./types";

type Props = {
  status: CallStatus;
  isInitiator: boolean;
  extrasCount: number;
  podeConvidarMais: boolean;
  pendingInvites: RhMember[];
  participants: Participant[];
  addingParticipant: boolean;
  loadingRhMembers: boolean;
  showRhMembers: boolean;
  rhMembers: RhMember[];
  onRemovePendingInvite: (id: string) => void;
  onRemoveParticipant: (id: string) => void;
  onLoadRhMembers: () => void;
  onInviteMember: (member: RhMember) => void;
};

/** Painel de convidados RH / participantes (empresa iniciadora ou idle). */
export default function PlatformVideoCallInvitePanel({
  status,
  isInitiator,
  extrasCount,
  podeConvidarMais,
  pendingInvites,
  participants,
  addingParticipant,
  loadingRhMembers,
  showRhMembers,
  rhMembers,
  onRemovePendingInvite,
  onRemoveParticipant,
  onLoadRhMembers,
  onInviteMember,
}: Props) {
  if (!(isInitiator || status === "idle")) return null;

  return (
    <div
      style={{
        border: `1px solid ${DASH.gold}`,
        borderRadius: 8,
        padding: 8,
        marginBottom: 10,
      }}
    >
      <p style={{ margin: "0 0 6px", fontSize: 10, color: DASH.text, lineHeight: 1.45 }}>
        Colegas do mesmo plano podem entrar se estiverem com este perfil aberto — cada um aceita ou recusa no próprio painel.
      </p>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: DASH.gold, textTransform: "uppercase" }}>
        Convidados ({extrasCount}/3)
      </p>

      {status === "idle" || status === "ended" || status === "declined" || status === "missed"
        ? pendingInvites.map((invite) => (
            <div
              key={invite.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: DASH.text,
                padding: "2px 0",
              }}
            >
              <span>👤 {invite.name}</span>
              <button
                type="button"
                onClick={() => onRemovePendingInvite(invite.id)}
                style={{ background: "none", border: "none", color: "#f87171", fontSize: 10, cursor: "pointer", padding: 0 }}
              >
                Remover
              </button>
            </div>
          ))
        : participants.map((part, index) => (
            <div
              key={part.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: DASH.text,
                padding: "2px 0",
              }}
            >
              <span>👤 {part.name}</span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => onRemoveParticipant(part.id)}
                  style={{ background: "none", border: "none", color: "#f87171", fontSize: 10, cursor: "pointer", padding: 0 }}
                >
                  Remover
                </button>
              )}
            </div>
          ))}

      {podeConvidarMais && (
        <>
          <button
            type="button"
            disabled={addingParticipant || loadingRhMembers}
            onClick={onLoadRhMembers}
            style={{
              ...btnGold,
              width: "100%",
              marginTop: 6,
              padding: "6px 8px",
              fontSize: 10,
              opacity: addingParticipant || loadingRhMembers ? 0.7 : 1,
            }}
          >
            {loadingRhMembers ? "Buscando…" : "Convide"}
          </button>
          {showRhMembers && (
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {rhMembers.length === 0 && !loadingRhMembers ? (
                <p style={{ margin: 0, fontSize: 10, color: DASH.muted, lineHeight: 1.4 }}>
                  Nenhuma outra pessoa na mesma assinatura. Cadastre usuários na aba Equipe.
                </p>
              ) : (
                rhMembers
                  .filter((member) => {
                    if (pendingInvites.some((p) => p.id === member.id)) return false;
                    if (participants.some((part) => part.name === member.name)) return false;
                    return true;
                  })
                  .map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      disabled={addingParticipant}
                      onClick={() => onInviteMember(member)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "center",
                        padding: "6px 8px",
                        border: `1px solid ${DASH.gold}`,
                        borderRadius: 10,
                        background: DASH.inner,
                        color: DASH.text,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                      }}
                    >
                      <span>
                        <strong style={{ color: DASH.gold }}>{member.name}</strong>
                        <span style={{ display: "block", fontSize: 9, color: DASH.muted }}>
                          {member.department} · {member.email}
                        </span>
                      </span>
                      <span style={{ color: DASH.gold, fontSize: 10 }}>Convidar</span>
                    </button>
                  ))
              )}
            </div>
          )}
        </>
      )}
      <p style={{ margin: "6px 0 0", fontSize: 9, color: DASH.muted, lineHeight: 1.4 }}>
        Só aparecem pessoas da mesma assinatura/plano. Quem estiver vendo este perfil recebe o convite com sobreposição.
      </p>
    </div>
  );
}

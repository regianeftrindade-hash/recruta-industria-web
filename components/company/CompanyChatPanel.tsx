"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashInnerBox } from "@/lib/dashboard-theme";

type RhMember = {
  id: string;
  name: string;
  email: string;
  companyName: string;
  department: string;
};

export function CompanyChatPanel() {
  const router = useRouter();
  const [members, setMembers] = React.useState<RhMember[]>([]);
  const [invitedIds, setInvitedIds] = React.useState<Set<string>>(new Set());
  const [showMembers, setShowMembers] = React.useState(false);
  const [loadingMembers, setLoadingMembers] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState<
    Array<{ id: string; authorUserId: string; authorName: string; body: string; createdAt: string }>
  >([]);
  const [currentUserId, setCurrentUserId] = React.useState("");
  const [loadingMessages, setLoadingMessages] = React.useState(true);
  const [shares, setShares] = React.useState<
    Array<{
      id: string;
      profileId: string;
      professionalName: string;
      cargo: string | null;
      fromName: string;
      note: string | null;
      createdAt: string;
      readAt: string | null;
    }>
  >([]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await fetch("/api/company/chat", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setCurrentUserId(String(data.currentUserId || ""));
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadShares = async () => {
    try {
      const res = await fetch("/api/company/profile-share", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setShares(Array.isArray(data.shares) ? data.shares : []);
    } catch {
      /* ignore */
    }
  };

  React.useEffect(() => {
    void loadMessages();
    void loadShares();
  }, []);

  const openSharedProfile = async (share: {
    id: string;
    profileId: string;
    readAt: string | null;
  }) => {
    if (!share.readAt) {
      void fetch("/api/company/profile-share", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shareId: share.id }),
      }).then(() => void loadShares());
    }
    router.push(`/company/professional/${share.profileId}`);
  };

  const postChatMessage = async (text: string) => {
    const res = await fetch("/api/company/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.message) {
      setMessages((prev) => [...prev, data.message]);
    }
  };

  const loadMembers = async () => {
    setShowMembers((current) => !current);
    if (members.length > 0) return;
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/company/rh-members", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setMembers(Array.isArray(data.members) ? data.members : []);
    } finally {
      setLoadingMembers(false);
    }
  };

  const inviteMember = async (member: RhMember) => {
    setInvitedIds((prev) => new Set(prev).add(member.id));
    await postChatMessage(`${member.name} foi convidado(a) para o chat.`);
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    await postChatMessage(text);
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {shares.length > 0 ? (
        <div style={{ ...dashInnerBox, padding: 14, display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: DASH.gold }}>
            Perfis compartilhados com você
          </p>
          {shares.slice(0, 8).map((share) => (
            <button
              key={share.id}
              type="button"
              onClick={() => void openSharedProfile(share)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                padding: "9px 10px",
                border: `1px solid ${DASH.gold}`,
                borderRadius: 14,
                background: share.readAt ? DASH.inner : "rgba(200,155,60,0.18)",
                color: DASH.text,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <span>
                <strong style={{ color: DASH.gold }}>{share.professionalName}</strong>
                <span style={{ display: "block", fontSize: 10, color: DASH.muted }}>
                  De {share.fromName}
                  {share.cargo ? ` · ${share.cargo}` : ""}
                  {share.note ? ` · ${share.note}` : ""}
                </span>
              </span>
              <span style={{ fontSize: 11, color: DASH.gold }}>
                {share.readAt ? "Abrir" : "Novo"}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ ...dashInnerBox, padding: 14 }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, color: DASH.text, lineHeight: 1.5 }}>
          Convide pessoas da mesma assinatura/plano (equipe RH cadastrada nesta aba).
        </p>
        <button type="button" onClick={() => void loadMembers()} style={{ ...btnGold, padding: "7px 12px", fontSize: 12 }}>
          Convide para o chat
        </button>

        {showMembers && (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            {loadingMembers ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Buscando pessoas do RH...</p>
            ) : members.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
                Nenhuma outra pessoa na mesma assinatura. Cadastre usuários na seção Equipe RH abaixo.
              </p>
            ) : (
              members.map((member) => {
                const invited = invitedIds.has(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    disabled={invited}
                    onClick={() => void inviteMember(member)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      padding: "9px 10px",
                      border: `1px solid ${DASH.gold}`,
                      borderRadius: 14,
                      background: invited ? "rgba(200,155,60,0.18)" : DASH.inner,
                      color: DASH.text,
                      cursor: invited ? "default" : "pointer",
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
                    <span style={{ fontSize: 11, color: invited ? DASH.muted : DASH.gold }}>
                      {invited ? "Convidado" : "Convidar"}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <div
        style={{
          ...dashInnerBox,
          minHeight: 320,
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, display: "grid", alignContent: "start", gap: 8 }}>
          {loadingMessages ? (
            <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>Carregando conversa...</p>
          ) : messages.length === 0 ? (
            <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
              Nenhuma mensagem ainda. Convide alguém do RH ou envie a primeira mensagem.
            </p>
          ) : (
            messages.map((msg) => {
              const mine = msg.authorUserId === currentUserId;
              return (
                <div
                  key={msg.id}
                  style={{
                    justifySelf: mine ? "end" : "start",
                    maxWidth: "76%",
                    borderRadius: 16,
                    border: `1px solid ${mine ? DASH.gold : DASH.border}`,
                    background: mine ? "rgba(200,155,60,0.18)" : DASH.card,
                    padding: "8px 10px",
                  }}
                >
                  <p style={{ margin: "0 0 3px", fontSize: 10, color: DASH.gold, fontWeight: 800 }}>
                    {mine ? "Você" : msg.authorName}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: DASH.text, lineHeight: 1.45 }}>{msg.body}</p>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendMessage();
            }}
            placeholder="Digite uma mensagem..."
            style={{
              flex: 1,
              minWidth: 0,
              border: `1px solid ${DASH.gold}`,
              borderRadius: 14,
              background: DASH.input,
              color: DASH.text,
              padding: "9px 10px",
              fontSize: 12,
            }}
          />
          <button type="button" onClick={() => void sendMessage()} style={{ ...btnGold, padding: "8px 14px", fontSize: 12 }}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

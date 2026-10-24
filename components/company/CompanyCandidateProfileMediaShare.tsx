"use client";

import React, { useEffect, useState } from "react";
import { botaoPerfil, textoAviso, textoDourado, textoPreto } from "@/lib/ui/perfil-empresa-cores";
import SecureVideoPlayer from "@/components/shared/SecureVideoPlayer";
import {
  DASH,
  dashInnerBox,
  dashInput,
} from "@/lib/dashboard-theme";
import PlatformVideoCall from "@/components/shared/PlatformVideoCall";

type ShareMember = { id: string; name: string; email: string; department: string };

type Props = {
  profileId: string;
  bloqueado: boolean;
  nome: string;
  videoApresentacaoUrl: string | null;
  videoRef: React.RefObject<HTMLDivElement | null>;
  showShare: boolean;
  shareMembers: ShareMember[];
  shareSelected: string[];
  shareNote: string;
  loadingShareMembers: boolean;
  sharing: boolean;
  shareMsg: string;
  onToggleShare: () => void;
  onToggleMember: (memberId: string) => void;
  onShareNoteChange: (note: string) => void;
  onShare: () => void;
};

export default function CompanyCandidateProfileMediaShare({
  profileId,
  bloqueado,
  nome,
  videoApresentacaoUrl,
  videoRef,
  showShare,
  shareMembers,
  shareSelected,
  shareNote,
  loadingShareMembers,
  sharing,
  shareMsg,
  onToggleShare,
  onToggleMember,
  onShareNoteChange,
  onShare,
}: Props) {
  const [autoChamar, setAutoChamar] = useState(false);

  useEffect(() => {
    setAutoChamar(new URLSearchParams(window.location.search).get("chamar") === "1");
  }, []);
  return (
    <>
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
        {!bloqueado && videoApresentacaoUrl ? (
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
                border: "2px solid #000",
                background: "#000",
                boxShadow: "none",
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
                ...textoDourado,
                margin: 0,
                display: "inline-block",
                fontSize: 10,
                textAlign: "center",
                border: "2px solid #000",
                borderRadius: 999,
                padding: "4px 8px",
                background: "transparent",
              }}
            >
              Vídeo de apresentação
            </p>
          </div>
        ) : !bloqueado ? (
          <div
            style={{
              width: 128,
              height: 228,
              borderRadius: 12,
              border: "2px dashed #000",
              background: DASH.inner,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 10,
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: 11, color: "#000", lineHeight: 1.4 }}>
              Sem vídeo de apresentação
            </p>
          </div>
        ) : null}

        {!bloqueado && (
          <PlatformVideoCall
            role="company"
            profileId={profileId}
            title="Chamada de vídeo"
            compact
            peerLabel={nome.split(" ")[0] || "candidato"}
            autoChamar={autoChamar}
          />
        )}
      </div>

      {!bloqueado && (
        <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={() => void onToggleShare()}
            title="Compartilhar com a equipe do mesmo plano"
            style={{
              ...botaoPerfil,
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
                border: "2px solid #000",
                display: "grid",
                gap: 10,
              }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, ...textoDourado }}>
                Compartilhar com a equipe (mesmo plano)
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#000", lineHeight: 1.45 }}>
                Só aparecem pessoas da mesma assinatura. Elas recebem o link no chat e em
                compartilhados.
              </p>
              {loadingShareMembers ? (
                <p style={{ margin: 0, fontSize: 12, color: "#000" }}>Buscando equipe...</p>
              ) : shareMembers.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: "#000" }}>
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
                        onClick={() => onToggleMember(member.id)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          alignItems: "center",
                          padding: "8px 10px",
                          border: "2px solid #000",
                          borderRadius: 10,
                          background: DASH.inner,
                          color: "#000",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textAlign: "left",
                        }}
                      >
                        <span>
                          <strong style={{ ...textoDourado }}>{member.name}</strong>
                          <span style={{ display: "block", fontSize: 10, color: "#000" }}>
                            {member.department} · {member.email}
                          </span>
                        </span>
                        <span style={{ fontSize: 11, ...(selected ? textoDourado : textoPreto) }}>
                          {selected ? "Selecionado" : "Selecionar"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <label>
                <span style={{ ...textoDourado, display: "block", marginBottom: 4, fontSize: 11, textTransform: "uppercase" }}>
                  Nota (opcional)
                </span>
                <input
                  value={shareNote}
                  onChange={(e) => onShareNoteChange(e.target.value)}
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
                    ...(shareMsg.includes("compartilhado") ? textoDourado : textoAviso),
                  }}
                >
                  {shareMsg}
                </p>
              ) : null}
              {shareMembers.length > 0 ? (
                <button
                  type="button"
                  disabled={sharing || shareSelected.length === 0}
                  onClick={() => void onShare()}
                  style={{
                    ...botaoPerfil,
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
    </>
  );
}

"use client";

import React, { useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { DASH, dashCard, dashInput } from "@/lib/dashboard-theme";
import { goldTitle } from "@/components/company/candidate-profile-bits";

export type TalentListItem = { id: string; name: string };

type Props = {
  profileId: string;
  bloqueado: boolean;
  talentLists: TalentListItem[];
  talentListIdsSelecionados: string[];
  onTalentListIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
  onTalentListsChange: React.Dispatch<React.SetStateAction<TalentListItem[]>>;
};

export default function CompanyCandidateTalentBankCard({
  profileId,
  bloqueado,
  talentLists,
  talentListIdsSelecionados,
  onTalentListIdsChange,
  onTalentListsChange,
}: Props) {
  const [salvandoTalent, setSalvandoTalent] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  return (
    <section style={{ ...dashCard, padding: 18 }}>
      <h3 style={{ ...goldTitle, margin: "0 0 12px", fontSize: 16 }}>
        📁 Adicionar ao banco de talentos
      </h3>
      {bloqueado ? (
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
              onTalentListIdsChange(opts);
              if (feedback) setFeedback(null);
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
                setFeedback(null);
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
                    setFeedback({ tone: "err", text: data.error || "Erro ao salvar no banco de talentos" });
                    return;
                  }
                  if (Array.isArray(data.membershipListIds)) {
                    onTalentListIdsChange(data.membershipListIds.map(String));
                  }
                  setFeedback({ tone: "ok", text: "Listas do banco de talentos atualizadas." });
                } catch {
                  setFeedback({ tone: "err", text: "Erro ao salvar no banco de talentos" });
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
                setFeedback(null);
                try {
                  const res = await fetch("/api/company/talent-lists", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ action: "createList", name: name.trim() }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setFeedback({ tone: "err", text: data.error || "Erro ao criar lista" });
                    return;
                  }
                  const tlRes = await fetch(
                    `/api/company/talent-lists?profileId=${encodeURIComponent(profileId)}`,
                    { credentials: "include" },
                  );
                  if (tlRes.ok) {
                    const tlData = await tlRes.json();
                    onTalentListsChange(
                      Array.isArray(tlData.lists)
                        ? tlData.lists.map((l: { id: string; name: string }) => ({
                            id: l.id,
                            name: l.name,
                          }))
                        : [],
                    );
                    onTalentListIdsChange((prev) =>
                      data.id && !prev.includes(data.id) ? [...prev, data.id] : prev,
                    );
                  }
                  setFeedback({ tone: "ok", text: "Lista criada." });
                } catch {
                  setFeedback({ tone: "err", text: "Erro ao criar lista" });
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
          {feedback ? (
            <p
              role="status"
              style={{
                margin: "10px 0 0",
                fontSize: 12,
                fontWeight: 700,
                color: feedback.tone === "ok" ? "#8bc34a" : "#e57373",
                lineHeight: 1.45,
              }}
            >
              {feedback.text}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

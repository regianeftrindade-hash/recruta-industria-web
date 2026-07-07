"use client";



import React from "react";

import { btnGoldStyle as btnGold } from "@/lib/button-3d";

import { DASH, dashCard, dashInput, dashInnerBox, dashLabel, dashPlanAccent, dashSectionTitle } from "@/lib/dashboard-theme";



export type DashboardStats = {
  perfisFavoritados: number;
  pesquisasRealizadas: number;
  liberacoesMes: number;
  alertasConfigurados: number;
};



export type TalentList = { id: string; name: string; itemCount: number };



export type CompanyAlert = {

  id: string;

  name: string;

  active: boolean;

  newMatches: { profileId: string; score: number }[];

};



export function DashboardStatsBar({ stats }: { stats: DashboardStats }) {

  const items = [
    ["Favoritos", stats.perfisFavoritados],
    ["Pesquisas", stats.pesquisasRealizadas],
    ["Liberações/mês", stats.liberacoesMes],
    ["Alertas", stats.alertasConfigurados],
  ];

  return (

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>

      {items.map(([label, val]) => (

        <div key={String(label)} style={{ ...dashCard, borderRadius: 8, padding: 10, textAlign: "center" }}>

          <p style={{ ...dashLabel, margin: "0 0 4px", fontSize: 9 }}>{label}</p>

          <p style={{ color: DASH.text, margin: 0, fontSize: 18, fontWeight: "bold" }}>{val}</p>

        </div>

      ))}

    </div>

  );

}



export function AlertsPanel({

  alerts,

  onCreate,

  onToggle,

  onDelete,

}: {

  alerts: CompanyAlert[];

  onCreate: () => void;

  onToggle: (id: string, active: boolean) => void;

  onDelete: (id: string) => void;

}) {

  return (

    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DASH.border}` }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

        <h4 style={{ ...dashSectionTitle, margin: 0, fontSize: 12 }}>🔔 Alertas de talentos</h4>

        <button type="button" onClick={onCreate} style={{ ...btnGold, padding: "4px 8px", fontSize: 9 }}>+ Novo</button>

      </div>

      {alerts.length === 0 ? (

        <p style={{ color: DASH.muted, fontSize: 10, margin: 0 }}>Nenhum alerta configurado.</p>

      ) : (

        alerts.map((a) => (

          <div key={a.id} style={{ ...dashInnerBox, padding: 8, marginBottom: 6, fontSize: 10 }}>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>

              <strong style={{ color: DASH.text }}>{a.name}</strong>

              <label style={{ color: DASH.muted, fontSize: 9 }}>

                <input type="checkbox" checked={a.active} onChange={(e) => onToggle(a.id, e.target.checked)} /> Ativo

              </label>

            </div>

            {a.newMatches.length > 0 && (

              <p style={{ ...dashPlanAccent, margin: "4px 0 0", fontSize: 10 }}>

                {a.newMatches.length} novo(s) compatível(is)

              </p>

            )}

            <button type="button" onClick={() => onDelete(a.id)} style={{ background: "none", border: "none", color: "#dc3545", fontSize: 9, cursor: "pointer", marginTop: 4, padding: 0 }}>

              Excluir

            </button>

          </div>

        ))

      )}

    </div>

  );

}



export function TalentBankPanel({

  lists,

  onAddList,

  selectedListId,

  onSelectList,

}: {

  lists: TalentList[];

  onAddList: () => void;

  selectedListId: string;

  onSelectList: (id: string) => void;

}) {

  return (

    <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${DASH.border}` }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

        <h4 style={{ ...dashSectionTitle, margin: 0, fontSize: 12 }}>📁 Banco de talentos</h4>

        <button type="button" onClick={onAddList} style={{ ...btnGold, padding: "4px 8px", fontSize: 9 }}>+ Lista</button>

      </div>

      <select

        value={selectedListId}

        onChange={(e) => onSelectList(e.target.value)}

        style={{ ...dashInput, fontSize: 10, marginBottom: 6 }}

      >

        <option value="">Selecione uma lista</option>

        {lists.map((l) => (

          <option key={l.id} value={l.id}>{l.name} ({l.itemCount})</option>

        ))}

      </select>

      <p style={{ color: DASH.muted, fontSize: 9, margin: 0 }}>Use &quot;+ Lista&quot; nos perfis desbloqueados para organizar candidatos.</p>

    </div>

  );

}



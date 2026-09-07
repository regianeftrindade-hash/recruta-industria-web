"use client";



import React from "react";

import { btnGoldStyle as btnGold } from "@/lib/button-3d";

import { DASH, dashCard, dashInnerBox, dashLabel, dashPlanAccent, dashSectionTitle } from "@/lib/dashboard-theme";



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

  filters?: Record<string, string>;

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

        <div key={String(label)} data-card="1" className="dash-card" style={{ ...dashCard, padding: 10, textAlign: "center" }}>

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

  onOpenMatches,

}: {

  alerts: CompanyAlert[];

  onCreate: () => void;

  onToggle: (id: string, active: boolean) => void;

  onDelete: (id: string) => void;

  onOpenMatches?: (alert: CompanyAlert) => void;

}) {

  return (

    <div
      data-card="1"
      className="dash-card"
      style={{
        ...dashCard,
        padding: 12,
        marginTop: 14,
      }}
    >

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

        <h4 style={{ ...dashSectionTitle, color: DASH.gold, margin: 0, fontSize: 12 }}>🔔 Alertas de talentos</h4>

        <button type="button" onClick={onCreate} style={{ ...btnGold, padding: "4px 8px", fontSize: 9 }}>+ Novo</button>

      </div>

      {alerts.length === 0 ? (

        <p style={{ color: DASH.muted, fontSize: 10, margin: 0 }}>Nenhum alerta configurado.</p>

      ) : (

        alerts.map((a) => (

          <div key={a.id} style={{ ...dashInnerBox, padding: 8, marginBottom: 6, fontSize: 10 }}>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>

              <strong style={{ color: DASH.gold }}>{a.name}</strong>

              <label style={{ color: DASH.muted, fontSize: 9 }}>

                <input type="checkbox" checked={a.active} onChange={(e) => onToggle(a.id, e.target.checked)} /> Ativo

              </label>

            </div>

            <button

              type="button"

              onClick={() => onOpenMatches?.(a)}

              style={{

                ...dashPlanAccent,

                margin: "4px 0 0",

                padding: 0,

                fontSize: 10,

                fontWeight: 700,

                background: "none",

                border: "none",

                cursor: onOpenMatches ? "pointer" : "default",

                textDecoration: onOpenMatches ? "underline" : "none",

                textAlign: "left",

              }}

              title="Ver somente os profissionais compatíveis com as preferências"

            >

              {a.newMatches.length > 0

                ? `${a.newMatches.length} novo(s) compatível(is)`

                : "Ver profissionais compatíveis"}

            </button>

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

  onOpenList,

}: {

  lists: TalentList[];

  onAddList: () => void;

  selectedListId: string;

  onSelectList: (id: string) => void;

  onOpenList?: (list: TalentList) => void;

}) {

  return (

    <div
      data-card="1"
      className="dash-card"
      style={{
        ...dashCard,
        padding: 12,
        marginTop: 14,
      }}
    >

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>

        <h4 style={{ ...dashSectionTitle, color: DASH.gold, margin: 0, fontSize: 12 }}>📁 Banco de talentos</h4>

        <button type="button" onClick={onAddList} style={{ ...btnGold, padding: "4px 8px", fontSize: 9 }}>+ Lista</button>

      </div>

      {lists.length === 0 ? (

        <p style={{ color: DASH.muted, fontSize: 10, margin: 0 }}>Nenhuma lista criada.</p>

      ) : (

        lists.map((l) => {

          const selected = selectedListId === l.id;

          return (

            <div

              key={l.id}

              role="button"

              tabIndex={0}

              onClick={() => {
                onSelectList(l.id);
                onOpenList?.(l);
              }}

              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectList(l.id);
                  onOpenList?.(l);
                }
              }}

              style={{

                ...dashInnerBox,

                padding: 8,

                marginBottom: 6,

                fontSize: 10,

                cursor: "pointer",

                boxShadow: selected ? `inset 0 0 0 1px ${DASH.gold}` : undefined,

              }}

              title="Abrir perfis desta lista"

            >

              <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center" }}>

                <strong style={{ color: DASH.gold }}>{l.name}</strong>

                <span style={{ ...dashPlanAccent, fontSize: 10, fontWeight: 700 }}>

                  {l.itemCount} perfil(is)

                </span>

              </div>

              {selected && (

                <p style={{ color: DASH.muted, fontSize: 9, margin: "4px 0 0" }}>Lista selecionada para adicionar</p>

              )}

            </div>

          );

        })

      )}

      <p style={{ color: DASH.muted, fontSize: 9, margin: "6px 0 0" }}>

        Clique na lista para ver os perfis na vitrine. Para adicionar, abra o perfil do profissional.

      </p>

    </div>

  );

}



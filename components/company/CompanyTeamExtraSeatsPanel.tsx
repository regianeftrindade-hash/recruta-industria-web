"use client";

import React from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { PixQrCode } from "@/app/components/PixQrCode";
import { DASH, dashInnerBox } from "@/lib/dashboard-theme";

export type ExtraSeatPackage = {
  id: string;
  quantity: number;
  priceCentavos: number;
  priceLabel: string;
  title: string;
  emoji: string;
  period?: string;
};

export type ExtraSeatPayment = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  amount: number;
  quantity: number;
  priceLabel: string;
};

const FALLBACK_PACKAGES: ExtraSeatPackage[] = [
  {
    id: "pack1",
    quantity: 1,
    priceCentavos: 2990,
    priceLabel: "R$ 29,90",
    title: "1 usuário extra",
    emoji: "👤",
  },
  {
    id: "pack3",
    quantity: 3,
    priceCentavos: 7990,
    priceLabel: "R$ 79,90",
    title: "3 usuários extras",
    emoji: "👥",
  },
  {
    id: "pack5",
    quantity: 5,
    priceCentavos: 11990,
    priceLabel: "R$ 119,90",
    title: "5 usuários extras",
    emoji: "👥👥",
  },
];

export type CompanyTeamExtraSeatsPanelProps = {
  packages: ExtraSeatPackage[];
  selectedPackageId: string;
  selectedPack: ExtraSeatPackage | null;
  canBuyExtra: boolean;
  buyingExtra: boolean;
  error: string;
  atLimit: boolean;
  extraPayMsg: string;
  extraPayment: ExtraSeatPayment | null;
  onSelectPackage: (packageId: string) => void;
  onBuyPackage: () => void;
  onCancel: () => void;
};

export default function CompanyTeamExtraSeatsPanel({
  packages,
  selectedPackageId,
  selectedPack,
  canBuyExtra,
  buyingExtra,
  error,
  atLimit,
  extraPayMsg,
  extraPayment,
  onSelectPackage,
  onBuyPackage,
  onCancel,
}: CompanyTeamExtraSeatsPanelProps) {
  const packsToShow = packages.length > 0 ? packages : FALLBACK_PACKAGES;

  return (
    <div
      style={{
        ...dashInnerBox,
        padding: 16,
        display: "grid",
        gap: 12,
        border: `1px solid ${DASH.gold}`,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: DASH.gold }}>
        Sua empresa atingiu o limite do plano
      </p>
      <p style={{ margin: 0, fontSize: 12, color: DASH.text, lineHeight: 1.5 }}>
        Deseja adquirir usuários adicionais? Escolha um pacote:
      </p>

      {canBuyExtra ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
            }}
          >
            {packsToShow.map((pack) => {
              const selected = selectedPackageId === pack.id;
              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => onSelectPackage(pack.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px 12px",
                    borderRadius: 10,
                    border: `1px solid ${DASH.gold}`,
                    background: selected ? "rgba(200,155,60,0.2)" : DASH.inner,
                    color: DASH.text,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ display: "block", fontSize: 18, marginBottom: 4 }}>
                    {pack.emoji}
                  </span>
                  <strong style={{ color: DASH.gold, fontSize: 12 }}>{pack.title}</strong>
                  <span style={{ display: "block", fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                    {pack.priceLabel}
                    <span style={{ fontSize: 11, fontWeight: 500, color: DASH.muted }}>
                      /mês
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              disabled={buyingExtra || !selectedPack}
              onClick={onBuyPackage}
              style={{
                ...btnGold,
                padding: "10px 14px",
                fontSize: 12,
                opacity: buyingExtra ? 0.7 : 1,
              }}
            >
              {buyingExtra
                ? "Gerando Pix..."
                : selectedPack
                  ? `Comprar e adicionar (${selectedPack.priceLabel}/mês)`
                  : "Comprar e adicionar usuário"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: "transparent",
                border: `1px solid ${DASH.muted}`,
                color: DASH.muted,
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
          Contrate um plano pago (Basic ou superior) para adicionar usuários extras.
        </p>
      )}

      {error && atLimit ? (
        <p style={{ margin: 0, color: "#f87171", fontSize: 12 }}>{error}</p>
      ) : null}
      {extraPayMsg ? (
        <p style={{ margin: 0, fontSize: 12, color: "#4ade80" }}>{extraPayMsg}</p>
      ) : null}
      {extraPayment ? (
        <div style={{ display: "grid", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>
            Pague o Pix de {extraPayment.priceLabel} ({extraPayment.quantity}{" "}
            usuário{extraPayment.quantity > 1 ? "s" : ""}). Assim que confirmar, o limite
            sobe automaticamente.
          </p>
          {extraPayment.copyPasteKey ? (
            <PixQrCode
              qrCodeDataUrl={extraPayment.qrCodeDataUrl}
              copyPasteKey={extraPayment.copyPasteKey}
            />
          ) : null}
          {extraPayment.boletoUrl ? (
            <a
              href={extraPayment.boletoUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: DASH.gold, fontSize: 12 }}
            >
              Abrir boleto
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

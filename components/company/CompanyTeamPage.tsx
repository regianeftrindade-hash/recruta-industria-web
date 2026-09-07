"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { PixQrCode } from "@/app/components/PixQrCode";
import {
  DASH,
  dashCard,
  dashInnerBox,
  dashInput,
  dashLabel,
  dashSectionTitle,
} from "@/lib/dashboard-theme";
import { CompanyChatPanel } from "@/components/company/CompanyChatPanel";

type TeamMember = {
  id: string;
  invitedEmail: string;
  role: string;
  status: string;
  name: string | null;
  inviteToken: string | null;
  memberUserId: string | null;
};

type ExtraSeatPackage = {
  id: string;
  quantity: number;
  priceCentavos: number;
  priceLabel: string;
  title: string;
  emoji: string;
  period?: string;
};

type ExtraSeatPayment = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  amount: number;
  quantity: number;
  priceLabel: string;
};

/**
 * Estrutura: Empresa → Administrador Principal → Usuários da equipe (RH).
 * Admin adiciona, remove e troca usuários. Acima do limite: pacotes de usuários extras.
 */
export default function CompanyTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("RH");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [includedSeats, setIncludedSeats] = useState(1);
  const [extraSeats, setExtraSeats] = useState(0);
  const [maxUsers, setMaxUsers] = useState(1);
  const [planTier, setPlanTier] = useState("FREE");
  const [isOwner, setIsOwner] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [packages, setPackages] = useState<ExtraSeatPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("pack1");
  const [buyingExtra, setBuyingExtra] = useState(false);
  const [extraPayment, setExtraPayment] = useState<ExtraSeatPayment | null>(null);
  const [extraPayMsg, setExtraPayMsg] = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/team", { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erro ao carregar equipe.");
        return;
      }
      setMembers(data.members || []);
      setSeatsUsed(data.seatsUsed || 0);
      setIncludedSeats(data.includedSeats || data.maxUsers || 1);
      setExtraSeats(data.extraSeats || 0);
      setMaxUsers(data.maxUsers || 1);
      setPlanTier(data.planTier || "FREE");
      setIsOwner(data.isOwner === true || data.teamRole === "ADMIN");
      if (Array.isArray(data.extraSeatPackages) && data.extraSeatPackages.length > 0) {
        setPackages(data.extraSeatPackages);
        setSelectedPackageId((prev) =>
          data.extraSeatPackages.some((p: ExtraSeatPackage) => p.id === prev)
            ? prev
            : data.extraSeatPackages[0].id,
        );
      }
    } catch {
      setError("Erro de rede ao carregar equipe.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [load]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (atLimit && !replacingId) {
      setError("Sua empresa atingiu o limite do plano. Adquira um pacote de usuários extras abaixo.");
      return;
    }
    setSaving(true);
    setError("");
    setLastInviteUrl("");
    try {
      const body: Record<string, string> = { email, role };
      if (name.trim()) body.name = name.trim();
      if (replacingId) body.replaceMemberId = replacingId;

      const res = await fetch("/api/company/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error?.includes("Limite") || res.status === 403) {
          setError(
            data.error ||
              "Sua empresa atingiu o limite do plano. Deseja adquirir usuários adicionais?",
          );
        } else {
          setError(data.error || "Não foi possível convidar.");
        }
        return;
      }
      setEmail("");
      setName("");
      setReplacingId(null);
      setShowAddForm(false);
      if (data.inviteUrl) {
        setLastInviteUrl(data.inviteUrl);
        try {
          await navigator.clipboard.writeText(data.inviteUrl);
        } catch {
          /* ignore */
        }
      }
      await load();
    } catch {
      setError("Erro de rede ao convidar.");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (memberId: string) => {
    if (!window.confirm("Remover este usuário da equipe? O assento fica livre para outro e-mail.")) {
      return;
    }
    const res = await fetch(`/api/company/team?memberId=${encodeURIComponent(memberId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Erro ao remover.");
      return;
    }
    if (replacingId === memberId) setReplacingId(null);
    await load();
  };

  const startReplace = (memberId: string) => {
    setReplacingId(memberId);
    setShowAddForm(true);
    setName("");
    setEmail("");
    setError("");
    setLastInviteUrl("");
    setExtraPayment(null);
  };

  const openAddForm = () => {
    setReplacingId(null);
    setShowAddForm(true);
    setError("");
    setLastInviteUrl("");
    setExtraPayment(null);
    setExtraPayMsg("");
  };

  const pollExtraPayment = (chargeId: string) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    const tick = async () => {
      try {
        const res = await fetch(`/api/pagseguro/status?chargeId=${encodeURIComponent(chargeId)}`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => ({}));
        if (data.status === "PAID" || data.activated) {
          setExtraPayMsg("Usuário(s) extra(s) ativado(s). Você já pode cadastrar o novo membro.");
          setExtraPayment(null);
          setShowAddForm(true);
          await load();
          return;
        }
      } catch {
        /* ignore */
      }
      pollRef.current = setTimeout(() => void tick(), 3000);
    };
    void tick();
  };

  const handleBuyPackage = async (packageId?: string) => {
    const packId = packageId || selectedPackageId;
    setBuyingExtra(true);
    setExtraPayMsg("");
    setError("");
    try {
      const res = await fetch("/api/company/team/extra-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packageId: packId, method: "pix" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não foi possível iniciar o pagamento.");
        return;
      }
      setExtraPayment({
        chargeId: data.chargeId,
        copyPasteKey: data.copyPasteKey,
        qrCodeDataUrl: data.qrCodeDataUrl,
        boletoUrl: data.boletoUrl,
        amount: data.amount,
        quantity: data.quantity || 1,
        priceLabel: data.priceLabel || "R$ 29,90",
      });
      if (data.chargeId) pollExtraPayment(data.chargeId);
    } catch {
      setError("Erro de rede ao comprar usuários extras.");
    } finally {
      setBuyingExtra(false);
    }
  };

  const roleLabel = (memberRole: string) => {
    if (memberRole === "OWNER") return "Administrador Principal";
    if (memberRole === "ADMIN") return "Admin";
    if (memberRole === "RECRUITER") return "Recrutador";
    return "RH";
  };

  const canInvite = isOwner && seatsUsed < maxUsers;
  const atLimit = isOwner && seatsUsed >= maxUsers;
  const canBuyExtra = isOwner && planTier !== "FREE";
  const showLimitPanel = isOwner && atLimit && !replacingId;
  const selectedPack =
    packages.find((p) => p.id === selectedPackageId) || packages[0] || null;

  return (
    <main style={{ padding: "16px 24px" }}>
      <section className="dash-card" style={{ ...dashCard, padding: 16 }}>
        <h3 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>👥 Equipe RH</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: DASH.text, fontWeight: 700 }}>
          Usuários utilizados:{" "}
          <span style={{ color: DASH.gold }}>
            {loading ? "…" : `${seatsUsed}/${maxUsers}`}
          </span>
          {!loading ? (
            <span style={{ fontWeight: 500, color: DASH.muted, fontSize: 12 }}>
              {" "}
              · Plano {planTier}
              {extraSeats > 0
                ? ` (${includedSeats} inclusos + ${extraSeats} extra${extraSeats > 1 ? "s" : ""})`
                : ""}
            </span>
          ) : null}
        </p>

        {loading ? (
          <p style={{ color: DASH.muted, fontSize: 12 }}>Carregando...</p>
        ) : (
          <>
            <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
              {members.map((m) => (
                <div
                  key={m.id}
                  style={{
                    ...dashInnerBox,
                    border: `1px solid ${DASH.gold}`,
                    padding: "10px 12px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: DASH.gold }}>
                      {m.name || m.invitedEmail}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: DASH.muted }}>
                      {roleLabel(m.role)} · {m.invitedEmail} ·{" "}
                      {m.status === "PENDING" ? "Convite pendente" : "Ativo"}
                    </p>
                  </div>
                  {isOwner && m.role !== "OWNER" ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => startReplace(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: DASH.gold,
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 700,
                        }}
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRevoke(m.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {isOwner && !showAddForm && !replacingId ? (
              <button
                type="button"
                onClick={openAddForm}
                style={{ ...btnGold, padding: "8px 14px", fontSize: 13, marginBottom: 12 }}
              >
                ➕ Adicionar usuário
              </button>
            ) : null}

            {(showAddForm || replacingId) && isOwner ? (
              <form
                onSubmit={handleInvite}
                style={{ ...dashInnerBox, padding: 14, display: "grid", gap: 10, marginBottom: 12 }}
              >
                <p style={{ margin: 0, fontSize: 13, color: DASH.gold, fontWeight: 800 }}>
                  {replacingId ? "Trocar usuário" : "Adicionar novo usuário"}
                </p>
                {replacingId ? (
                  <p style={{ margin: 0, fontSize: 11, color: DASH.muted }}>
                    O usuário atual será removido e o assento fica com o novo e-mail. Não precisa
                    comprar outro plano.
                  </p>
                ) : null}
                <label>
                  <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>Nome</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    style={dashInput}
                  />
                </label>
                <label>
                  <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>E-mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@empresa.com.br"
                    style={dashInput}
                  />
                </label>
                <label>
                  <span style={{ ...dashLabel, display: "block", marginBottom: 4 }}>Função</span>
                  <select value={role} onChange={(e) => setRole(e.target.value)} style={dashInput}>
                    <option value="RH">RH</option>
                    <option value="RECRUITER">Recrutador</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
                {error ? <p style={{ margin: 0, color: "#f87171", fontSize: 12 }}>{error}</p> : null}

                {atLimit && !replacingId ? (
                  <p style={{ margin: 0, fontSize: 12, color: DASH.muted, lineHeight: 1.5 }}>
                    Sua empresa atingiu o limite do plano. Escolha um pacote abaixo para liberar
                    assentos e depois conclua o cadastro.
                  </p>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="submit"
                      disabled={saving || (!canInvite && !replacingId)}
                      style={{ ...btnGold, padding: "8px 12px", fontSize: 12 }}
                    >
                      {saving
                        ? "Salvando..."
                        : replacingId
                          ? "Confirmar troca"
                          : "Gerar convite"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setReplacingId(null);
                        setEmail("");
                        setName("");
                        setError("");
                      }}
                      style={{
                        background: "transparent",
                        border: `1px solid ${DASH.muted}`,
                        color: DASH.muted,
                        borderRadius: 6,
                        padding: "8px 12px",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {lastInviteUrl ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: DASH.muted,
                      lineHeight: 1.45,
                      wordBreak: "break-all",
                    }}
                  >
                    Link do convite (copiado): {lastInviteUrl}
                  </p>
                ) : null}
              </form>
            ) : null}

            {showLimitPanel && atLimit && !replacingId ? (
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
                      {(packages.length > 0
                        ? packages
                        : [
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
                          ]
                      ).map((pack) => {
                        const selected = selectedPackageId === pack.id;
                        return (
                          <button
                            key={pack.id}
                            type="button"
                            onClick={() => setSelectedPackageId(pack.id)}
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
                        onClick={() => void handleBuyPackage()}
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
                        onClick={() => {
                          setShowAddForm(false);
                          setExtraPayment(null);
                          setError("");
                        }}
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
            ) : null}

            {!isOwner ? (
              <p style={{ margin: 0, fontSize: 12, color: DASH.muted }}>
                Somente o Administrador Principal pode adicionar, remover ou trocar usuários.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="dash-card" style={{ ...dashCard, padding: 16, marginTop: 16 }}>
        <h3 style={{ ...dashSectionTitle, margin: "0 0 8px", fontSize: 15 }}>💬 Chat da equipe</h3>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: DASH.muted, lineHeight: 1.45 }}>
          Converse com colegas da mesma assinatura e veja perfis compartilhados com você.
        </p>
        <CompanyChatPanel />
      </section>
    </main>
  );
}

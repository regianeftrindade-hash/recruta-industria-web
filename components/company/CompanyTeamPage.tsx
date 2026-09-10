"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import {
  DASH,
  dashCard,
  dashInnerBox,
  dashSectionTitle,
} from "@/lib/dashboard-theme";
import { CompanyChatPanel } from "@/components/company/CompanyChatPanel";
import CompanyTeamInviteForm from "@/components/company/CompanyTeamInviteForm";
import CompanyTeamExtraSeatsPanel, {
  type ExtraSeatPackage,
  type ExtraSeatPayment,
} from "@/components/company/CompanyTeamExtraSeatsPanel";

type TeamMember = {
  id: string;
  invitedEmail: string;
  role: string;
  status: string;
  name: string | null;
  inviteToken: string | null;
  memberUserId: string | null;
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
      setError(data.error || "Erro ao remover.");
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
              <CompanyTeamInviteForm
                replacingId={replacingId}
                name={name}
                email={email}
                role={role}
                error={error}
                atLimit={atLimit}
                canInvite={canInvite}
                saving={saving}
                lastInviteUrl={lastInviteUrl}
                onNameChange={setName}
                onEmailChange={setEmail}
                onRoleChange={setRole}
                onSubmit={handleInvite}
                onCancel={() => {
                  setShowAddForm(false);
                  setReplacingId(null);
                  setEmail("");
                  setName("");
                  setError("");
                }}
              />
            ) : null}

            {showLimitPanel && atLimit && !replacingId ? (
              <CompanyTeamExtraSeatsPanel
                packages={packages}
                selectedPackageId={selectedPackageId}
                selectedPack={selectedPack}
                canBuyExtra={canBuyExtra}
                buyingExtra={buyingExtra}
                error={error}
                atLimit={atLimit}
                extraPayMsg={extraPayMsg}
                extraPayment={extraPayment}
                onSelectPackage={setSelectedPackageId}
                onBuyPackage={() => void handleBuyPackage()}
                onCancel={() => {
                  setShowAddForm(false);
                  setExtraPayment(null);
                  setError("");
                }}
              />
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

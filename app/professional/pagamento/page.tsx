"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PROFESSIONAL_PLAN_TIERS,
  type ProfessionalPlanTier,
} from "@/lib/professional-premium-plans";
import {
  formatPlanPriceLabel,
  type BillingMode,
  type BillingPeriod,
} from "@/lib/billing";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { PixQrCode } from "@/app/components/PixQrCode";
import { BillingOptions } from "@/app/components/BillingOptions";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";
import ResumeToolkit from "@/components/curriculum/ResumeToolkit";
import { professionalAccessState, professionalChargeNeedsSync } from "@/lib/professional/subscription-state";

type SubscriptionSnapshot = {
  isPremium: boolean;
  subscriptionExpiresAt: string | null;
  autoRenew: boolean;
  latestCharge: { status: string; reference: string; createdAt: string } | null;
};

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  recurring?: boolean;
};

export default function PagamentoProfissionalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
        Carregando...
      </div>
    }>
      <PagamentoProfissional />
    </Suspense>
  );
}

function PagamentoProfissional() {
  const router = useRouter();
  const { status } = useSession();
  const planDef = PROFESSIONAL_PLAN_TIERS.find((p) => p.id === "PREMIUM")!;

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [billingMode, setBillingMode] = useState<BillingMode>("one_time");
  const [method, setMethod] = useState<"pix" | "boleto">("pix");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [gatewayReady, setGatewayReady] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);
  const [subscriptionNote, setSubscriptionNote] = useState("");
  const [allowNewCharge, setAllowNewCharge] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const POLL_MAX = 30; // ~2 min a cada 4s

  const priceLabel = useMemo(
    () => formatPlanPriceLabel(planDef.precoCentavos, billingPeriod),
    [planDef.precoCentavos, billingPeriod],
  );
  const accessState = professionalAccessState({
    isPremium: Boolean(subscription?.isPremium),
    latestChargeStatus: subscription?.latestCharge?.status,
  });
  const needsSync = professionalChargeNeedsSync({
    isPremium: Boolean(subscription?.isPremium),
    latestChargeStatus: subscription?.latestCharge?.status,
  });
  const accessLabel = accessState === "active"
    ? "Premium ativo"
    : accessState === "pending"
      ? "Pagamento pendente"
      : accessState === "declined"
        ? "Pagamento recusado ou não concluído"
        : accessState === "canceled"
          ? "Pagamento cancelado ou não concluído"
          : "Gratuito";
  const showCheckout = subscription !== null && !subscription.isPremium && (
    accessState === "free"
    || accessState === "declined"
    || accessState === "canceled"
    || allowNewCharge
  );

  useEffect(() => {
    void fetch("/api/payment/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const ready = Boolean(data?.professionalPlansEnabled);
        setGatewayReady(ready);
        if (!ready && data?.professionalMessage) {
          setStatusMessage(String(data.professionalMessage));
        }
      })
      .catch(() => setGatewayReady(false));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?tipo=profissional&redirect=%2Fprofessional%2Fpagamento");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let ativo = true;
    void fetch("/api/professional/subscription", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ativo) return;
        if (!data) {
          setSubscriptionNote("Não foi possível consultar a assinatura. O Premium só é ativado depois da confirmação do pagamento.");
          setSubscription({ isPremium: false, subscriptionExpiresAt: null, autoRenew: false, latestCharge: null });
          return;
        }
        setSubscription({
          isPremium: Boolean(data.isPremium),
          subscriptionExpiresAt: data.subscriptionExpiresAt ?? null,
          autoRenew: Boolean(data.autoRenew),
          latestCharge: data.latestCharge ?? null,
        });
      })
      .catch(() => {
        if (!ativo) return;
        setSubscriptionNote("Não foi possível consultar a assinatura. O Premium só é ativado depois da confirmação do pagamento.");
        setSubscription({ isPremium: false, subscriptionExpiresAt: null, autoRenew: false, latestCharge: null });
      });
    return () => {
      ativo = false;
    };
  }, [status]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const activatePlan = async (chargeId: string) => {
    const res = await fetch("/api/professional/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planTier: "PREMIUM" as ProfessionalPlanTier, chargeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao ativar plano");
    return data;
  };

  const finishSuccess = async (chargeId: string, alreadyActivated = false) => {
    try {
      if (!alreadyActivated) {
        await activatePlan(chargeId);
      }
      router.push("/professional/dashboard");
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : "Erro ao ativar plano");
      setProcessing(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const checkPaymentStatus = async (chargeId: string, opts?: { fromButton?: boolean; isBoleto?: boolean }) => {
    try {
      if (opts?.fromButton) {
        setStatusMessage("Verificando pagamento...");
      }
      const res = await fetch(`/api/pagseguro/status?chargeId=${chargeId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.status === "PAID") {
        setStatusMessage("✅ Pagamento confirmado! Ativando Premium...");
        stopPolling();
        setTimeout(() => finishSuccess(chargeId, Boolean(data.activated)), 1500);
        return "paid" as const;
      }
      if (["DECLINED", "CANCELED"].includes(data?.status)) {
        setStatusMessage("❌ Pagamento não aprovado.");
        stopPolling();
        setProcessing(false);
        return "failed" as const;
      }
      if (opts?.fromButton) {
        setStatusMessage(
          opts.isBoleto
            ? "Ainda não confirmado. Boleto pode levar até 1–2 dias úteis — pode sair; ativamos o plano quando cair."
            : "Ainda não confirmado. Se já pagou o Pix, aguarde alguns segundos e tente de novo.",
        );
      }
      return "pending" as const;
    } catch {
      stopPolling();
      setStatusMessage("Erro ao verificar pagamento.");
      setProcessing(false);
      return "error" as const;
    }
  };

  const startPolling = (chargeId: string, isBoleto: boolean) => {
    stopPolling();
    pollCountRef.current = 0;
    setStatusMessage(
      isBoleto
        ? "Aguardando confirmação do boleto. Você pode sair desta página — ativamos o plano quando o pagamento cair."
        : "Aguardando confirmação do pagamento...",
    );
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const result = await checkPaymentStatus(chargeId, { isBoleto });
      if (result !== "pending") return;
      if (pollCountRef.current >= POLL_MAX) {
        stopPolling();
        setStatusMessage(
          isBoleto
            ? "Ainda aguardando o boleto. Pode fechar esta página; quando o pagamento for confirmado, o Premium é ativado automaticamente. Use “Verificar agora” se quiser checar de novo."
            : "Ainda não vimos a confirmação do Pix. Use “Verificar agora” ou escolha outra forma de pagamento.",
        );
      }
    }, 4000);
  };

  const resetPaymentForm = () => {
    stopPolling();
    setPaymentData(null);
    setProcessing(false);
    setStatusMessage("");
    pollCountRef.current = 0;
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setStatusMessage("Gerando cobrança...");
    try {
      const payMethod = billingMode === "one_time" ? method : "boleto";
      const res = await fetch("/api/professional/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planTier: "PREMIUM",
          billingPeriod,
          billingMode,
          method: payMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProcessing(false);
        const friendly =
          /ASAAS_|PAGSEGURO_|PAGBANK_|TOKEN|API_KEY|\.env|Vercel/i.test(
            `${data?.error || ""} ${data?.detail || ""}`,
          )
            ? "Pagamento temporariamente indisponível. Tente novamente em alguns minutos ou fale com o suporte."
            : data?.error || "Não foi possível gerar a cobrança.";
        setStatusMessage(
          process.env.NODE_ENV === "development" && data?.detail
            ? `${friendly} (${data.detail})`
            : friendly,
        );
        return;
      }

      setPaymentData(data);
      setStatusMessage("");
      const isBoleto = Boolean(data.boletoUrl) && !data.copyPasteKey;
      if (data.chargeId) startPolling(data.chargeId, isBoleto || payMethod === "boleto");
    } catch {
      setProcessing(false);
      setStatusMessage("Erro na cobrança. Tente novamente.");
    }
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#F3E6C8", color: "#414141", padding: "32px 20px", overflow: "hidden" }}>
      <AuthAtmosphere />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.push("/professional/dashboard")}
          style={{ ...btnGold, padding: "8px 14px", fontSize: 12, marginBottom: 20 }}
        >
          ← Voltar ao painel
        </button>

        <p style={{ color: "#C89B3C", margin: "0 0 8px", fontWeight: 800, letterSpacing: "0.04em", lineHeight: 1.3 }}>
          DEIXE QUE O RECRUTA FAZ POR VOCÊ.
        </p>
        <p style={{ color: "rgba(242,242,242,0.92)", margin: "0 0 20px", lineHeight: 1.5, maxWidth: 640 }}>
          Ganhe tempo nas candidaturas, descubra empresas interessadas no seu perfil e encontre oportunidades alinhadas à sua experiência.
        </p>
        <h1 style={{ color: "#C89B3C", margin: "0 0 8px" }}>
          {planDef.emoji} Assinar plano {planDef.nome}
        </h1>
        <p style={{ color: "rgba(242,242,242,0.82)", margin: "0 0 12px", lineHeight: 1.5 }}>{planDef.descricao}</p>
        <p style={{ color: "rgba(242,242,242,0.92)", margin: "0 0 24px", lineHeight: 1.5 }}>
          Situação da assinatura: <strong>{subscription ? accessLabel : "Consultando..."}</strong>
          {subscription?.isPremium && subscription.subscriptionExpiresAt
            ? ` até ${new Date(subscription.subscriptionExpiresAt).toLocaleDateString("pt-BR")}.`
            : "."}
          {subscription?.isPremium && subscription.autoRenew
            ? " A renovação segue a assinatura registrada no gateway. O acesso acompanha o estado confirmado dessa cobrança."
            : ""}
          {accessState === "pending"
            ? " O Premium não é ativado enquanto o pagamento estiver pendente."
            : ""}
          {accessState === "declined" || accessState === "canceled"
            ? " O plano continua gratuito. Você pode tentar a contratação de novo."
            : ""}
          {accessState === "free" && subscription
            ? " O plano gratuito continua com perfil, currículo, busca de vagas e candidatura manual."
            : ""}
          {needsSync
            ? " A última cobrança consta como paga no registro local, mas o Premium ainda não está ativo. Use Verificar agora para consultar o gateway."
            : ""}
        </p>
        {subscriptionNote ? (
          <p style={{ color: "#E8C56A", margin: "0 0 16px", fontSize: 13, lineHeight: 1.45 }}>{subscriptionNote}</p>
        ) : null}

        {gatewayReady === false && (
          <div style={{ background: "#E8D5A3", border: "2px solid #8D6B1F", borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: "#C89B3C" }}>Pagamento em configuração.</strong>{" "}
            Cobranças reais ainda não estão disponíveis neste ambiente. Tente mais tarde ou fale com o suporte.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div style={{ background: "#E8D5A3", border: "1px solid rgba(200,155,60,0.7)", borderRadius: 16, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
            <p style={{ color: "#C89B3C", fontWeight: "bold", fontSize: 28, margin: "0 0 4px" }}>
              {priceLabel.price}<span style={{ fontSize: 14, color: "var(--dash-text, #414141)" }}>{priceLabel.period}</span>
            </p>
            {priceLabel.savings && (
              <p style={{ color: "#8D6B1F", fontSize: 11, margin: "0 0 12px" }}>{priceLabel.savings}</p>
            )}
            <p style={{ color: "var(--dash-text, #414141)", fontSize: 12, margin: "0 0 16px" }}>Inclui:</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
              {planDef.inclui.map((item) => <li key={item}>✅ {item}</li>)}
            </ul>
          </div>

          <div style={{ background: "#E8D5A3", border: "1px solid rgba(200,155,60,0.7)", borderRadius: 16, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
            {!paymentData && subscription === null ? (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>Consultando a assinatura...</p>
            ) : !paymentData && !showCheckout ? (
              <div>
                <h2 style={{ color: "#C89B3C", margin: "0 0 12px", fontSize: 16 }}>{accessLabel}</h2>
                <p style={{ margin: "0 0 16px", fontSize: 13, lineHeight: 1.5 }}>
                  {subscription?.isPremium
                    ? "O Premium desta conta já está ativo. Não é necessário pagar de novo."
                    : needsSync
                      ? "A confirmação local ainda precisa ser conferida no gateway antes de liberar o Premium."
                      : "A cobrança ainda não está confirmada. O botão de contratação fica disponível só para uma nova tentativa, depois que você escolher gerar outra cobrança."}
                </p>
                {subscription?.latestCharge?.reference && !subscription.isPremium ? (
                  <button
                    type="button"
                    onClick={() => void checkPaymentStatus(subscription.latestCharge!.reference, { fromButton: true })}
                    style={{ ...btnGold, width: "100%", padding: 12, fontSize: 13, marginBottom: 8 }}
                  >
                    Verificar agora
                  </button>
                ) : null}
                {!subscription?.isPremium ? (
                  <button
                    type="button"
                    onClick={() => setAllowNewCharge(true)}
                    style={{ ...btnGold, width: "100%", padding: 12, fontSize: 13 }}
                  >
                    Gerar outra cobrança
                  </button>
                ) : null}
              </div>
            ) : !paymentData ? (
              <>
                <h2 style={{ color: "#C89B3C", margin: "0 0 16px", fontSize: 16 }}>Pagamento</h2>

                <BillingOptions
                  billingPeriod={billingPeriod}
                  billingMode={billingMode}
                  onPeriodChange={setBillingPeriod}
                  onModeChange={setBillingMode}
                  recurringSupported={false}
                />

                {billingMode === "one_time" && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {(
                      [
                        { id: "pix" as const, label: "Pix" },
                        { id: "boleto" as const, label: "Boleto" },
                      ]
                    ).map((m) => {
                      const active = method === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          aria-pressed={active}
                          style={{
                            ...btnGold,
                            flex: 1,
                            padding: "12px 10px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            color: "#414141",
                            border: "2px solid #8D6B1F",
                            borderRadius: 12,
                            background: active ? "#D4AF37" : "#E8C56A",
                            boxShadow: active
                              ? "inset 0 2px 4px rgba(0,0,0,0.45), 0 1px 0 rgba(0,0,0,0.2)"
                              : btnGold.boxShadow,
                            transform: active ? "translateY(1px)" : "none",
                          }}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <ResumeToolkit variant="checkout" />

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={processing}
                  style={{ ...btnGold, width: "100%", padding: 14, fontSize: 14, opacity: processing ? 0.7 : 1 }}
                >
                  {processing ? "Processando..." : "Assinar Premium"}
                </button>
                {statusMessage && (
                  <p style={{ color: "#C89B3C", fontSize: 12, marginTop: 12 }}>{statusMessage}</p>
                )}
              </>
            ) : (
              <div>
                <h2 style={{ color: "#C89B3C", fontSize: 16, marginBottom: 16 }}>
                  {paymentData.recurring ? "Finalize sua assinatura" : "Finalize o pagamento"}
                </h2>
                {paymentData.copyPasteKey && (
                  <PixQrCode
                    copyPasteKey={paymentData.copyPasteKey}
                    qrCodeDataUrl={paymentData.qrCodeDataUrl}
                    expiresAt={paymentData.expiresAt}
                  />
                )}
                {paymentData.boletoUrl && (
                  <a href={paymentData.boletoUrl} target="_blank" rel="noreferrer" style={{ color: "#C89B3C", display: "block", marginTop: 12 }}>
                    Abrir boleto {paymentData.recurring ? "da assinatura" : ""}
                  </a>
                )}
                {paymentData.checkoutUrl && !paymentData.boletoUrl && (
                  <a href={paymentData.checkoutUrl} target="_blank" rel="noreferrer" style={{ color: "#C89B3C", display: "block", marginTop: 12 }}>
                    Abrir checkout
                  </a>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() =>
                      void checkPaymentStatus(paymentData.chargeId, {
                        fromButton: true,
                        isBoleto: Boolean(paymentData.boletoUrl) && !paymentData.copyPasteKey,
                      })
                    }
                    style={{ ...btnGold, width: "100%", padding: 12, fontSize: 13 }}
                  >
                    Verificar agora
                  </button>
                  <button
                    type="button"
                    onClick={resetPaymentForm}
                    style={{ ...btnGold, width: "100%", padding: 12, fontSize: 13 }}
                  >
                    Voltar e escolher outra forma
                  </button>
                </div>
                {statusMessage && <p style={{ fontSize: 12, marginTop: 12, color: "#C89B3C", lineHeight: 1.45 }}>{statusMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

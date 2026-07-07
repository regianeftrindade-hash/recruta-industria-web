"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  COMPANY_PLAN_TIERS,
  type CompanyPlanTier,
} from "@/lib/company-premium-plans";
import {
  formatPlanPriceLabel,
  type BillingMode,
  type BillingPeriod,
} from "@/lib/billing";
import { btnGoldStyle as btnGold } from "@/lib/button-3d";
import { PixQrCode } from "@/app/components/PixQrCode";
import { BillingOptions } from "@/app/components/BillingOptions";

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  checkoutUrl?: string;
  expiresAt?: string;
  recurring?: boolean;
};

export default function PagamentoEmpresaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#F2F2F2" }}>
        Carregando...
      </div>
    }>
      <PagamentoEmpresa />
    </Suspense>
  );
}

function PagamentoEmpresa() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const planParam = (searchParams.get("plan") || "BASIC").toUpperCase() as CompanyPlanTier;
  const planDef = COMPANY_PLAN_TIERS.find((p) => p.id === planParam) ?? COMPANY_PLAN_TIERS[1];

  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [billingMode, setBillingMode] = useState<BillingMode>("recurring");
  const [method, setMethod] = useState<"pix" | "boleto">("pix");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [gatewayReady, setGatewayReady] = useState<boolean | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const priceLabel = useMemo(
    () => formatPlanPriceLabel(planDef.precoCentavos, billingPeriod),
    [planDef.precoCentavos, billingPeriod],
  );

  useEffect(() => {
    void fetch("/api/payment/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const configured = Boolean(data?.configured);
        const valid = Boolean(data?.tokenValid);
        setGatewayReady(configured && valid);
        if (configured && !valid && data?.tokenMessage) {
          setStatusMessage(data.tokenMessage);
        }
      })
      .catch(() => setGatewayReady(false));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      const returnPath = `/company/pagamento?plan=${planParam}`;
      router.push(`/login?tipo=empresa&redirect=${encodeURIComponent(returnPath)}`);
    }
  }, [status, router, planParam]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const activatePlan = async (chargeId: string) => {
    const res = await fetch("/api/company/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ planTier: planDef.id, chargeId }),
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
      router.push("/company/dashboard-empresa");
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : "Erro ao ativar plano");
      setProcessing(false);
    }
  };

  const startPolling = (chargeId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStatusMessage("Aguardando confirmação do pagamento...");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagseguro/status?chargeId=${chargeId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data?.status === "PAID") {
          setStatusMessage("✅ Pagamento confirmado! Ativando plano...");
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => finishSuccess(chargeId, Boolean(data.activated)), 1500);
        } else if (["DECLINED", "CANCELED"].includes(data?.status)) {
          setStatusMessage("❌ Pagamento não aprovado.");
          if (pollRef.current) clearInterval(pollRef.current);
          setProcessing(false);
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatusMessage("Erro ao verificar pagamento.");
        setProcessing(false);
      }
    }, 4000);
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setStatusMessage("Gerando cobrança...");
    try {
      const res = await fetch("/api/company/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planTier: planDef.id,
          billingPeriod,
          billingMode,
          method: billingMode === "one_time" ? method : "boleto",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProcessing(false);
        setStatusMessage(
          data?.detail
            ? `${data.error || "Erro no gateway"}: ${data.detail}`
            : data?.error || "Não foi possível gerar a cobrança.",
        );
        return;
      }

      setPaymentData(data);
      setStatusMessage("");
      if (data.chargeId) startPolling(data.chargeId);
    } catch {
      setProcessing(false);
      setStatusMessage("Erro na cobrança. Tente novamente.");
    }
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#F2F2F2" }}>
        Carregando...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#F2F2F2", padding: "32px 20px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.push("/company/dashboard-empresa")}
          style={{ background: "transparent", border: "1px solid #8D6B1F", color: "#F2F2F2", borderRadius: 6, padding: "8px 14px", cursor: "pointer", marginBottom: 20, fontSize: 12 }}
        >
          ← Voltar ao dashboard
        </button>

        <h1 style={{ color: "#C89B3C", margin: "0 0 8px" }}>
          {planDef.emoji} Assinar plano {planDef.nome}
        </h1>
        <p style={{ color: "#aaa", margin: "0 0 24px" }}>{planDef.descricao}</p>

        {gatewayReady === false && (
          <div style={{ background: "#1a1508", border: "1px solid #8D6B1F", borderRadius: 8, padding: 14, marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
            <strong style={{ color: "#C89B3C" }}>Pagamentos em modo sandbox.</strong>{" "}
            Configure <code style={{ color: "#F2F2F2" }}>PAGSEGURO_TOKEN</code> no <code style={{ color: "#F2F2F2" }}>.env.local</code>.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div style={{ background: "#111", border: "1px solid #8D6B1F", borderRadius: 12, padding: 20 }}>
            <p style={{ color: "#C89B3C", fontWeight: "bold", fontSize: 28, margin: "0 0 4px" }}>
              {priceLabel.price}<span style={{ fontSize: 14, color: "#aaa" }}>{priceLabel.period}</span>
            </p>
            {priceLabel.savings && (
              <p style={{ color: "#8D6B1F", fontSize: 11, margin: "0 0 12px" }}>{priceLabel.savings}</p>
            )}
            <p style={{ color: "#aaa", fontSize: 12, margin: "0 0 16px" }}>Inclui:</p>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
              {planDef.inclui.map((item) => <li key={item}>✅ {item}</li>)}
            </ul>
            {planDef.limites && (
              <>
                <p style={{ color: "#C89B3C", fontSize: 12, margin: "16px 0 8px" }}>Limites:</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.7 }}>
                  {planDef.limites.map((item) => <li key={item}>⚠️ {item}</li>)}
                </ul>
              </>
            )}
          </div>

          <div style={{ background: "#111", border: "1px solid #8D6B1F", borderRadius: 12, padding: 20 }}>
            {!paymentData ? (
              <>
                <h2 style={{ color: "#C89B3C", margin: "0 0 16px", fontSize: 16 }}>Pagamento</h2>

                <BillingOptions
                  billingPeriod={billingPeriod}
                  billingMode={billingMode}
                  onPeriodChange={setBillingPeriod}
                  onModeChange={setBillingMode}
                />

                {billingMode === "one_time" && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {(["pix", "boleto"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 6,
                          border: method === m ? "2px solid #C89B3C" : "1px solid #8D6B1F",
                          background: method === m ? "#C89B3C" : "#000",
                          color: method === m ? "#000" : "#F2F2F2",
                          cursor: "pointer",
                          fontSize: 11,
                          textTransform: "uppercase",
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={processing}
                  style={{ ...btnGold, width: "100%", padding: 14, fontSize: 14, opacity: processing ? 0.7 : 1 }}
                >
                  {processing
                    ? "Processando..."
                    : billingMode === "recurring"
                      ? `Assinar ${priceLabel.price}${priceLabel.period}`
                      : `Pagar ${priceLabel.price}`}
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
                {statusMessage && <p style={{ fontSize: 12, marginTop: 12, color: "#C89B3C" }}>{statusMessage}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

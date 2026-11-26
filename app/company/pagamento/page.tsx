"use client";

import { fillMessage } from "@/lib/i18n/fill";
import { t } from "@/lib/i18n/translate";
import { exactUi } from "@/lib/i18n/exact-ui";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  COMPANY_PLAN_TIERS,
  type CompanyPlanTier,
} from "@/lib/company-premium-plans";
import {
  formatPlanPriceLabel,
  formatStripePlanPriceLabel,
  type BillingMode,
  type BillingPeriod,
} from "@/lib/billing";
import { btnGoldStyle as btnGold, BUTTON_3D_GOLD_SHADOW, BUTTON_3D_GOLD_SHADOW_ACTIVE, goldButton3DStyle } from "@/lib/button-3d";
import { PixQrCode } from "@/app/components/PixQrCode";
import { BillingOptions } from "@/app/components/BillingOptions";
import { AuthAtmosphere } from "@/components/shared/AuthAtmosphere";

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  checkoutUrl?: string;
  sessionId?: string;
  expiresAt?: string;
  recurring?: boolean;
  provider?: string;
  adaptivePricing?: boolean;
  referenceCurrency?: string;
};

export default function PagamentoEmpresaPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>{exactUi("Carregando...")}</div>
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
  const [billingMode, setBillingMode] = useState<BillingMode>("one_time");
  const [method, setMethod] = useState<"pix" | "boleto">("pix");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [gatewayReady, setGatewayReady] = useState<boolean | null>(null);
  const [recurringSupported, setRecurringSupported] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const POLL_MAX = 30;

  const [useStripe, setUseStripe] = useState(false);
  const [stripeMonthlyReady, setStripeMonthlyReady] = useState(false);
  const [stripeAnnualReady, setStripeAnnualReady] = useState(false);
  const [referenceCurrency, setReferenceCurrency] = useState("USD");

  const priceLabel = useMemo(
    () =>
      useStripe
        ? formatStripePlanPriceLabel(planDef.id, billingPeriod)
        : formatPlanPriceLabel(planDef.precoCentavos, billingPeriod),
    [useStripe, planDef.id, planDef.precoCentavos, billingPeriod],
  );

  useEffect(() => {
    void fetch("/api/payment/config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setGatewayReady(false);
          return;
        }
        const stripeIntl =
          data?.resolvedProvider === "stripe" ||
          (Boolean(data?.stripeEnabled) &&
            Boolean(data?.internationalCheckoutReady) &&
            data?.billingCountry &&
            data.billingCountry !== "BR");
        setUseStripe(Boolean(stripeIntl));
        setStripeMonthlyReady(Boolean(data?.internationalCheckoutReady));
        setStripeAnnualReady(Boolean(data?.internationalAnnualReady));
        if (data?.referenceCurrency) setReferenceCurrency(String(data.referenceCurrency));

        if (stripeIntl) {
          setRecurringSupported(true);
          setBillingMode("recurring");
          setGatewayReady(Boolean(data?.internationalCheckoutReady));
        } else {
          const configured = Boolean(data?.configured);
          const plansOk = Boolean(data?.companyPlansEnabled ?? data?.tokenValid);
          const valid = Boolean(data?.tokenValid ?? data?.companyPlansEnabled);
          setGatewayReady(configured && (valid || plansOk));
          const recurring = Boolean(data?.recurringSupported);
          setRecurringSupported(recurring);
          if (!recurring) setBillingMode("one_time");
          if (configured && data?.tokenValid === false && data?.tokenMessage) {
            setStatusMessage(data.tokenMessage);
          }
        }
      })
      .catch(() => setGatewayReady(false));
  }, [status]);

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
    if (!res.ok) throw new Error(data.error || t("pay.status.activatePlanError"));
    return data;
  };

  const finishSuccess = async (chargeId: string, alreadyActivated = false) => {
    try {
      if (!alreadyActivated) {
        await activatePlan(chargeId);
      }
      router.push("/company/dashboard-empresa");
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : t("pay.status.activatePlanError"));
      setProcessing(false);
    }
  };

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const ref = searchParams.get("ref");
    if (canceled === "1") {
      setStatusMessage(t("pay.status.checkoutCanceled"));
      return;
    }
    if (success === "1" && ref) {
      setStatusMessage(t("pay.status.receivedConfirming"));
      void finishSuccess(ref, false).catch(() => {
        setStatusMessage(t("pay.status.webhookActivationPending"));
        setProcessing(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const checkPaymentStatus = async (chargeId: string, opts?: { fromButton?: boolean; isBoleto?: boolean }) => {
    try {
      if (opts?.fromButton) {
        setStatusMessage(t("pay.status.verifying"));
      }
      const res = await fetch(`/api/pagseguro/status?chargeId=${chargeId}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.status === "PAID") {
        setStatusMessage(t("pay.status.confirmedActivatingPlan"));
        stopPolling();
        setTimeout(() => finishSuccess(chargeId, Boolean(data.activated)), 1500);
        return "paid" as const;
      }
      if (["DECLINED", "CANCELED"].includes(data?.status)) {
        setStatusMessage(t("pay.status.notApproved"));
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
      setStatusMessage(t("pay.status.verifyPaymentError"));
      setProcessing(false);
      return "error" as const;
    }
  };

  const startPolling = (chargeId: string, isBoleto: boolean) => {
    stopPolling();
    pollCountRef.current = 0;
    setStatusMessage(
      isBoleto
        ? t("pay.status.waitingBoletoLeave")
        : t("pay.status.waitingPayment"),
    );
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const result = await checkPaymentStatus(chargeId, { isBoleto });
      if (result !== "pending") return;
      if (pollCountRef.current >= POLL_MAX) {
        stopPolling();
        setStatusMessage(
          isBoleto
            ? t("pay.status.stillWaitingBoletoPlan")
            : t("pay.status.stillWaitingPix"),
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
    setStatusMessage(t("pay.status.generatingCharge"));
    try {
      if (useStripe && billingPeriod === "annual" && !stripeAnnualReady) {
        setProcessing(false);
        setStatusMessage(t("pay.status.annualIntlUnavailable"));
        return;
      }
      const payMethod =
        useStripe
          ? "card"
          : recurringSupported && billingMode === "recurring"
            ? "boleto"
            : method;
      const res = await fetch("/api/company/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planTier: planDef.id,
          billingPeriod,
          billingMode: useStripe ? "recurring" : recurringSupported ? billingMode : "one_time",
          method: payMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setProcessing(false);
        const friendly =
          /ASAAS_|PAGSEGURO_|PAGBANK_|TOKEN|API_KEY|\.env|Vercel|STRIPE_/i.test(
            `${data?.error || ""} ${data?.detail || ""}`,
          )
            ? t("pay.status.temporarilyUnavailable")
            : data?.error || t("pay.status.couldNotCreateCharge");
        setStatusMessage(
          process.env.NODE_ENV === "development" && data?.detail
            ? `${friendly} (${data.detail})`
            : friendly,
        );
        return;
      }

      if (data.provider === "stripe" && data.checkoutUrl) {
        setStatusMessage(t("ui.redirectingSecureCheckout"));
        window.location.href = data.checkoutUrl;
        return;
      }

      setPaymentData(data);
      setStatusMessage("");
      const isBoleto = Boolean(data.boletoUrl) && !data.copyPasteKey;
      if (data.chargeId) startPolling(data.chargeId, isBoleto || payMethod === "boleto");
    } catch {
      setProcessing(false);
      setStatusMessage(t("pay.status.chargeError"));
    }
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3E6C8", color: "#414141" }}>{exactUi("Carregando...")}</div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#F3E6C8", color: "#414141", padding: "32px 20px", overflow: "hidden" }}>
      <AuthAtmosphere />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => router.push("/company/dashboard-empresa")}
          style={{ ...btnGold, padding: "8px 14px", fontSize: 12, marginBottom: 20 }}
        >
          ← Voltar ao dashboard
        </button>

        <h1 style={{ color: "#C89B3C", margin: "0 0 8px" }}>
          {fillMessage(t("pay.cta.subscribePlan"), { emoji: planDef.emoji, name: planDef.nome })}
        </h1>
        <p style={{ color: "rgba(242,242,242,0.82)", margin: "0 0 24px", lineHeight: 1.5 }}>{planDef.descricao}</p>

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
            <p style={{ color: "var(--dash-text, #414141)", fontSize: 12, margin: "0 0 16px" }}>{exactUi("Inclui:")}</p>
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

          <div style={{ background: "#E8D5A3", border: "1px solid rgba(200,155,60,0.7)", borderRadius: 16, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,0.45)" }}>
            {!paymentData ? (
              <>
                <h2 style={{ color: "#C89B3C", margin: "0 0 16px", fontSize: 16 }}>{exactUi("Pagamento")}</h2>

                <BillingOptions
                  billingPeriod={billingPeriod}
                  billingMode={useStripe ? "recurring" : billingMode}
                  onPeriodChange={setBillingPeriod}
                  onModeChange={setBillingMode}
                  recurringSupported={useStripe ? false : recurringSupported}
                />

                {useStripe && (
                  <p style={{ color: "var(--dash-text, #414141)", fontSize: 12, margin: "0 0 16px", lineHeight: 1.45 }}>
                    International checkout via Stripe (card). Reference prices in {referenceCurrency}.
                    {stripeAnnualReady
                      ? " Monthly and annual plans available."
                      : " Annual plan still being configured — use monthly."}
                    {" "}
                    Local currency may appear at Stripe Checkout when Adaptive Pricing is available for your account; otherwise payment stays in USD.
                  </p>
                )}

                {!useStripe && (billingMode === "one_time" || !recurringSupported) && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: "var(--dash-text, #414141)", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>
                      {recurringSupported ? "3. Forma de pagamento" : "2. Forma de pagamento"}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
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
                              ...goldButton3DStyle,
                              flex: 1,
                              padding: "12px 10px",
                              fontSize: 14,
                              fontWeight: 700,
                              cursor: "pointer",
                              color: "#414141",
                              border: "2px solid #8D6B1F",
                              borderRadius: 12,
                              background: active ? "#D4AF37" : "#E8C56A",
                              boxShadow: active ? BUTTON_3D_GOLD_SHADOW_ACTIVE : BUTTON_3D_GOLD_SHADOW,
                              transform: active ? "translateY(1px)" : "none",
                            }}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={processing || gatewayReady === false}
                  style={{ ...btnGold, width: "100%", padding: 14, fontSize: 15, fontWeight: 700, opacity: processing ? 0.7 : 1 }}
                >
                  {processing
                    ? useStripe
                      ? t("ui.openingCheckout")
                      : t("pay.status.generatingCharge")
                    : useStripe
                      ? fillMessage(t("pay.cta.payCard"), { price: priceLabel.price, period: priceLabel.period })
                      : billingMode === "recurring" && recurringSupported
                        ? fillMessage(t("pay.cta.subscribe"), { price: priceLabel.price, period: priceLabel.period })
                        : method === "pix"
                          ? fillMessage(t("pay.cta.generatePix"), { price: priceLabel.price })
                          : fillMessage(t("pay.cta.generateBoleto"), { price: priceLabel.price })}
                </button>
                {statusMessage && (
                  <p style={{ color: "#C89B3C", fontSize: 12, marginTop: 12, lineHeight: 1.45 }}>{statusMessage}</p>
                )}
              </>
            ) : (
              <div>
                <h2 style={{ color: "#C89B3C", fontSize: 16, marginBottom: 16 }}>
                  {paymentData.recurring ? "Finalize sua assinatura" : "Finalize o pagamento"}
                </h2>
                {paymentData.copyPasteKey ? (
                  <PixQrCode
                    copyPasteKey={paymentData.copyPasteKey}
                    qrCodeDataUrl={paymentData.qrCodeDataUrl}
                    expiresAt={paymentData.expiresAt}
                  />
                ) : (
                  <p style={{ color: "var(--dash-text, #414141)", fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
                    O QR Code Pix não ficou disponível. Tente de novo ou use Boleto.
                  </p>
                )}
                {paymentData.boletoUrl && (
                  <a href={paymentData.boletoUrl} target="_blank" rel="noreferrer" style={{ color: "#C89B3C", display: "block", marginTop: 12, fontWeight: 700 }}>
                    Abrir boleto {paymentData.recurring ? "da assinatura" : ""}
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
                  >{exactUi("Voltar e escolher outra forma")}</button>
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

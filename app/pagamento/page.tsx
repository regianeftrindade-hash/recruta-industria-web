"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PixQrCode } from "@/app/components/PixQrCode";

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  boletoUrl?: string;
  line?: string;
  checkoutUrl?: string;
  expiresAt?: string;
};

const COLORS = {
  preto: "#3A3A3A",
  cardBg: "#2B2B2B",
  tinta: "#000000",
  dourado: "#C89B3C",
  douradoEscuro: "#8D6B1F",
  branco: "#F2F2F2",
  textoSuave: "#F2F2F2",
};

const BTN_GOLD: React.CSSProperties = {
  background: "linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)",
  color: COLORS.tinta,
  border: "1px solid #6b5218",
  borderRadius: 8,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow:
    "inset 0 1px 0 rgba(255, 228, 150, 0.55), inset 0 -2px 0 rgba(74, 50, 12, 0.42), 0 3px 0 #5a4512, 0 4px 10px rgba(0, 0, 0, 0.45)",
};

export default function Pagamento() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<"card" | "pix" | "boleto">("pix");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const clearPoll = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => clearPoll(), []);

  const finishSuccess = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isPremium", "true");
    }
    router.push("/professional/dashboard");
  };

  const startPolling = (chargeId: string) => {
    clearPoll();
    setStatusMessage("Aguardando confirmação do Pix...");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagseguro/status?chargeId=${chargeId}`);
        const data = await res.json();
        const status = data?.status as string;

        if (status === "PAID") {
          setStatusMessage("Pagamento confirmado. Liberando Premium...");
          clearPoll();
          finishSuccess();
        } else if (["DECLINED", "CANCELED"].includes(status)) {
          setStatusMessage("Pagamento não aprovado. Tente novamente.");
          clearPoll();
          setProcessing(false);
        }
      } catch (error) {
        clearPoll();
        setStatusMessage("Erro ao verificar status. Tente de novo.");
        setProcessing(false);
      }
    }, 4000);
  };

  const handlePixCheckout = async () => {
    if (!nome || !email) {
      setStatusMessage("Preencha nome e e-mail.");
      return;
    }

    try {
      setProcessing(true);
      setStatusMessage("Gerando cobrança Pix...");

      const res = await fetch("/api/pagseguro/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: { name: nome, email }, amount: 1990, method }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        setProcessing(false);
        setStatusMessage(data?.error || "Erro ao gerar Pix.");
        return;
      }

      setPaymentData({
        chargeId: data.chargeId || data.id,
        copyPasteKey: data.copyPasteKey,
        qrCodeDataUrl: data.qrCodeDataUrl,
        boletoUrl: data.boletoUrl,
        line: data.line,
        checkoutUrl: data.checkoutUrl,
        expiresAt: data.expiresAt,
      });

      setStatusMessage(method === 'pix' ? 'Pix gerado. Pague e aguardamos confirmação...' : method === 'boleto' ? 'Boleto gerado. Aguardando pagamento...' : 'Checkout criado.');
      startPolling((data.chargeId || data.id) as string);
      setProcessing(false);
    } catch (error) {
      setProcessing(false);
      setStatusMessage("Erro inesperado ao iniciar o pagamento.");
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.preto, padding: '30px', color: COLORS.branco }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div style={{ background: COLORS.cardBg, borderRadius: '16px', padding: '28px', boxShadow: '0 15px 45px rgba(0,0,0,0.5)', border: `2px solid ${COLORS.dourado}` }}>
          <span style={{ display: 'inline-block', fontWeight: 900, color: COLORS.dourado, background: 'rgba(200, 155, 60, 0.15)', padding: '8px 14px', borderRadius: '999px', marginBottom: '12px', fontSize: '12px', border: `1px solid ${COLORS.douradoEscuro}` }}>PREMIUM PROFISSIONAL</span>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: COLORS.dourado }}>Plano completo do profissional</h1>
          <p style={{ margin: '0 0 18px 0', color: COLORS.textoSuave, lineHeight: 1.6 }}>Acesse todas as funcionalidades do site, desbloqueie dicas premium, histórico de visitas e visibilidade ampliada para empresas.</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', color: COLORS.textoSuave }}>R$</span>
            <span style={{ fontSize: '48px', fontWeight: 900, color: COLORS.branco }}>19,90</span>
            <span style={{ fontSize: '16px', color: COLORS.textoSuave }}>/mês</span>
          </div>

          <div style={{ display: 'grid', gap: '10px', marginBottom: '22px' }}>
            {[
              'Todas as funcionalidades do site liberadas',
              'Veja quais empresas viram seu perfil e todas as duicas para o teu perfil',
              'Dicas premium sem bloqueio',
              'Histórico de visitas detalhado',
              'Perfil em destaque para empresas',
              'Suporte prioritário'
            ].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(200, 155, 60, 0.08)', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${COLORS.douradoEscuro}` }}>
                <span style={{ color: COLORS.branco, fontWeight: 'bold' }}>✓</span>
                <span style={{ color: COLORS.branco, fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ ...BTN_GOLD, borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 20px rgba(200, 155, 60, 0.25)' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '16px' }}>Garantia de 7 dias</div>
              <div style={{ fontSize: '13px', opacity: 0.85 }}>Cancele dentro de 7 dias e tenha reembolso integral.</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: '14px' }}>🔒 Checkout seguro</div>
          </div>
        </div>

        <div style={{ background: COLORS.cardBg, borderRadius: '16px', padding: '24px', boxShadow: '0 15px 45px rgba(0,0,0,0.5)', border: `2px solid ${COLORS.douradoEscuro}` }}>
          <h2 style={{ margin: '0 0 12px 0', color: COLORS.dourado, fontSize: '20px' }}>Pagamento</h2>
          <p style={{ margin: '0 0 18px 0', color: COLORS.textoSuave, fontSize: '14px' }}>Escolha o método e conclua a assinatura Premium.</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setMethod('card')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: method === 'card' ? '2px solid #C89B3C' : '1px solid #8D6B1F', background: method === 'card' ? 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)' : 'linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)', fontWeight: 800, color: method === 'card' ? '#000' : '#F2F2F2', cursor: 'pointer' }}
            >Cartão</button>
            <button
              type="button"
              onClick={() => setMethod('pix')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: method === 'pix' ? '2px solid #C89B3C' : '1px solid #8D6B1F', background: method === 'pix' ? 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)' : 'linear-gradient(180deg, #5a4512 0%, #7a5f1c 45%, #8D6B1F 100%)', fontWeight: 800, color: method === 'pix' ? '#000' : '#F2F2F2', cursor: 'pointer' }}
            >Pix</button>
          </div>

          {method === "card" ? (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ background: "rgba(200, 155, 60, 0.12)", border: `1px solid ${COLORS.douradoEscuro}`, borderRadius: "10px", padding: "12px", color: COLORS.branco, fontWeight: 700 }}>
                Cartão ficará disponível em breve. Use Pix para concluir agora.
              </div>
              <button
                type="button"
                onClick={() => setMethod("pix")}
                style={{ ...BTN_GOLD, padding: "12px", borderRadius: "10px", border: "none", fontWeight: 800, cursor: "pointer" }}
              >
                Ir para Pix
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label htmlFor="nome" style={{ display: "block", fontWeight: 700, marginBottom: "6px", color: COLORS.dourado }}>Nome completo</label>
                <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${COLORS.douradoEscuro}`, fontSize: "14px", background: COLORS.preto, color: COLORS.branco }} />
              </div>
              <div>
                <label htmlFor="email" style={{ display: "block", fontWeight: 700, marginBottom: "6px", color: COLORS.dourado }}>E-mail</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: `1px solid ${COLORS.douradoEscuro}`, fontSize: "14px", background: COLORS.preto, color: COLORS.branco }} />
              </div>

              {paymentData ? (
                method === 'pix' ? (
                  <div style={{ background: COLORS.preto, border: `1px solid ${COLORS.douradoEscuro}`, borderRadius: "12px", padding: "16px", maxWidth: "320px", margin: "0 auto" }}>
                    {paymentData.copyPasteKey && (
                      <PixQrCode
                        copyPasteKey={paymentData.copyPasteKey}
                        qrCodeDataUrl={paymentData.qrCodeDataUrl}
                        expiresAt={paymentData.expiresAt}
                      />
                    )}
                  </div>
                ) : method === 'boleto' ? (
                  <div style={{ background: COLORS.preto, border: `1px solid ${COLORS.douradoEscuro}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: COLORS.branco, marginBottom: "6px" }}>Boleto gerado</div>
                    {paymentData.line && <div style={{ marginBottom: '8px', fontWeight: 700, color: COLORS.branco }}>{paymentData.line}</div>}
                    {paymentData.boletoUrl && <a href={paymentData.boletoUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.branco }}>Abrir boleto</a>}
                    {paymentData.expiresAt && (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: COLORS.textoSuave }}>Válido até: {new Date(paymentData.expiresAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: COLORS.preto, border: `1px solid ${COLORS.douradoEscuro}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: COLORS.branco, marginBottom: "6px" }}>Checkout</div>
                    {paymentData.checkoutUrl && <a href={paymentData.checkoutUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.branco }}>Abrir checkout</a>}
                  </div>
                )
              ) : null}

              <button
                type="button"
                onClick={handlePixCheckout}
                disabled={processing}
                style={{ ...BTN_GOLD, fontWeight: 900, padding: "14px", borderRadius: "12px", border: "none", fontSize: "16px", cursor: processing ? "not-allowed" : "pointer", boxShadow: "0 10px 25px rgba(200, 155, 60, 0.25)", opacity: processing ? 0.6 : 1 }}
              >
                {processing ? "Processando..." : paymentData ? (method === 'pix' ? 'Regerar Pix' : method === 'boleto' ? 'Regerar Boleto' : 'Abrir Checkout') : (method === 'pix' ? 'Gerar Pix com PagSeguro' : method === 'boleto' ? 'Gerar Boleto' : 'Iniciar Checkout')}
              </button>

              {statusMessage && (
                <div style={{ background: "rgba(200, 155, 60, 0.12)", border: `1px solid ${COLORS.douradoEscuro}`, borderRadius: "10px", padding: "10px", color: COLORS.branco, fontWeight: 700 }}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '12px', color: COLORS.textoSuave, textAlign: 'center', marginTop: '12px' }}>
            Você terá acesso a todas as funcionalidades do site após a confirmação do pagamento.
          </div>
        </div>
      </div>
    </div>
  );
}

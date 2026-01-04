"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  boletoUrl?: string;
  line?: string;
  checkoutUrl?: string;
  expiresAt?: string;
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #001f3f 0%, #0a3c7d 100%)', padding: '30px', color: '#0b1b2b', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', border: '4px solid #ffc107' }}>
          <span style={{ display: 'inline-block', fontWeight: 900, color: '#0a3c7d', background: '#fff6d6', padding: '8px 14px', borderRadius: '999px', marginBottom: '12px', fontSize: '12px', letterSpacing: '0.6px' }}>PREMIUM PROFISSIONAL</span>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0a3c7d' }}>Plano completo do profissional</h1>
          <p style={{ margin: '0 0 18px 0', color: '#355070', lineHeight: 1.6 }}>Acesse todas as funcionalidades do site, desbloqueie dicas premium, histórico de visitas e visibilidade ampliada para empresas.</p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', color: '#5f6472' }}>R$</span>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#0a3c7d' }}>19,90</span>
            <span style={{ fontSize: '16px', color: '#5f6472' }}>/mês</span>
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
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f7fbff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5eef7' }}>
                <span style={{ color: '#0a3c7d', fontWeight: 'bold' }}>✓</span>
                <span style={{ color: '#1f2d3d', fontWeight: 600 }}>{item}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#0a3c7d', color: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 20px rgba(10,60,125,0.25)' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: '16px' }}>Garantia de 7 dias</div>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>Cancele dentro de 7 dias e tenha reembolso integral.</div>
            </div>
            <div style={{ fontWeight: 900, fontSize: '14px' }}>🔒 Checkout seguro</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 15px 45px rgba(0,0,0,0.15)', border: '3px solid #0a3c7d' }}>
          <h2 style={{ margin: '0 0 12px 0', color: '#0a3c7d', fontSize: '20px' }}>Pagamento</h2>
          <p style={{ margin: '0 0 18px 0', color: '#4a5568', fontSize: '14px' }}>Escolha o método e conclua a assinatura Premium.</p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setMethod('card')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: method === 'card' ? '2px solid #0a3c7d' : '1px solid #d9e2ec', background: method === 'card' ? '#e8f1ff' : 'white', fontWeight: 800, color: '#0a3c7d', cursor: 'pointer' }}
            >Cartão</button>
            <button
              type="button"
              onClick={() => setMethod('pix')}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: method === 'pix' ? '2px solid #0a3c7d' : '1px solid #d9e2ec', background: method === 'pix' ? '#e8f1ff' : 'white', fontWeight: 800, color: '#0a3c7d', cursor: 'pointer' }}
            >Pix</button>
          </div>

          {method === "card" ? (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ background: "#fff6d6", border: "1px solid #f3d27a", borderRadius: "10px", padding: "12px", color: "#7a5b00", fontWeight: 700 }}>
                Cartão ficará disponível em breve. Use Pix para concluir agora.
              </div>
              <button
                type="button"
                onClick={() => setMethod("pix")}
                style={{ background: "#0a3c7d", color: "white", padding: "12px", borderRadius: "10px", border: "none", fontWeight: 800, cursor: "pointer" }}
              >
                Ir para Pix
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label htmlFor="nome" style={{ display: "block", fontWeight: 700, marginBottom: "6px", color: "#0a3c7d" }}>Nome completo</label>
                <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d9e2ec", fontSize: "14px" }} />
              </div>
              <div>
                <label htmlFor="email" style={{ display: "block", fontWeight: 700, marginBottom: "6px", color: "#0a3c7d" }}>E-mail</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #d9e2ec", fontSize: "14px" }} />
              </div>

              {paymentData ? (
                method === 'pix' ? (
                  <div style={{ background: "#f7fbff", border: "1px solid #d9e2ec", borderRadius: "12px", padding: "16px", textAlign: "center", maxWidth: "300px", margin: "0 auto" }}>
                    <div style={{ fontWeight: 800, color: "#0a3c7d", marginBottom: "6px" }}>Pague com Pix</div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentData.copyPasteKey || '')}`}
                      alt="QR Code Pix"
                      style={{ width: "100%", maxWidth: "180px", height: "auto", margin: "0 auto", display: "block", aspectRatio: "1", objectFit: "contain" }}
                    />
                    <div style={{ marginTop: "8px", fontSize: "13px", color: "#0a3c7d", wordBreak: "break-all" }}>{paymentData.copyPasteKey}</div>
                    {paymentData.expiresAt && (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#4a5568" }}>Válido até: {new Date(paymentData.expiresAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : method === 'boleto' ? (
                  <div style={{ background: "#f7fbff", border: "1px solid #d9e2ec", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: "#0a3c7d", marginBottom: "6px" }}>Boleto gerado</div>
                    {paymentData.line && <div style={{ marginBottom: '8px', fontWeight: 700 }}>{paymentData.line}</div>}
                    {paymentData.boletoUrl && <a href={paymentData.boletoUrl} target="_blank" rel="noreferrer" style={{ color: '#0a3c7d' }}>Abrir boleto</a>}
                    {paymentData.expiresAt && (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#4a5568" }}>Válido até: {new Date(paymentData.expiresAt).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: "#f7fbff", border: "1px solid #d9e2ec", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontWeight: 800, color: "#0a3c7d", marginBottom: "6px" }}>Checkout</div>
                    {paymentData.checkoutUrl && <a href={paymentData.checkoutUrl} target="_blank" rel="noreferrer">Abrir checkout</a>}
                  </div>
                )
              ) : null}

              <button
                type="button"
                onClick={handlePixCheckout}
                disabled={processing}
                style={{ backgroundColor: "#0a3c7d", color: "white", fontWeight: 900, padding: "14px", borderRadius: "12px", border: "none", fontSize: "16px", cursor: processing ? "not-allowed" : "pointer", boxShadow: "0 10px 25px rgba(10,60,125,0.25)" }}
              >
                {processing ? "Processando..." : paymentData ? (method === 'pix' ? 'Regerar Pix' : method === 'boleto' ? 'Regerar Boleto' : 'Abrir Checkout') : (method === 'pix' ? 'Gerar Pix com PagSeguro' : method === 'boleto' ? 'Gerar Boleto' : 'Iniciar Checkout')}
              </button>

              {statusMessage && (
                <div style={{ background: "#f1f5f9", border: "1px solid #d9e2ec", borderRadius: "10px", padding: "10px", color: "#0a3c7d", fontWeight: 700 }}>
                  {statusMessage}
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', marginTop: '12px' }}>
            Você terá acesso a todas as funcionalidades do site após a confirmação do pagamento.
          </div>
        </div>
      </div>
    </div>
  );
}

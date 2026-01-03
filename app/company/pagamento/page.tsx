"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type PaymentData = {
  chargeId: string;
  copyPasteKey?: string;
  boletoUrl?: string;
  line?: string;
  checkoutUrl?: string;
  expiresAt?: string;
};

export default function PagamentoEmpresa() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [method, setMethod] = useState<"pix" | "boleto" | "card">("pix");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [plano, setPlano] = useState<"mensal" | "anual">("mensal");
  const [processing, setProcessing] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
    router.push("/company/dashboard");
  };

  const startPolling = (chargeId: string) => {
    clearPoll();
    setStatusMessage("Aguardando confirmação do pagamento...");
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/pagseguro/status?chargeId=${chargeId}`);
        const data = await res.json();
        const status = data?.status as string;

        if (status === "PAID") {
          setStatusMessage("✅ Pagamento confirmado! Ativando plano Premium...");
          clearPoll();
          setTimeout(() => finishSuccess(), 2000);
        } else if (["DECLINED", "CANCELED"].includes(status)) {
          setStatusMessage("❌ Pagamento não aprovado. Tente novamente.");
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

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      setStatusMessage("Gerando cobrança...");

      const amount = plano === "mensal" ? 5990 : 64782;

      const res = await fetch("/api/pagseguro/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { 
            name: session?.user?.name || "Empresa", 
            email: session?.user?.email || "contato@empresa.com" 
          },
          amount: amount,
          method: method,
          description: plano === "mensal" ? "Plano Premium Empresa - Mensal" : "Plano Premium Empresa - Anual"
        }),
      });

      if (!res.ok) throw new Error("Erro na requisição");

      const data = await res.json();
      setPaymentData(data);
      setStatusMessage("");

      if (data.chargeId) {
        startPolling(data.chargeId);
      }

      setProcessing(false);
    } catch (error) {
      setStatusMessage("❌ Erro ao gerar pagamento. Tente novamente.");
      setProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentData(null);
    setStatusMessage("");
    clearPoll();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMessage("✅ Copiado para a área de transferência!");
    setTimeout(() => setStatusMessage(""), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", padding: "40px 20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "40px", alignItems: "start" }}>
        
        {/* LEFT COLUMN - BENEFITS */}
        <div>
          <h1 style={{ color: "#001f3f", fontSize: "32px", marginBottom: "10px" }}>⭐ PREMIUM EMPRESA</h1>
          <p style={{ color: "#666", fontSize: "16px", marginBottom: "30px" }}>Desbloqueie todos os recursos premium para sua empresa</p>

          {/* Benefits List */}
          <div style={{ background: "linear-gradient(135deg, #001f3f 0%, #003d66 100%)", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 31, 63, 0.3)", marginBottom: "20px", border: "3px solid #28a745" }}>
            <h3 style={{ color: "#fff", marginBottom: "20px", fontSize: "18px" }}>✓ Benefícios Inclusos:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {[
                "📊 Painel analítico avançado",
                "👥 Acesso a 1000+ candidatos",
                "📧 Mensagens ilimitadas",
                "🎯 Filtros de busca avançados",
                "📱 Aplicativo mobile premium",
                "📈 Relatórios detalhados",
                "⭐ Perfil destacado",
                "🔐 Suporte prioritário 24/7",
                "🚀 Acesso a funcionalidades futuras"
              ].map((benefit, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "15px", color: "#fff" }}>
                  <span style={{ color: "#28a745", fontSize: "18px" }}>✓</span>
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Renewal Info */}
          <div style={{ background: "#e8f4f8", padding: "20px", borderRadius: "12px", border: "2px solid #0066cc", fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#001f3f" }}>ℹ️ Informações Importantes</h4>
            <ul style={{ margin: 0, paddingLeft: "20px" }}>
              <li>Renovação automática mensalmente</li>
              <li>Cancelamento a qualquer momento sem penalidades</li>
              <li>Sem taxas ocultas ou contratos longos</li>
              <li>Acesso imediato após confirmação</li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN - PAYMENT */}
        <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          
          {!paymentData ? (
            <>
              <h2 style={{ color: "#001f3f", marginTop: 0, marginBottom: "20px" }}>Pagamento</h2>

              {/* Plan Selection */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#001f3f", fontSize: "14px" }}>Escolha o plano:</label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => setPlano("mensal")}
                    style={{
                      flex: 1,
                      padding: "15px",
                      border: plano === "mensal" ? "3px solid #28a745" : "2px solid #ddd",
                      background: plano === "mensal" ? "#f0f9f6" : "#fff",
                      cursor: "pointer",
                      borderRadius: "8px",
                      fontWeight: plano === "mensal" ? "bold" : "normal",
                      color: "#001f3f",
                      fontSize: "14px"
                    }}
                  >
                    📅 Mensal<br /><span style={{ fontSize: "16px", color: "#28a745" }}>R$ 59,90</span>
                  </button>
                  <button
                    onClick={() => setPlano("anual")}
                    style={{
                      flex: 1,
                      padding: "15px",
                      border: plano === "anual" ? "3px solid #28a745" : "2px solid #ddd",
                      background: plano === "anual" ? "#f0f9f6" : "#fff",
                      cursor: "pointer",
                      borderRadius: "8px",
                      fontWeight: plano === "anual" ? "bold" : "normal",
                      color: "#001f3f",
                      fontSize: "14px"
                    }}
                  >
                    📆 Anual<br /><span style={{ fontSize: "16px", color: "#28a745" }}>R$ 538,92</span>
                    <br /><span style={{ fontSize: "11px", color: "#28a745" }}>-10%</span>
                  </button>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#001f3f", fontSize: "14px" }}>Método de pagamento:</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {["pix", "card", "boleto"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m as "pix" | "boleto" | "card")}
                      style={{
                        flex: "1 1 calc(33% - 7px)",
                        padding: "12px",
                        border: method === m ? "3px solid #0066cc" : "2px solid #ddd",
                        background: method === m ? "#e8f4f8" : "#fff",
                        cursor: "pointer",
                        borderRadius: "8px",
                        fontWeight: method === m ? "bold" : "normal",
                        color: "#001f3f",
                        fontSize: "13px"
                      }}
                    >
                      {m === "pix" ? "💳 PIX" : m === "card" ? "💰 CARTÃO" : "📄 BOLETO"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Button */}
              <button
                onClick={handleCheckout}
                disabled={processing}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: processing ? "#999" : "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "15px",
                  fontWeight: "bold",
                  cursor: processing ? "not-allowed" : "pointer",
                  marginBottom: "15px"
                }}
              >
                {processing ? "⏳ Gerando..." : `✓ Gerar ${method === "pix" ? "PIX" : method === "card" ? "CARTÃO" : "BOLETO"}`}
              </button>

              {/* Status Message */}
              {statusMessage && (
                <div style={{
                  padding: "12px",
                  background: statusMessage.includes("❌") ? "#fee" : statusMessage.includes("✅") ? "#efe" : "#eef",
                  color: statusMessage.includes("❌") ? "#c33" : statusMessage.includes("✅") ? "#3c3" : "#33c",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "13px"
                }}>
                  {statusMessage}
                </div>
              )}
            </>
          ) : (
            <>
              <h2 style={{ color: "#001f3f", marginTop: 0, marginBottom: "25px", textAlign: "center" }}>
                {method === "pix" ? "💳 Pagamento PIX" : method === "card" ? "💰 Cartão de Crédito" : "📄 Boleto Bancário"}
              </h2>

              {/* PIX */}
              {method === "pix" && (
                <div>
                  {paymentData.copyPasteKey && (
                    <>
                      {/* QR Code */}
                      <div style={{ textAlign: "center", marginBottom: "20px" }}>
                        <div style={{
                          backgroundColor: "#fff",
                          padding: "15px",
                          borderRadius: "8px",
                          border: "3px solid #ffc107",
                          display: "inline-block",
                          boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                        }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentData.copyPasteKey)}`}
                            alt="QR Code PIX"
                            style={{ width: "220px", height: "220px", display: "block" }}
                            onError={(e) => {
                              e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='white'/%3E%3Crect x='10' y='10' width='30' height='30' fill='black'/%3E%3Crect x='20' y='20' width='10' height='10' fill='white'/%3E%3Crect x='60' y='10' width='30' height='30' fill='black'/%3E%3Crect x='70' y='20' width='10' height='10' fill='white'/%3E%3Crect x='10' y='60' width='30' height='30' fill='black'/%3E%3Crect x='20' y='70' width='10' height='10' fill='white'/%3E%3C/svg%3E`;
                            }}
                          />
                        </div>
                        <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: "#999" }}>QR Code PIX</p>
                      </div>
                      
                      {/* Chave PIX */}
                      <div style={{
                        background: "#fff3cd",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "2px solid #ffc107",
                        textAlign: "center"
                      }}>
                        <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#333", fontWeight: "bold" }}>📋 Chave PIX (Copia e Cola)</p>
                        <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "6px", border: "1px solid #ddd", marginBottom: "15px" }}>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "12px", wordBreak: "break-all", color: "#001f3f", fontWeight: "bold" }}>
                            {paymentData.copyPasteKey}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentData.copyPasteKey || "")}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "#ffc107",
                            color: "#333",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "13px"
                          }}
                        >
                          📋 Copiar Chave
                        </button>
                      </div>
                      <p style={{ margin: "15px 0 0 0", fontSize: "12px", color: "#28a745", fontWeight: "bold", textAlign: "center" }}>✓ Após o pagamento, você será redirecionado automaticamente</p>
                    </>
                  )}
                </div>
              )}

              {/* BOLETO */}
              {method === "boleto" && (
                <div>
                  {paymentData.line && (
                    <>
                      <div style={{
                        background: "#fff3cd",
                        padding: "20px",
                        borderRadius: "8px",
                        marginBottom: "20px",
                        border: "2px solid #ff6600",
                        textAlign: "center"
                      }}>
                        <p style={{ margin: "0 0 15px 0", fontSize: "12px", color: "#333", fontWeight: "bold" }}>Código de Barras</p>
                        
                        {/* Visual Barcode */}
                        <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", marginBottom: "15px", display: "flex", justifyContent: "center", gap: "0.5px", alignItems: "flex-end", height: "50px", border: "1px solid #ddd" }}>
                          {paymentData.line.split("").map((char, i) => (
                            <div key={i} style={{ width: Math.random() > 0.6 ? "3px" : "2px", height: Math.random() > 0.7 ? "40px" : "35px", backgroundColor: "#000" }} />
                          ))}
                        </div>

                        <div style={{ backgroundColor: "#f0f0f0", padding: "12px", borderRadius: "6px", marginBottom: "15px", border: "2px solid #333" }}>
                          <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#666", fontWeight: "bold" }}>Número do Boleto (Digitar ou Copiar)</p>
                          <p style={{ margin: 0, fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", color: "#001f3f", wordBreak: "break-all", letterSpacing: "1px" }}>
                            {paymentData.line}
                          </p>
                        </div>

                        <button
                          onClick={() => copyToClipboard(paymentData.line || "")}
                          style={{
                            width: "100%",
                            padding: "10px",
                            background: "#ff6600",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "13px",
                            marginBottom: "10px"
                          }}
                        >
                          📋 Copiar Código
                        </button>

                        {paymentData.boletoUrl && (
                          <a
                            href={paymentData.boletoUrl}
                            download
                            style={{
                              display: "inline-block",
                              width: "100%",
                              padding: "10px",
                              background: "#001f3f",
                              color: "white",
                              textDecoration: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "bold",
                              fontSize: "13px",
                              textAlign: "center",
                              boxSizing: "border-box"
                            }}
                          >
                            📄 Baixar Boleto
                          </a>
                        )}
                      </div>
                      <p style={{ margin: "15px 0 0 0", fontSize: "12px", color: "#28a745", fontWeight: "bold", textAlign: "center" }}>✓ Confirmação automática após o pagamento</p>
                    </>
                  )}
                </div>
              )}

              {/* CARTÃO */}
              {method === "card" && (
                <div>
                  <div style={{
                    background: "#f0f0f0",
                    padding: "20px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    border: "2px solid #0066cc"
                  }}>
                    <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#001f3f" }}>💳 Dados do Cartão de Crédito</h4>
                    
                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold", color: "#001f3f" }}>Número do Cartão</label>
                      <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} style={{ width: "100%", padding: "10px", border: "2px solid #0066cc", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ marginBottom: "15px" }}>
                      <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold", color: "#001f3f" }}>Nome do Titular</label>
                      <input type="text" placeholder="Nome completo" style={{ width: "100%", padding: "10px", border: "2px solid #0066cc", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold", color: "#001f3f" }}>Validade</label>
                        <input type="text" placeholder="MM/AA" maxLength={5} style={{ width: "100%", padding: "10px", border: "2px solid #0066cc", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", marginBottom: "5px", fontSize: "12px", fontWeight: "bold", color: "#001f3f" }}>CVV</label>
                        <input type="password" placeholder="000" maxLength={4} style={{ width: "100%", padding: "10px", border: "2px solid #0066cc", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", outline: "none" }} />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      fontSize: "14px",
                      cursor: "pointer",
                      marginBottom: "15px"
                    }}
                  >
                    ✓ Confirmar Pagamento
                  </button>
                  <p style={{ margin: "15px 0 0 0", fontSize: "12px", color: "#28a745", fontWeight: "bold", textAlign: "center" }}>✓ Confirmação automática após o pagamento</p>
                </div>
              )}

              {/* Status Message */}
              {statusMessage && (
                <div style={{
                  padding: "12px",
                  background: statusMessage.includes("❌") ? "#fee" : statusMessage.includes("✅") ? "#efe" : "#eef",
                  color: statusMessage.includes("❌") ? "#c33" : statusMessage.includes("✅") ? "#3c3" : "#33c",
                  borderRadius: "6px",
                  textAlign: "center",
                  fontSize: "13px",
                  marginTop: "15px"
                }}>
                  {statusMessage}
                </div>
              )}

              {/* Reset Button */}
              <button
                onClick={resetPayment}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginTop: "20px",
                  background: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "13px"
                }}
              >
                🔄 Gerar Outro Pagamento
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

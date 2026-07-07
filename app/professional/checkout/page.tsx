/**
 * ⚠️ PÁGINA BLOQUEADA - NÃO MODIFICAR
 * 
 * Esta página foi bloqueada para manter a estabilidade do sistema de pagamento
 * e checkout. Alterações podem impactar a lógica de transações e processamento
 * de pedidos.
 * 
 * Se necessário alterar, consulte o desenvolvedor principal.
 * Veja: PROFESSIONAL_CHECKOUT_LOCK.md
 */

"use client";

import React, { useState } from 'react';
// ...existing code...
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// ...existing code...

function CheckoutPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('credit');
  const [cardData, setCardData] = useState({
    number: '',
    holder: '',
    validity: '',
    cvv: ''
  });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'premium',
          email: session?.user?.email,
          amount: 19.90,
          paymentMethod: selectedPaymentMethod,
          cardData: selectedPaymentMethod === 'credit' ? cardData : null
        })
      });

      if (response.ok) {
        // Redirecionar para painel com sucesso de upgrade
        router.push('/professional/dashboard');
      } else {
        const errorText = await response.text();
        console.error('Resposta não-JSON:', errorText);
        alert('Erro ao processar pagamento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', color: '#F2F2F2' }}>
      <div style={{ backgroundColor: '#111111', color: '#F2F2F2', borderBottom: '1px solid #8D6B1F', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>Checkout</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#F2F2F2' }}>Finalize seu upgrade para Premium</p>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#111111', padding: '30px', borderRadius: '12px', border: '1px solid #8D6B1F', boxShadow: '0 2px 8px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
          <h2 style={{ color: '#C89B3C', marginTop: 0 }}>Resumo do Pedido</h2>

          <div style={{ borderBottom: '2px solid #8D6B1F', paddingBottom: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span style={{ fontSize: '16px', color: '#F2F2F2' }}>Plano Premium (1 ano)</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#F2F2F2' }}>R$ 19,90/mês</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#F2F2F2', marginBottom: '10px' }}>
              <span>Renovação automática</span>
              <span>R$ 239,00/ano</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#F2F2F2', marginBottom: '10px' }}>
              <span>✓ Desconto aplicado</span>
              <span>-R$ 36,00</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#F2F2F2', marginBottom: '30px' }}>
            <span style={{ color: '#C89B3C' }}>Total:</span>
            <span>R$ 203,00</span>
          </div>

          <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '8px', border: '1px solid #8D6B1F', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#C89B3C' }}>Dados da Conta</h3>
            <p style={{ margin: '8px 0', color: '#F2F2F2' }}><strong style={{ color: '#C89B3C' }}>Email:</strong> {session?.user?.email}</p>
            <p style={{ margin: '8px 0', color: '#F2F2F2', fontSize: '14px' }}>Você receberá confirmação do pagamento por e-mail</p>
          </div>

          <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '8px', border: '1px solid #8D6B1F', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#C89B3C' }}>Método de Pagamento</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', color: '#F2F2F2' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="payment" value="credit" checked={selectedPaymentMethod === 'credit'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                <span style={{ marginLeft: '8px' }}>💳 Cartão de Crédito</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="payment" value="pix" checked={selectedPaymentMethod === 'pix'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                <span style={{ marginLeft: '8px' }}>📱 PIX</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="payment" value="boleto" checked={selectedPaymentMethod === 'boleto'} onChange={(e) => setSelectedPaymentMethod(e.target.value)} />
                <span style={{ marginLeft: '8px' }}>📄 Boleto</span>
              </label>
            </div>

            {selectedPaymentMethod === 'credit' && (
              <div style={{ backgroundColor: '#111111', padding: '20px', borderRadius: '8px', border: '2px solid #8D6B1F' }}>
                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#C89B3C' }}>Dados do Cartão de Crédito</h4>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#C89B3C' }}>Número do Cartão</label>
                  <input type="text" name="number" placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleCardChange} maxLength={19} style={{ width: '100%', padding: '12px', border: '2px solid #8D6B1F', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#000000', color: '#F2F2F2' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#C89B3C' }}>Nome do Titular</label>
                  <input type="text" name="holder" placeholder="Nome completo" value={cardData.holder} onChange={handleCardChange} style={{ width: '100%', padding: '12px', border: '2px solid #8D6B1F', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#000000', color: '#F2F2F2' }} />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#C89B3C' }}>Validade</label>
                    <input type="text" name="validity" placeholder="MM/AA" value={cardData.validity} onChange={handleCardChange} maxLength={5} style={{ width: '100%', padding: '12px', border: '2px solid #8D6B1F', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#000000', color: '#F2F2F2' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#C89B3C' }}>CVV</label>
                    <input type="password" name="cvv" placeholder="000" value={cardData.cvv} onChange={handleCardChange} maxLength={4} style={{ width: '100%', padding: '12px', border: '2px solid #8D6B1F', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', backgroundColor: '#000000', color: '#F2F2F2' }} />
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod === 'pix' && (
              <div style={{ backgroundColor: '#111111', padding: '20px', borderRadius: '8px', border: '3px solid #8D6B1F', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#C89B3C' }}>💳 Pagamento via PIX</h4>
                
                {/* QR CODE VISUAL */}
                <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px dashed #8D6B1F', display: 'inline-block' }}>
                  <div style={{
                    width: '200px',
                    height: '200px',
                    backgroundColor: '#F2F2F2',
                    border: '2px solid #8D6B1F',
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(20, 1fr)',
                    gap: '1px',
                    padding: '8px',
                    boxSizing: 'border-box'
                  }}>
                    {[...Array(400)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: (i + Math.floor(i / 7)) % 2 === 0 ? '#000' : '#fff',
                          width: '8px',
                          height: '8px'
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#F2F2F2' }}>QR Code PIX</p>
                </div>

                <div style={{ backgroundColor: '#000000', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #8D6B1F' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#C89B3C', fontWeight: 'bold' }}>📋 Chave PIX (Copia e Cola)</p>
                  <div style={{ backgroundColor: '#111111', padding: '12px', borderRadius: '6px', border: '1px solid #8D6B1F' }}>
                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all', color: '#F2F2F2', fontWeight: 'bold' }}>recruta-industria@pix.example.com</p>
                  </div>
                </div>
                
                <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#F2F2F2', fontWeight: 'bold' }}>✓ Após o pagamento, você será redirecionado automaticamente</p>
              </div>
            )}

            {selectedPaymentMethod === 'boleto' && (
              <div style={{ backgroundColor: '#111111', padding: '20px', borderRadius: '8px', border: '2px solid #8D6B1F' }}>
                <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#C89B3C' }}>📄 Pagamento via Boleto</h4>
                
                <div style={{ backgroundColor: '#000000', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #8D6B1F', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#C89B3C', fontWeight: 'bold' }}>Código de Barras</p>
                  
                  <div style={{ backgroundColor: '#F2F2F2', padding: '15px', borderRadius: '6px', marginBottom: '15px', display: 'flex', justifyContent: 'center', gap: '0.5px' }}>
                    {[...Array(60)].map((_, i) => (
                      <div key={i} style={{ width: i % 3 === 0 ? '3px' : '2px', height: '50px', backgroundColor: '#000' }} />
                    ))}
                  </div>

                  <div style={{ backgroundColor: '#111111', padding: '15px', borderRadius: '6px', marginBottom: '15px', border: '2px solid #8D6B1F' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#C89B3C', fontWeight: 'bold' }}>Número do Boleto (Digitar ou Copiar)</p>
                    <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: '#F2F2F2', wordBreak: 'break-all' }}>12345.67890 12345.678901 12345.678901 1 12345678901234</p>
                  </div>

                  <button
                    onClick={() => navigator.clipboard.writeText('12345.67890 12345.678901 12345.678901 1 12345678901234')}
                    style={{ background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', marginBottom: '15px', width: '100%' }}
                  >
                    📋 Copiar Código
                  </button>
                </div>

                <div style={{ backgroundColor: '#000000', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #8D6B1F' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#F2F2F2', fontWeight: 'bold' }}>📱 Como pagar no celular:</p>
                  <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#F2F2F2' }}>
                    <li>Abra o app do seu banco</li>
                    <li>Acesse a opção "Pagar Boleto"</li>
                    <li>Cole ou digite o código acima</li>
                    <li>Confirme os dados e o pagamento</li>
                  </ol>
                </div>

                <p style={{ margin: '0', fontSize: '13px', color: '#F2F2F2', fontWeight: 'bold' }}>✓ Confirmação automática após o pagamento</p>
              </div>
            )}
          </div>

          <button onClick={handlePayment} disabled={loading} style={{ width: '100%', background: loading ? 'linear-gradient(180deg, #4a3810 0%, #5a4512 45%, #6b5218 100%)' : 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)', color: loading ? '#F2F2F2' : '#000', padding: '15px 30px', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', marginBottom: '15px' }}>
            {loading ? '⏳ Processando...' : '✓ Confirmar Pagamento'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '13px', color: '#F2F2F2' }}>
            <p style={{ margin: '10px 0' }}>🔒 Pagamento seguro com criptografia SSL</p>
            <p style={{ margin: '10px 0' }}>✓ Cancelamento a qualquer momento sem penalidades</p>
          </div>
        </div>

        <div style={{ backgroundColor: '#111111', padding: '20px', borderRadius: '8px', border: '1px solid #8D6B1F', fontSize: '13px', color: '#F2F2F2', lineHeight: '1.6' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#C89B3C' }}>Informações Importantes</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Você será cobrado mensalmente após o primeiro período</li>
            <li>Cancelamento pode ser feito a qualquer momento no seu perfil</li>
            <li>Não há taxas ocultas ou contratos de longa duração</li>
            <li>Acesso imediato a todos os recursos Premium após confirmação do pagamento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}

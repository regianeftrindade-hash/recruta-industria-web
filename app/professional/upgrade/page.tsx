/**
 * ⚠️ PÁGINA BLOQUEADA - NÃO MODIFICAR
 * 
 * Esta página foi bloqueada para manter a estabilidade do sistema de upgrade
 * e plano premium. Alterações podem impactar a lógica de cobrança e acesso
 * aos recursos premium.
 * 
 * Se necessário alterar, consulte o desenvolvedor principal.
 * Veja: PROFESSIONAL_UPGRADE_LOCK.md
 */

"use client";

import React from 'react';
// ...existing code...
// ...existing code...
import { useRouter } from 'next/navigation';

function UpgradePageContent() {
  // ...removido useSession, ajuste lógica conforme NextAuth v5...
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#F2F2F2',
    }}>
      {/* CABEÇALHO */}
      <div style={{
        backgroundColor: '#111111',
        color: '#F2F2F2',
        borderBottom: '1px solid #8D6B1F',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
            Upgrade para Premium
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#F2F2F2' }}>
            Desbloqueia todos os recursos
          </p>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#111111',
          padding: '40px',
          borderRadius: '15px',
          border: '1px solid #8D6B1F',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#C89B3C', marginBottom: '30px', fontSize: '32px' }}>
            👑 Plano Premium
          </h2>

          {/* CARD DE PREÇO */}
          <div style={{
            backgroundColor: '#000000',
            padding: '40px',
            borderRadius: '15px',
            border: '1px solid #8D6B1F',
            borderLeft: '6px solid #C89B3C',
            marginBottom: '40px'
          }}>
            <p style={{ color: '#F2F2F2', fontSize: '16px', margin: '0 0 10px 0' }}>
              Invista no seu futuro
            </p>
            <p style={{
              color: '#F2F2F2',
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 0 10px 0'
            }}>
              R$ 19,90
            </p>
            <p style={{ color: '#F2F2F2', fontSize: '14px', margin: 0 }}>
              por mês (renovação automática)
            </p>
          </div>

          {/* BENEFÍCIOS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginBottom: '40px'
          }}>
            <div>
              <h3 style={{ color: '#C89B3C', marginBottom: '20px' }}>
                ✓ Recursos Inclusos
              </h3>
              <ul style={{
                textAlign: 'left',
                color: '#F2F2F2',
                lineHeight: '2',
                fontSize: '14px',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li>✅ Perfil completo</li>
                <li>✅ Todas as dicas visíveis</li>
                <li>✅ Visualizar todas as empresas</li>
                <li>✅ Suporte prioritário</li>
                <li>✅ Prioridade em buscas</li>
              </ul>
            </div>
            <div>
              <h3 style={{ color: '#C89B3C', marginBottom: '20px' }}>
                🎯 Vantagens
              </h3>
              <ul style={{
                textAlign: 'left',
                color: '#F2F2F2',
                lineHeight: '2',
                fontSize: '14px',
                listStyle: 'none',
                padding: 0,
                margin: 0
              }}>
                <li>📈 Maior visibilidade</li>
                <li>📊 Mais oportunidades</li>
                <li>🚀 Destaque no sistema</li>
                <li>💬 Suporte 24/7</li>
                <li>🎁 Benefícios exclusivos</li>
              </ul>
            </div>
          </div>

          {/* BOTÕES */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => router.push('/professional/dashboard')}
              style={{
                background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                color: '#000',
                padding: '14px 40px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              ← Voltar
            </button>
            <button
              onClick={() => router.push('/professional/checkout')}
              style={{
                background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                color: '#000',
                padding: '14px 40px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              💳 Upgrade Agora
            </button>
          </div>

          {/* GARANTIA */}
          <p style={{
            color: '#F2F2F2',
            fontSize: '13px',
            fontStyle: 'italic'
          }}>
            ✓ Cancelamento a qualquer momento sem penalidades<br/>
            ✓ Acesso imediato a todos os recursos Premium
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
      <UpgradePageContent />
  );
}

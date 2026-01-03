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
import { useSession, signOut, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function UpgradePageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* CABEÇALHO */}
      <div style={{
        backgroundColor: '#001f3f',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
            Upgrade para Premium
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            Desbloqueia todos os recursos
          </p>
        </div>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          🚪 Sair
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '32px' }}>
            👑 Plano Premium
          </h2>

          {/* CARD DE PREÇO */}
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '40px',
            borderRadius: '15px',
            borderLeft: '6px solid #ff9800',
            marginBottom: '40px'
          }}>
            <p style={{ color: '#666', fontSize: '16px', margin: '0 0 10px 0' }}>
              Invista no seu futuro
            </p>
            <p style={{
              color: '#ff9800',
              fontSize: '48px',
              fontWeight: 'bold',
              margin: '0 0 10px 0'
            }}>
              R$ 19,90
            </p>
            <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
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
              <h3 style={{ color: '#001f3f', marginBottom: '20px' }}>
                ✓ Recursos Inclusos
              </h3>
              <ul style={{
                textAlign: 'left',
                color: '#333',
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
              <h3 style={{ color: '#001f3f', marginBottom: '20px' }}>
                🎯 Vantagens
              </h3>
              <ul style={{
                textAlign: 'left',
                color: '#333',
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
              onClick={() => router.push('/professional/dashboard/painel')}
              style={{
                backgroundColor: '#e0e0e0',
                color: '#333',
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
                backgroundColor: '#ff9800',
                color: 'white',
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
            color: '#666',
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
    <SessionProvider>
      <UpgradePageContent />
    </SessionProvider>
  );
}

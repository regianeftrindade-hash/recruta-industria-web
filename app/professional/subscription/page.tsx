"use client";

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const router = useRouter();

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
            Gerenciar Assinatura
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            Sua assinatura Premium
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
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '28px', marginTop: 0 }}>
            👑 Seu Plano Premium
          </h2>

          {/* STATUS DA ASSINATURA */}
          <div style={{
            backgroundColor: '#e8f5e9',
            padding: '25px',
            borderRadius: '12px',
            borderLeft: '6px solid #4caf50',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#2e7d32', fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
              ✓ Assinatura Ativa
            </p>
            <p style={{ color: '#333', margin: '0 0 8px 0' }}>
              <strong>Próxima renovação:</strong> 02 de Fevereiro, 2026
            </p>
            <p style={{ color: '#333', margin: 0 }}>
              <strong>Valor mensal:</strong> R$ 19,90
            </p>
          </div>

          {/* AÇÕES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              style={{
                backgroundColor: '#0066cc',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              💳 Atualizar Forma de Pagamento
            </button>
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              style={{
                backgroundColor: '#ff9800',
                color: 'white',
                padding: '14px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              📥 Baixar Recibos
            </button>
          </div>

          {/* CANCELAR ASSINATURA */}
          <div style={{
            backgroundColor: '#fee2e2',
            padding: '25px',
            borderRadius: '12px',
            borderLeft: '6px solid #dc3545',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#991b1b', fontSize: '14px', marginBottom: '15px', margin: 0 }}>
              Quer cancelar sua assinatura? Você pode fazer isso a qualquer momento sem penalidades.
            </p>
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '10px 25px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '15px'
              }}
            >
              ✕ Cancelar Assinatura
            </button>
          </div>

          {/* BOTÃO VOLTAR */}
          <button
            onClick={() => router.push('/professional/dashboard/painel')}
            style={{
              backgroundColor: '#003366',
              color: 'white',
              padding: '14px 40px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              width: '100%'
            }}
          >
            ← Voltar para o Painel
          </button>
        </div>
      </div>
    </div>
  );
}

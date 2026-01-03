"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeSuccessPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '60px',
        borderRadius: '20px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <div style={{
          fontSize: '80px',
          marginBottom: '20px'
        }}>
          ✨
        </div>

        <h1 style={{
          color: '#28a745',
          fontSize: '36px',
          marginBottom: '15px'
        }}>
          Upgrade Realizado com Sucesso!
        </h1>

        <p style={{
          color: '#666',
          fontSize: '18px',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Parabéns! Você agora é um membro <strong>Premium</strong>. Todos os recursos estão disponíveis para você.
        </p>

        <div style={{
          backgroundColor: '#e8f5e9',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#2e7d32', marginTop: 0 }}>
            ✓ Agora você tem acesso a:
          </h3>
          <ul style={{
            color: '#333',
            lineHeight: '2',
            margin: 0,
            paddingLeft: '20px'
          }}>
            <li>👑 Perfil Premium completo</li>
            <li>💡 Todas as dicas das empresas</li>
            <li>👥 Visualização de todas as empresas</li>
            <li>🚀 Prioridade em buscas</li>
            <li>💬 Suporte 24/7 prioritário</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '30px',
          fontSize: '14px',
          color: '#856404'
        }}>
          <strong>📋 Recibos:</strong> Você receberá um recibo por email para cada renovação mensal.
          <br/>
          <strong>❌ Cancelamento:</strong> Você pode cancelar a qualquer momento sem penalidades.
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/professional/dashboard/painel')}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '14px 40px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            🚀 Voltar ao Painel
          </button>
        </div>
      </div>
    </div>
  );
}

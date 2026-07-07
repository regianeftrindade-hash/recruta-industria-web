"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeSuccessPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: '#F2F2F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#111111',
        padding: '60px',
        borderRadius: '20px',
        border: '1px solid #8D6B1F',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
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
          color: '#C89B3C',
          fontSize: '36px',
          marginBottom: '15px'
        }}>
          Upgrade Realizado com Sucesso!
        </h1>

        <p style={{
          color: '#F2F2F2',
          fontSize: '18px',
          marginBottom: '30px',
          lineHeight: '1.6'
        }}>
          Parabéns! Você agora é um membro <strong style={{ color: '#F2F2F2' }}>Premium</strong>. Todos os recursos estão disponíveis para você.
        </p>

        <div style={{
          backgroundColor: '#000000',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #8D6B1F',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <h3 style={{ color: '#C89B3C', marginTop: 0 }}>
            ✓ Agora você tem acesso a:
          </h3>
          <ul style={{
            color: '#F2F2F2',
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
          backgroundColor: '#000000',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #8D6B1F',
          marginBottom: '30px',
          fontSize: '14px',
          color: '#F2F2F2'
        }}>
          <strong style={{ color: '#F2F2F2' }}>📋 Recibos:</strong> Você receberá um recibo por email para cada renovação mensal.
          <br/>
          <strong style={{ color: '#F2F2F2' }}>❌ Cancelamento:</strong> Você pode cancelar a qualquer momento sem penalidades.
        </div>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
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
            🚀 Voltar ao Painel
          </button>
        </div>
      </div>
    </div>
  );
}

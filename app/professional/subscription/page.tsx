"use client";

import React from 'react';
// ...existing code...
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
  // useSession removido: NextAuth v5 App Router não suporta
  // ...existing code...
  // signOut removido: NextAuth v5 App Router não suporta
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
            Gerenciar Assinatura
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#F2F2F2' }}>
            Sua assinatura Premium
          </p>
        </div>
        {/* Botão de logout removido: NextAuth v5 não possui signOut client-side no App Router */}
        <button
          style={{
            background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
            color: '#000',
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
          backgroundColor: '#111111',
          padding: '40px',
          borderRadius: '15px',
          border: '1px solid #8D6B1F',
          boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: '#C89B3C', marginBottom: '30px', fontSize: '28px', marginTop: 0 }}>
            👑 Seu Plano Premium
          </h2>

          {/* STATUS DA ASSINATURA */}
          <div style={{
            backgroundColor: '#000000',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid #8D6B1F',
            borderLeft: '6px solid #C89B3C',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#F2F2F2', fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
              ✓ Assinatura Ativa
            </p>
            <p style={{ color: '#F2F2F2', margin: '0 0 8px 0' }}>
              <strong style={{ color: '#C89B3C' }}>Próxima renovação:</strong> 02 de Fevereiro, 2026
            </p>
            <p style={{ color: '#F2F2F2', margin: 0 }}>
              <strong style={{ color: '#C89B3C' }}>Valor mensal:</strong> R$ 19,90
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
                background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                color: '#000',
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
                background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                color: '#000',
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
            backgroundColor: '#000000',
            padding: '25px',
            borderRadius: '12px',
            border: '1px solid #8D6B1F',
            borderLeft: '6px solid #C89B3C',
            marginBottom: '30px'
          }}>
            <p style={{ color: '#F2F2F2', fontSize: '14px', marginBottom: '15px', margin: 0 }}>
              Quer cancelar sua assinatura? Você pode fazer isso a qualquer momento sem penalidades.
            </p>
            <button
              onClick={() => alert('Funcionalidade em desenvolvimento')}
              style={{
                background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
                color: '#000',
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
            onClick={() => router.push('/professional/dashboard')}
            style={{
              background: 'linear-gradient(180deg, #8D6B1F 0%, #D4AF37 45%, #C89B3C 100%)',
              color: '#000',
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

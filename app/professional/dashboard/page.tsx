/**
 * 🔒 DASHBOARD PROFISSIONAL - BLOQUEADO PARA ALTERAÇÕES
 * ======================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * 
 * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou estrutura
 * ✗ NÃO remover componentes principais
 * ✗ NÃO modificar estilos CSS
 * ✗ NÃO alterar fluxo de dados
 * 
 * ALTERAÇÕES PERMITIDAS:
 * ✓ Adicionar novas cards/seções
 * ✓ Modificar conteúdo de texto
 * ✓ Atualizar URLs de redirecionamento
 * ✓ Adicionar novas funcionalidades
 * 
 * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signOut, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SessionUser {
  id: string;
  email: string;
  name?: string;
  userType?: string;
}

function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && mounted) {
      router.push('/login?redirect=/professional/dashboard');
    }
  }, [status, router, mounted]);

  const user = session?.user as SessionUser | undefined;

  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f4f8'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>Carregando...</p>
      </div>
    );
  }

  if (!user) {
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
        padding: 'clamp(15px, 4vw, 20px) clamp(20px, 5vw, 40px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'clamp(10px, 3vw, 20px)',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: 'clamp(20px, 5vw, 28px)' }}>
            Bem-vindo, {user.name || user.email.split('@')[0]}!
          </h1>
          <p style={{ margin: 0, fontSize: 'clamp(12px, 2vw, 14px)', opacity: 0.9, wordBreak: 'break-word' }}>
            {user.email}
          </p>
        </div>
        <button
          onClick={() => signOut({ redirect: true, callbackUrl: '/login' })}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: 'clamp(8px, 2vw, 10px) clamp(15px, 3vw, 20px)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: 'clamp(12px, 2vw, 14px)',
            whiteSpace: 'nowrap'
          }}
        >
          🚪 Sair
        </button>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ padding: 'clamp(20px, 5vw, 40px)', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {/* AVISO PARA COMPLETAR CADASTRO */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: 'clamp(25px, 5vw, 40px)',
          borderRadius: '15px',
          borderLeft: '6px solid #ff9800',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#856404', margin: '0 0 15px 0', fontSize: 'clamp(22px, 5vw, 28px)' }}>
            ⚠️ COMPLETE SEU CADASTRO
          </h2>
          <p style={{ color: '#856404', marginBottom: '30px', lineHeight: '1.8', fontSize: 'clamp(14px, 3vw, 16px)' }}>
            Para acessar seu painel completo e ser visualizado pelas empresas, você precisa completar seu perfil com todas as informações solicitadas.
          </p>
          <button
            onClick={() => router.push('/professional/register')}
            style={{
              backgroundColor: '#ff9800',
              color: 'white',
              padding: 'clamp(12px, 2.5vw, 14px) clamp(30px, 5vw, 40px)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 'clamp(14px, 3vw, 16px)',
              display: 'inline-block'
            }}
          >
            ✏️ COMPLETAR CADASTRO AGORA
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <SessionProvider>
      <ClientDashboard />
    </SessionProvider>
  );
}

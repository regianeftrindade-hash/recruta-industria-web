"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
            Bem-vindo, {user.name || user.email.split('@')[0]}!
          </h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
            {user.email}
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

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* AVISO PARA COMPLETAR CADASTRO */}
        <div style={{
          backgroundColor: '#fff3cd',
          padding: '40px',
          borderRadius: '15px',
          borderLeft: '6px solid #ff9800',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#856404', margin: '0 0 15px 0', fontSize: '28px' }}>
            ⚠️ COMPLETE SEU CADASTRO
          </h2>
          <p style={{ color: '#856404', marginBottom: '30px', lineHeight: '1.8', fontSize: '16px' }}>
            Para acessar seu painel completo e ser visualizado pelas empresas, você precisa completar seu perfil com todas as informações solicitadas.
          </p>
          <button
            onClick={() => router.push('/professional/register')}
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
            ✏️ COMPLETAR CADASTRO AGORA
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;

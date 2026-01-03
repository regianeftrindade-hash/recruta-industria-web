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
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && mounted) {
      router.push('/login?redirect=/company/dashboard-empresa');
    }
  }, [status, router, mounted]);

  useEffect(() => {
    if (status === 'authenticated' && mounted) {
      checkRegistrationStatus();
    }
  }, [status, mounted]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/company/check-registration');
      
      if (!response.ok) {
        setIsCheckingRegistration(false);
        return;
      }

      const data = await response.json();
      setRegistrationComplete(data.registrationComplete || false);
    } catch (error) {
      console.error('Erro ao verificar registro:', error);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const user = session?.user as SessionUser | undefined;

  if (status === 'loading' || isCheckingRegistration) {
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

  // Se cadastro não está completo, mostrar apenas a mensagem
  if (!registrationComplete) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f0f4f8',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* HEADER */}
        <header style={{
          backgroundColor: '#001f3f',
          color: 'white',
          padding: '20px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>RECRUTA INDÚSTRIA</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>Painel Empresarial</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >
            SAIR
          </button>
        </header>

        {/* MAIN CONTENT - APENAS MENSAGEM */}
        <main style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px'
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '50px 40px',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '80px',
              marginBottom: '30px'
            }}>
              📋
            </div>

            <h2 style={{
              color: '#001f3f',
              fontSize: '28px',
              fontWeight: 900,
              margin: '0 0 20px 0'
            }}>
              Cadastro Incompleto
            </h2>

            <p style={{
              color: '#666',
              fontSize: '18px',
              lineHeight: '1.6',
              margin: '0 0 30px 0'
            }}>
              Para acessar as funcionalidades completas do painel e começar a recrutar talentos, você precisa completar seu cadastro com informações adicionais da sua empresa.
            </p>

            <div style={{
              backgroundColor: '#f0f4f8',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px',
              borderLeft: '4px solid #001f3f'
            }}>
              <p style={{
                color: '#001f3f',
                fontSize: '14px',
                margin: 0,
                fontWeight: '600'
              }}>
                ℹ️ Você está logado como: <strong>{user.email}</strong>
              </p>
            </div>

            <button
              onClick={() => router.push('/company/register')}
              style={{
                backgroundColor: '#001f3f',
                color: 'white',
                padding: '16px 40px',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#003366';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#001f3f';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              ✏️ Completar Cadastro
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Se cadastro está completo, mostrar o painel completo
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f4f8',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        backgroundColor: '#001f3f',
        color: 'white',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 900 }}>RECRUTA INDÚSTRIA</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>Dashboard Empresarial</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{user.name || user.email}</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#ccc' }}>Empresa</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              transition: 'all 0.3s'
            }}
          >
            SAIR
          </button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        <h2 style={{ color: '#001f3f', fontSize: '28px', fontWeight: 900, marginBottom: '20px' }}>
          Dashboard
        </h2>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Bem-vindo ao painel da sua empresa! As funcionalidades estarão disponíveis em breve.
          </p>
        </div>
      </main>
    </div>
  );
}

export default ClientDashboard;

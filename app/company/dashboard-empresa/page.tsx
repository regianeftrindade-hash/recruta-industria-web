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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vagas' | 'candidatos' | 'configuracoes'>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && mounted) {
      router.push('/login?redirect=/company/dashboard-empresa');
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

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 100px)' }}>
        {/* SIDEBAR */}
        <aside style={{
          backgroundColor: '#003366',
          color: 'white',
          width: '250px',
          padding: '30px 0',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '20px' }}>
            {[
              { key: 'dashboard', icon: '📊', label: 'Dashboard' },
              { key: 'vagas', icon: '💼', label: 'Minhas Vagas' },
              { key: 'candidatos', icon: '👥', label: 'Candidatos' },
              { key: 'configuracoes', icon: '⚙️', label: 'Configurações' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as any)}
                style={{
                  backgroundColor: activeTab === item.key ? '#1e5b96' : 'transparent',
                  color: 'white',
                  padding: '15px 20px',
                  border: 'none',
                  borderLeft: activeTab === item.key ? '4px solid #ffc107' : 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  transition: 'all 0.3s',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: '40px' }}>
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '28px', fontWeight: 900 }}>
                Dashboard
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {[
                  { label: 'Vagas Ativas', value: '0' },
                  { label: 'Candidatos', value: '0' },
                  { label: 'Status', value: 'Ativo' }
                ].map((card, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: 'white',
                      padding: '30px',
                      borderRadius: '15px',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{ color: '#666', fontSize: '14px', margin: 0, marginBottom: '10px' }}>
                      {card.label}
                    </p>
                    <p style={{ color: '#001f3f', fontSize: '36px', fontWeight: 900, margin: 0 }}>
                      {card.value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#001f3f', marginBottom: '20px', fontWeight: 'bold' }}>
                  Dados da Empresa
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#666',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '5px',
                      textTransform: 'uppercase'
                    }}>
                      Email
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#001f3f', fontWeight: 'bold' }}>
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      color: '#666',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '5px',
                      textTransform: 'uppercase'
                    }}>
                      Status
                    </label>
                    <p style={{ margin: 0, fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>
                      Ativo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VAGAS TAB */}
          {activeTab === 'vagas' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px'
              }}>
                <h2 style={{ color: '#001f3f', margin: 0, fontSize: '28px', fontWeight: 900 }}>
                  Minhas Vagas
                </h2>
                <button
                  style={{
                    backgroundColor: '#003366',
                    color: 'white',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    transition: 'all 0.3s'
                  }}
                >
                  ➕ NOVA VAGA
                </button>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <p style={{ color: '#999', fontSize: '18px' }}>Nenhuma vaga publicada</p>
              </div>
            </div>
          )}

          {/* CANDIDATOS TAB */}
          {activeTab === 'candidatos' && (
            <div>
              <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '28px', fontWeight: 900 }}>
                Candidatos
              </h2>

              <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
                textAlign: 'center'
              }}>
                <p style={{ color: '#999', fontSize: '18px' }}>Nenhum candidato</p>
              </div>
            </div>
          )}

          {/* CONFIGURAÇÕES TAB */}
          {activeTab === 'configuracoes' && (
            <div>
              <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '28px', fontWeight: 900 }}>
                Configurações
              </h2>

              <div style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ color: '#001f3f', marginBottom: '20px', fontWeight: 'bold' }}>
                  Notificações
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" defaultChecked />
                  <label style={{ cursor: 'pointer', fontSize: '16px', color: '#666' }}>
                    Receber notificações
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ClientDashboard;

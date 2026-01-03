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

interface ProfileData {
  profissao?: string;
  localizacao?: string;
  experiencia?: string;
  formacao?: string;
  habilidades?: string;
  dataVisualizacoes?: number;
  plano?: 'free' | 'premium';
}

export default function PainelProfissional() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    profissao: 'Desenvolvedor Full Stack',
    localizacao: 'São Paulo, SP',
    experiencia: 'Com experiência em diferentes áreas',
    formacao: 'Formação completa',
    habilidades: 'JavaScript, React, Node.js, SQL',
    dataVisualizacoes: 12,
    plano: 'free'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/professional/dashboard');
    }
  }, [status, router]);

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
      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
        <h2 style={{ color: '#001f3f', marginBottom: '30px', fontSize: '28px' }}>
          📊 Meu Painel
        </h2>

        {/* GRID LAYOUT */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* COLUNA ESQUERDA - RESUMO E INFORMAÇÕES */}
          <div>
            {/* RESUMO DO CADASTRO */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#001f3f', marginTop: 0, marginBottom: '25px', fontSize: '22px' }}>
                📋 Resumo do Cadastro
              </h3>
              
              {/* FOTO DE PERFIL */}
              <div style={{
                textAlign: 'center',
                marginBottom: '25px'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: '#e0e7ff',
                  border: '4px solid #003366',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '50px'
                }}>
                  👤
                </div>
                <button
                  onClick={() => {}}
                  style={{
                    marginTop: '15px',
                    backgroundColor: '#0066cc',
                    color: 'white',
                    padding: '8px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  📷 Alterar Foto
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    Nome Completo
                  </p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
                    {user.name || 'Não informado'}
                  </p>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    Email
                  </p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
                    {user.email}
                  </p>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    Profissão
                  </p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
                    {profileData.profissao || 'Não informado'}
                  </p>
                </div>
                <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    Localização
                  </p>
                  <p style={{ color: '#001f3f', fontWeight: 'bold', margin: 0, fontSize: '15px' }}>
                    {profileData.localizacao || 'Não informado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/professional/register')}
                style={{
                  backgroundColor: '#003366',
                  color: 'white',
                  padding: '12px 25px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                ✏️ Atualizar Cadastro
              </button>
            </div>

            {/* DICAS DAS EMPRESAS QUE VISUALIZARAM */}
            <div style={{
              backgroundColor: '#e8f4f8',
              padding: '30px',
              borderRadius: '15px',
              borderLeft: '6px solid #0066cc',
              marginBottom: '30px'
            }}>
              <h3 style={{ color: '#0066cc', marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>
                💬 Dicas das Empresas
              </h3>
              <p style={{ color: '#003366', fontSize: '13px', marginBottom: '15px', lineHeight: '1.6' }}>
                Essas são dicas deixadas pelas empresas que visualizaram seu perfil. Use-as para melhorar sua candidatura:
              </p>
              <ul style={{
                color: '#003366',
                lineHeight: '1.8',
                margin: 0,
                paddingLeft: '20px',
                listStyle: 'disc'
              }}>
                {profileData.plano === 'free' ? (
                  <li style={{ marginBottom: '10px' }}>
                    "Sua experiência está ótima, mas gostaria de ver mais detalhes sobre liderança de equipes"
                  </li>
                ) : (
                  <>
                    <li style={{ marginBottom: '10px' }}>
                      "Sua experiência está ótima, mas gostaria de ver mais detalhes sobre liderança de equipes"
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      "Foque mais em seus resultados mensuráveis e impacto nos projetos anteriores"
                    </li>
                    <li style={{ marginBottom: '10px' }}>
                      "Adicione certificações relevantes para a área de tecnologia"
                    </li>
                    <li>
                      "Considere descrever sua experiência internacional, se houver"
                    </li>
                  </>
                )}
              </ul>
              {profileData.plano === 'free' && (
                <p style={{
                  color: '#0066cc',
                  fontSize: '12px',
                  marginTop: '15px',
                  fontStyle: 'italic'
                }}>
                  💎 Upgrade para Premium para ver todas as dicas das empresas
                </p>
              )}
            </div>

            {/* QUEM VIU SEU PERFIL */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#001f3f', marginTop: 0, marginBottom: '25px', fontSize: '22px' }}>
                👁️ Quem Viu Seu Perfil
              </h3>

              {/* ESTATÍSTICAS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '30px'
              }}>
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderLeft: '4px solid #1976d2'
                }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    TOTAL DE VISUALIZAÇÕES
                  </p>
                  <p style={{ color: '#1976d2', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                    {profileData.dataVisualizacoes || 0}
                  </p>
                </div>
                <div style={{
                  backgroundColor: '#f3e5f5',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  borderLeft: '4px solid #7b1fa2'
                }}>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                    ESTE MÊS
                  </p>
                  <p style={{ color: '#7b1fa2', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
                    {Math.floor((profileData.dataVisualizacoes || 0) * 0.6)}
                  </p>
                </div>
              </div>

              {/* LISTA DE VISUALIZAÇÕES */}
              <div style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#333', marginTop: 0, marginBottom: '15px' }}>
                  Últimas Visualizações
                </h4>
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {[
                    { empresa: 'TechCorp Brasil', cargo: 'Gerente', data: 'Hoje' },
                    { empresa: 'inovação Digital', cargo: 'Tech Lead', data: 'Ontem' },
                    { empresa: 'Cloud Solutions', cargo: 'Desenvolvedor Senior', data: '2 dias atrás' },
                    { empresa: 'FinTech Startup', cargo: 'Arquiteto', data: '3 dias atrás' },
                    { empresa: 'Enterprise Systems', cargo: 'Gerente de Projetos', data: '5 dias atrás' }
                  ]
                  .slice(0, profileData.plano === 'free' ? 1 : 5)
                  .map((view, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '15px',
                        borderBottom: idx < 4 ? '1px solid #e0e0e0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{ color: '#001f3f', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                          {view.empresa}
                        </p>
                        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                          {view.cargo}
                        </p>
                      </div>
                      <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>
                        {view.data}
                      </p>
                    </div>
                  ))}
                </div>
                {profileData.plano === 'free' && (
                  <p style={{
                    color: '#0066cc',
                    fontSize: '12px',
                    marginTop: '15px',
                    fontStyle: 'italic'
                  }}>
                    💎 Upgrade para Premium para ver todas as empresas que visualizaram seu perfil
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA - PLANO E AÇÕES */}
          <div>
            {/* PLANO ATUAL */}
            <div style={{
              backgroundColor: profileData.plano === 'premium' ? '#fff3cd' : '#e8f5e9',
              padding: '30px',
              borderRadius: '15px',
              borderLeft: profileData.plano === 'premium' ? '6px solid #ff9800' : '6px solid #4caf50',
              marginBottom: '30px'
            }}>
              <h3 style={{
                color: profileData.plano === 'premium' ? '#856404' : '#2e7d32',
                marginTop: 0,
                marginBottom: '15px'
              }}>
                🎁 Plano Atual
              </h3>
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <p style={{
                  color: '#666',
                  fontSize: '13px',
                  margin: '0 0 10px 0',
                  fontWeight: 'bold'
                }}>
                  Você está no plano
                </p>
                <p style={{
                  color: profileData.plano === 'premium' ? '#ff9800' : '#4caf50',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: 0,
                  textTransform: 'uppercase'
                }}>
                  {profileData.plano === 'premium' ? '👑 PREMIUM' : '⭐ FREE'}
                </p>
              </div>

              {profileData.plano === 'free' ? (
                <div>
                  <button
                    onClick={() => router.push('/professional/upgrade')}
                    style={{
                      width: '100%',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginTop: '10px'
                    }}
                  >
                    💎 Upgrade para Premium
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => router.push('/professional/subscription')}
                    style={{
                      width: '100%',
                      backgroundColor: '#ff9800',
                      color: 'white',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginTop: '10px'
                    }}
                  >
                    ⚙️ Gerenciar Assinatura
                  </button>
                </div>
              )}
            </div>

            {/* COMPARAÇÃO DE PLANOS */}
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#001f3f', marginTop: 0, marginBottom: '25px', fontSize: '18px' }}>
                📊 Comparação de Planos
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px'
              }}>
                {/* PLANO FREE */}
                <div style={{
                  border: '2px solid #4caf50',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: profileData.plano === 'free' ? '#f1f8f4' : '#fafafa'
                }}>
                  <p style={{ color: '#4caf50', fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                    ⭐ PLANO FREE
                  </p>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    listStyle: 'disc',
                    color: '#333',
                    fontSize: '13px',
                    lineHeight: '1.8'
                  }}>
                    <li>Perfil completo</li>
                    <li>1 dica das empresas visível</li>
                    <li>Visualizar 1 empresa por semana</li>
                    <li>Suporte padrão</li>
                    <li style={{ color: '#999', textDecoration: 'line-through' }}>Prioridade em buscas</li>
                  </ul>
                </div>

                {/* PLANO PREMIUM */}
                <div style={{
                  border: '2px solid #ff9800',
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: profileData.plano === 'premium' ? '#fffbf0' : '#fafafa'
                }}>
                  <p style={{ color: '#ff9800', fontSize: '16px', fontWeight: 'bold', margin: '0 0 15px 0' }}>
                    👑 PLANO PREMIUM
                  </p>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    listStyle: 'disc',
                    color: '#333',
                    fontSize: '13px',
                    lineHeight: '1.8'
                  }}>
                    <li>Perfil completo</li>
                    <li>Todas as dicas visíveis</li>
                    <li>Visualizar todas as empresas</li>
                    <li>Suporte prioritário</li>
                    <li style={{ color: '#ff9800', fontWeight: 'bold' }}>Prioridade em buscas ⭐</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

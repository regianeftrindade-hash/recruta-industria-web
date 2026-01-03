"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CompanyInfo {
  id: string;
  email: string;
  nome?: string;
  cnpj?: string;
}

export default function CompanyPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationComplete, setIsRegistrationComplete] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState('');

  const redirectSource = searchParams.get('from') || '/company/dashboard';

  useEffect(() => {
    checkRegistration();
  }, []);

  const checkRegistration = async () => {
    try {
      const response = await fetch('/api/company/check-registration');
      
      if (!response.ok) {
        setError('Não autorizado. Apenas empresas podem acessar.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      const data = await response.json();

      if (!data.authenticated || !data.isCompany) {
        setError('Acesso negado. Apenas empresas podem acessar.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      setCompanyInfo({
        id: data.user.id,
        email: data.user.email,
        nome: data.user.nome,
        cnpj: data.user.cnpj,
      });

      setIsRegistrationComplete(data.registrationComplete);

      // Se registro está completo, redireciona para o dashboard
      if (data.registrationComplete) {
        router.push(redirectSource);
      }
    } catch (err) {
      console.error('Erro ao verificar registro:', err);
      setError('Erro ao verificar seu registro.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>⏳</div>
          <p style={{ fontSize: '18px', color: '#666' }}>Carregando...</p>
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ 
          maxWidth: '600px', 
          backgroundColor: 'white', 
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <p style={{ fontSize: '18px', color: '#d32f2f', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '12px 30px',
              backgroundColor: '#001f3f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    );
  }

  if (!isRegistrationComplete) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        padding: '40px 20px'
      }}>
        <div style={{ 
          maxWidth: '700px', 
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📋</div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#001f3f',
              margin: '0 0 10px 0'
            }}>
              Cadastro Incompleto
            </h1>
            <p style={{ 
              fontSize: '16px', 
              color: '#666',
              margin: 0
            }}>
              Para acessar o painel e visualizar perfis de profissionais, você precisa completar seu cadastro.
            </p>
          </div>

          {/* Company Info */}
          {companyInfo && (
            <div style={{
              backgroundColor: '#f0f4f8',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px',
              borderLeft: '4px solid #001f3f'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Email:</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#001f3f' }}>
                {companyInfo.email}
              </p>
              
              {companyInfo.nome && (
                <>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>Empresa:</p>
                  <p style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#001f3f' }}>
                    {companyInfo.nome}
                  </p>
                </>
              )}

              {companyInfo.cnpj && (
                <>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>CNPJ:</p>
                  <p style={{ margin: '0 0 0 0', fontSize: '16px', fontWeight: 'bold', color: '#001f3f' }}>
                    {companyInfo.cnpj}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Checklist */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: '#001f3f',
              marginBottom: '20px'
            }}>
              Campos Obrigatórios para Completar:
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '20px' }}>📝</span>
                <span style={{ flex: 1, color: '#333' }}>Razão Social / Nome da Empresa</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '20px' }}>📱</span>
                <span style={{ flex: 1, color: '#333' }}>Telefone de Contato</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '20px' }}>🏢</span>
                <span style={{ flex: 1, color: '#333' }}>Setor Industrial</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '20px' }}>🏷️</span>
                <span style={{ flex: 1, color: '#333' }}>CNPJ Validado</span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <span style={{ fontSize: '20px' }}>✉️</span>
                <span style={{ flex: 1, color: '#333' }}>Email Validado</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <button
              onClick={() => router.push('/company/register')}
              style={{
                padding: '15px 20px',
                backgroundColor: '#001f3f',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#003366')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#001f3f')}
            >
              ✏️ Completar Cadastro
            </button>

            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '15px 20px',
                backgroundColor: '#f5f5f5',
                color: '#001f3f',
                border: '2px solid #001f3f',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e8e8e8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
            >
              ← Voltar
            </button>
          </div>

          {/* Info Box */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#e3f2fd',
            borderRadius: '10px',
            borderLeft: '4px solid #1976d2'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0d47a1', lineHeight: '1.6' }}>
              <strong>ℹ️ Informação:</strong> O cadastro completo permite que você acesse o painel de busca de talentos, 
              veja perfis de profissionais e inicie o processo de recrutamento. Todos os dados são utilizados apenas 
              para melhorar sua experiência na plataforma.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se chegou aqui, o registro está completo (não deveria)
  return null;
}

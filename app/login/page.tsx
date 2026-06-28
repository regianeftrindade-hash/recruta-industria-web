/**
 * 🔒 PÁGINA DE LOGIN - BLOQUEADA PARA ALTERAÇÕES
 * ================================================
 * ⚠️ ATENÇÃO: Esta página foi finalizada e aprovada.
 * 
 * RESTRIÇÕES:
 * ✗ NÃO alterar layout ou espaçamento
 * ✗ NÃO remover componentes
 * ✗ NÃO modificar estilos CSS
 * ✗ NÃO alterar fluxo de autenticação
 * 
 * ALTERAÇÕES PERMITIDAS:
 * ✓ Ajustar URLs de redirecionamento
 * ✓ Atualizar mensagens de erro
 * ✓ Modificar validações de segurança
 * 
 * Última atualização: 02/01/2026
 * Status: ✅ FINALIZADO E APROVADO
 */

"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { checkRateLimit } from '@/lib/security';
import MathCaptcha from '../components/MathCaptcha';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tipoLogin, setTipoLogin] = useState<'professional' | 'company'>('professional');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    const tipo = searchParams.get('tipo');
    if (tipo === 'empresa') {
      setTipoLogin('company');
    } else if (tipo === 'profissional') {
      setTipoLogin('professional');
    }
    const error = searchParams.get('error');
    if (error) {
      setErrorMessage('Erro na autenticação. Tente novamente.');
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.email || !formData.senha) {
      setErrorMessage('Por favor, preencha todos os campos');
      return;
    }

    if (!checkRateLimit(formData.email)) {
      setErrorMessage('Muitas tentativas de login. Tente novamente em 15 minutos.');
      setShowCaptcha(true);
      return;
    }

    if (showCaptcha && !captchaVerified) {
      setErrorMessage('Por favor, resolva o captcha antes de continuar.');
      return;
    }

    setLoading(true);

    try {
      // Primeiro, valida as credenciais sem redirecionar
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.senha,
        redirect: false,
      });

      if (result?.error) {
        // Verificar se é erro de rate limit
        if (result.error === 'CredentialsSignin' || result.status === 429) {
          setErrorMessage('Muitas tentativas de login. Por favor, aguarde 15 minutos antes de tentar novamente.');
          setShowCaptcha(true);
        } else {
          setErrorMessage('Email ou senha inválidos');
        }
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Aguarda um pouco e depois busca o tipo do usuário
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          // Busca o userType via endpoint que busca no banco de dados
          const typeRes = await fetch('/api/auth/get-user-type', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email })
          });
          
          if (typeRes.ok) {
            const typeData = await typeRes.json();
            const userType = typeData.userType;
            console.log('UserType from API:', userType);
            
            if (userType === 'company') {
              router.push('/company/dashboard-empresa');
            } else {
              router.push('/professional/dashboard');
            }
          } else {
            // Tenta ler como texto para logar o erro
            const errorText = await typeRes.text();
            console.error('Resposta não-JSON:', errorText);
            router.push(tipoLogin === 'company' ? '/company/dashboard-empresa' : '/professional/dashboard');
          }
        } catch (err) {
          console.error('Erro ao buscar tipo:', err);
          // Fallback
          router.push(tipoLogin === 'company' ? '/company/dashboard-empresa' : '/professional/dashboard');
        }
      }
    } catch (error) {
      setErrorMessage('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      console.log('🔵 Iniciando login com Google...');
      console.log('📊 Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
      
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/professional/dashboard'
      });
      
      console.log('✅ Resultado do Google signIn:', result);
      
      if (result?.error) {
        console.error('❌ Erro no Google signIn:', result.error);
        setErrorMessage(`Erro ao fazer login com Google: ${result.error}`);
        setLoading(false);
      } else if (result?.ok) {
        console.log('✅ Google signIn bem-sucedido, redirecionando...');
        window.location.href = result.url || '/professional/dashboard';
      }
    } catch (error: any) {
      console.error('❌ Erro ao fazer login com Google:', error);
      setErrorMessage(`Erro ao fazer login com Google: ${error?.message || 'Erro desconhecido'}`);
      setLoading(false);
    }
  };

  const handleCadastro = () => {
    if (tipoLogin === 'company') {
      router.push('/company/register');
    } else {
      router.push('/professional/register');
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f0f4f8', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'clamp(15px, 4vw, 20px)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: 'clamp(30px, 6vw, 50px) clamp(20px, 5vw, 40px)', 
        borderRadius: '20px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* LOGO/TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(25px, 5vw, 40px)' }}>
          <h1 style={{ 
            color: '#001f3f', 
            fontSize: 'clamp(24px, 6vw, 32px)', 
            fontWeight: 900, 
            margin: '0 0 10px 0' 
          }}>
            RECRUTA INDÚSTRIA
          </h1>
          <p style={{ color: '#666', fontSize: 'clamp(14px, 3vw, 16px)', margin: 0 }}>
            Conectando talentos à indústria
          </p>
        </div>

        {/* SELETOR DE TIPO DE LOGIN */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px',
          backgroundColor: '#f8f9fa',
          padding: '5px',
          borderRadius: '10px'
        }}>
          <button
            type="button"
            onClick={() => setTipoLogin('professional')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: tipoLogin === 'professional' ? '#003366' : 'transparent',
              color: tipoLogin === 'professional' ? 'white' : '#666',
              transition: 'all 0.3s'
            }}
          >
            PROFISSIONAL
          </button>
          <button
            type="button"
            onClick={() => setTipoLogin('company')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: tipoLogin === 'company' ? '#001f3f' : 'transparent',
              color: tipoLogin === 'company' ? 'white' : '#666',
              transition: 'all 0.3s'
            }}
          >
            EMPRESA
          </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* MENSAGEM DE ERRO */}
          {errorMessage && (
            <div style={{
              backgroundColor: errorMessage.includes('Muitas tentativas') ? '#fef2f2' : '#fee2e2',
              border: errorMessage.includes('Muitas tentativas') ? '2px solid #dc2626' : '2px solid #ef4444',
              borderRadius: '10px',
              padding: '16px',
              color: errorMessage.includes('Muitas tentativas') ? '#7f1d1d' : '#991b1b',
              fontSize: errorMessage.includes('Muitas tentativas') ? '15px' : '14px',
              fontWeight: 'bold'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>❌</span>
                <span>{errorMessage}</span>
              </div>
              {errorMessage.includes('Muitas tentativas') && (
                <div style={{ 
                  fontSize: '13px', 
                  marginTop: '8px', 
                  paddingTop: '8px', 
                  borderTop: '1px solid rgba(0,0,0,0.1)',
                  opacity: 0.8
                }}>
                  💡 Dica: Você pode tentar com outro IP/WiFi ou contatar um administrador para desbloquear.
                </div>
              )}
            </div>
          )}

          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: '8px', 
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Email
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '14px',
                border: '2px solid #cbd5e0',
                borderRadius: '10px',
                fontSize: '16px',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s',
                backgroundColor: '#ffffff',
                color: '#001f3f'
              }}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontWeight: 'bold', 
              marginBottom: '8px', 
              color: '#001f3f',
              fontSize: '14px'
            }}>
              Senha
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                value={formData.senha}
                onChange={(e) => setFormData({...formData, senha: e.target.value})}
                style={{
                  width: '100%',
                  padding: '14px 40px 14px 14px',
                  border: '2px solid #cbd5e0',
                  borderRadius: '10px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s',
                  backgroundColor: '#ffffff',
                  color: '#001f3f'
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#001f3f',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {showCaptcha && (
            <MathCaptcha onVerify={(valid) => setCaptchaVerified(valid)} />
          )}

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : (tipoLogin === 'professional' ? '#003366' : '#001f3f'),
              color: 'white',
              padding: '16px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s',
              marginTop: '10px'
            }}
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>

        {/* DIV */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          margin: '30px 0' 
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
          <span style={{ color: '#999', fontSize: '14px' }}>OU</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
        </div>

        {/* GOOGLE SIGN IN */}
        {mounted && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#fff',
              color: '#333',
              padding: '14px',
              border: '2px solid #ddd',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            G Entrar com Google
          </button>
        )}

        {/* BOTÃO DE CADASTRO */}
        <button
          type="button"
          onClick={handleCadastro}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: '#ffc107',
            color: '#001f3f',
            padding: '16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s'
          }}
        >
          CRIAR CONTA
        </button>

        {/* LINK PARA HOME */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Voltar para página inicial
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

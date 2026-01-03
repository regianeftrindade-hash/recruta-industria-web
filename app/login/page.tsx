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

  React.useEffect(() => {
    const tipo = searchParams.get('tipo');
    if (tipo === 'empresa') {
      setTipoLogin('company');
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
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.senha,
        redirect: false,
      });

      if (result?.error) {
        setErrorMessage('Email ou senha inválidos');
        setLoading(false);
        return;
      }

      if (result?.ok) {
        // Redirecionar para dashboard apropriado
        const redirectUrl = tipoLogin === 'professional' 
          ? '/professional/dashboard' 
          : '/company/dashboard-empresa';
        router.push(redirectUrl);
      }
    } catch (error) {
      setErrorMessage('Erro ao fazer login. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', {
        redirect: true,
        callbackUrl: '/professional/dashboard'
      });
    } catch (error) {
      setErrorMessage('Erro ao fazer login com Google');
      setLoading(false);
    }
  };

  const handleCadastro = () => {
    router.push(`/login/criar-conta?tipo=${tipoLogin}`);
  };

  return (
    <div style={{ 
      backgroundColor: '#f0f4f8', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '50px 40px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* LOGO/TÍTULO */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ 
            color: '#001f3f', 
            fontSize: '32px', 
            fontWeight: 900, 
            margin: '0 0 10px 0' 
          }}>
            RECRUTA INDÚSTRIA
          </h1>
          <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
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
              backgroundColor: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '10px',
              padding: '12px',
              color: '#991b1b',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ❌ {errorMessage}
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
            <input
              type="password"
              placeholder="Digite sua senha"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
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

        {/* DIVISOR */}
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
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
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

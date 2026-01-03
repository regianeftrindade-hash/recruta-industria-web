"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkRateLimit } from '@/lib/security';
import MathCaptcha from '../components/MathCaptcha';

export default function Login() {
  const router = useRouter();
  const [tipoLogin, setTipoLogin] = useState<'profissional' | 'empresa'>('profissional');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo');
    if (tipo === 'empresa') {
      setTipoLogin('empresa');
    }
  }, []);
  const [formData, setFormData] = useState({
    identificacao: '',
    senha: ''
  });
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validação simples
    if (!formData.identificacao || !formData.senha) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    // Verificar rate limiting
    if (!checkRateLimit(formData.identificacao)) {
      setErrorMessage('Muitas tentativas de login. Tente novamente em 15 minutos.');
      setShowCaptcha(true);
      return;
    }

    // Verificar captcha se necessário
    if (showCaptcha && !captchaVerified) {
      setErrorMessage('Por favor, resolva o captcha antes de continuar.');
      return;
    }

    // Redireciona para o dashboard apropriado
    if (tipoLogin === 'profissional') {
      router.push('/professional/dashboard');
    } else {
      router.push('/company/dashboard-empresa');
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
            onClick={() => setTipoLogin('profissional')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: tipoLogin === 'profissional' ? '#003366' : 'transparent',
              color: tipoLogin === 'profissional' ? 'white' : '#666',
              transition: 'all 0.3s'
            }}
          >
            PROFISSIONAL
          </button>
          <button
            onClick={() => setTipoLogin('empresa')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              backgroundColor: tipoLogin === 'empresa' ? '#001f3f' : 'transparent',
              color: tipoLogin === 'empresa' ? 'white' : '#666',
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
              {errorMessage}
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
              {tipoLogin === 'profissional' ? 'CPF ou Email' : 'CNPJ ou Email'}
            </label>
            <input
              type="text"
              placeholder={tipoLogin === 'profissional' ? 'Digite seu CPF ou email' : 'Digite o CNPJ ou email'}
              value={formData.identificacao}
              onChange={(e) => setFormData({...formData, identificacao: e.target.value})}
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
              onFocus={(e) => e.currentTarget.style.borderColor = tipoLogin === 'profissional' ? '#003366' : '#001f3f'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}
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
              onFocus={(e) => e.currentTarget.style.borderColor = tipoLogin === 'profissional' ? '#003366' : '#001f3f'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#cbd5e0'}
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
            style={{
              backgroundColor: tipoLogin === 'profissional' ? '#003366' : '#001f3f',
              color: 'white',
              padding: '16px',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              marginTop: '10px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            ENTRAR
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

        {/* BOTÃO DE CADASTRO */}
        <button
          onClick={handleCadastro}
          style={{
            width: '100%',
            backgroundColor: '#ffc107',
            color: '#001f3f',
            padding: '16px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          CRIAR CONTA
        </button>

        {/* LINK PARA HOME */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
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

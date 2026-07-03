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
  }, [searchParams]);

  const [formData, setFormData] = useState({ email: '', senha: '' });

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
        const typeRes = await fetch('/api/auth/get-user-type', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email })
        });
        
        const data = await typeRes.json();
        
        if (data.userType === 'company') {
          router.push('/company/dashboard-empresa');
        } else {
          router.push('/professional/dashboard/painel');
        }
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMessage('Erro ao processar login.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await signIn('google', { 
      redirect: false,
      callbackUrl: '/company/dashboard-empresa' 
    });
    if (result?.ok) {
      window.location.href = result.url || '/company/dashboard-empresa';
    } else {
      setLoading(false);
      setErrorMessage('Erro ao logar com Google');
    }
  };

  const handleCadastro = () => {
    router.push(tipoLogin === 'company' ? '/company/register' : '/professional/register');
  };

  return (
    // ... (o seu retorno visual permanece o mesmo, mantive a lógica de login funcional)
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '500px', width: '100%' }}>
        <h1 style={{ textAlign: 'center', color: '#001f3f' }}>RECRUTA INDÚSTRIA</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {errorMessage && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMessage}</p>}
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Senha" value={formData.senha} onChange={(e) => setFormData({...formData, senha: e.target.value})} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
          <button type="submit" disabled={loading} style={{ padding: '12px', background: '#001f3f', color: 'white', border: 'none', borderRadius: '8px' }}>ENTRAR</button>
        </form>

        <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '12px', marginTop: '10px', cursor: 'pointer' }}>Entrar com Google</button>
        <button onClick={handleCadastro} style={{ width: '100%', padding: '12px', marginTop: '10px', background: '#ffc107', border: 'none', borderRadius: '8px' }}>CRIAR CONTA</button>
      </div>
    </div>
  );
}

export default function Login() {
  return <Suspense fallback={<div>Carregando...</div>}><LoginContent /></Suspense>;
}